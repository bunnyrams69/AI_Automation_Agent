import { z } from 'zod';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { auditRepo } from '../../db/repositories/audit.repo.js';
import { conversationsRepo } from '../../db/repositories/conversations.repo.js';
import { followUpsRepo } from '../../db/repositories/follow-ups.repo.js';
import { knowledgeRepo } from '../../db/repositories/knowledge.repo.js';
import { leadsRepo } from '../../db/repositories/leads.repo.js';
import { siteImagesRepo } from '../../db/repositories/site-images.repo.js';
import { sitesRepo } from '../../db/repositories/sites.repo.js';
import { slotsRepo } from '../../db/repositories/slots.repo.js';
import { visitsRepo } from '../../db/repositories/visits.repo.js';
import { Conversation, Lead, LeadScore } from '../../db/types.js';
import { emailService } from '../../email/service.js';
import { calClient } from '../../integrations/cal/client.js';
import { whatsAppClient } from '../../whatsapp/client.js';
import { parseBudget } from '../budget.js';

export interface ToolExecutionContext {
  lead: Lead;
  conversation: Conversation;
}

export class ToolExecutor {
  /**
   * Execute a function call requested by the Gemini agent
   */
  async executeTool(name: string, args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
    logger.info({ tool: name, leadId: context.lead.id }, 'Executing agent tool call');

    // Audit log the tool execution attempt
    await auditRepo.log('agent_tool_call', context.lead.id, `tool_${name}`, 'agent', {
      args,
    });

    try {
      switch (name) {
        case 'search_knowledge':
          return await this.searchKnowledge(args.query, args.category);

        case 'list_sites':
          return await this.listSites();

        case 'get_site_details':
          return await this.getSiteDetails(args.site_id);

        case 'send_site_images':
          return await this.sendSiteImages(args.site_id, args.max_images, context);

        case 'update_lead':
          return await this.updateLead(args, context);

        case 'classify_lead':
          return await this.classifyLead(args.score, args.reason, context);

        case 'check_availability':
          return await this.checkAvailability(args.site_id, args.days_ahead);

        case 'book_site_visit':
          return await this.bookSiteVisit(args.slot_id, args.site_id, args.notes, context);

        case 'reschedule_or_cancel_visit':
          return await this.rescheduleOrCancelVisit(args.visit_id, args.action, args.new_slot_id, args.reason);

        case 'handoff_to_human':
          return await this.handoffToHuman(args.reason, context);

        default:
          return { error: `Tool ${name} is not recognized` };
      }
    } catch (err: any) {
      logger.error({ err, tool: name }, 'Tool execution encountered an error');
      const isSlotError = err.name === 'SlotNotFoundError' || (err.message && err.message.includes('SLOT_NOT_FOUND'));
      return {
        error: err.message || 'Tool execution failed',
        instruction: isSlotError
          ? 'The specified slot_id was invalid or not found. Call check_availability with the site_id to obtain valid real slot_ids, then retry book_site_visit.'
          : undefined,
      };
    }
  }

  private async searchKnowledge(query: string, category?: string) {
    if (!query) return { error: 'Query parameter is required' };
    const results = await knowledgeRepo.search(query, category, 5);
    return {
      results: results.map((r) => ({
        title: r.title,
        content: r.content,
        category: r.category,
      })),
    };
  }

  private async listSites() {
    const sites = await sitesRepo.listAvailable();
    return {
      sites: sites.map((s) => ({
        id: s.id,
        name: s.name,
        location: s.location,
        price_range: s.price_range,
        highlights: s.highlights,
        map_url: s.map_url,
      })),
    };
  }

  private async getSiteDetails(siteId: string) {
    if (!siteId) return { error: 'site_id is required' };
    const site = await sitesRepo.getById(siteId);
    if (!site) return { error: `Site with ID ${siteId} not found` };

    const images = await siteImagesRepo.listBySiteId(siteId);
    return {
      site: {
        id: site.id,
        name: site.name,
        location: site.location,
        description: site.description,
        price_range: site.price_range,
        highlights: site.highlights,
        map_url: site.map_url,
        image_count: images.length,
      },
    };
  }

  private async sendSiteImages(siteId: string, maxImages = 3, context: ToolExecutionContext) {
    if (!siteId) return { error: 'site_id is required' };
    const count = Math.min(Math.max(1, maxImages || 3), 5);
    const images = await siteImagesRepo.listBySiteId(siteId);

    if (images.length === 0) {
      return { message: 'No images available for this site' };
    }

    const selected = images.slice(0, count);
    let sent = 0;

    for (const img of selected) {
      try {
        await whatsAppClient.sendImage(context.lead.phone, img.public_url, img.caption || undefined);
        sent++;
      } catch (err) {
        logger.warn({ err, url: img.public_url }, 'Failed to send WhatsApp site image');
      }
    }

    return {
      status: 'success',
      images_sent: sent,
      details: selected.map((i) => ({ caption: i.caption, url: i.public_url })),
    };
  }

  private async updateLead(args: Record<string, any>, context: ToolExecutionContext) {
    const updates: Partial<Lead> = {};
    if (args.name) updates.name = args.name;
    if (args.budget) {
      updates.budget = args.budget;
      const parsed = parseBudget(args.budget);
      if (parsed.is_valid) {
        updates.budget_text = parsed.budget_text;
        updates.budget_min_inr = parsed.budget_min_inr;
        updates.budget_max_inr = parsed.budget_max_inr;
      }
    }
    if (args.email) {
      const emailTrim = String(args.email).trim().toLowerCase();
      if (emailTrim === 'skip' || emailTrim === 'no') {
        updates.email = null;
        updates.email_provided = false;
      } else {
        updates.email = emailTrim;
        updates.email_provided = true;
      }
    }
    if (args.timeline) updates.timeline = args.timeline;
    if (args.preferred_location) updates.preferred_location = args.preferred_location;
    if (args.preferred_site_id) updates.preferred_site_id = args.preferred_site_id;
    if (args.intent_to_visit !== undefined) updates.intent_to_visit = Boolean(args.intent_to_visit);
    if (args.summary) updates.summary = args.summary;

    const updatedLead = await leadsRepo.updateFields(context.lead.id, updates);
    Object.assign(context.lead, updatedLead);

    return { status: 'success', updated: updates };
  }

  private availabilityCache = new Map<string, { timestamp: number; data: any }>();

  private async classifyLead(score: LeadScore, reason: string, context: ToolExecutionContext) {
    const validScores: LeadScore[] = ['cold', 'warm', 'hot'];
    if (!validScores.includes(score)) {
      return { error: `Invalid score: ${score}` };
    }

    await leadsRepo.updateScore(context.lead.id, score, reason);
    context.lead.score = score;
    context.lead.score_reason = reason;

    // Send HOT lead alert email to business owner
    if (score === 'hot') {
      emailService.notifyHotLead(context.lead, reason).catch((err) => {
        logger.warn({ err }, 'Failed to dispatch hot lead email notification');
      });
    }

    // Schedule warm nurture follow-up if warm
    if (score === 'warm') {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await followUpsRepo.create({
        lead_id: context.lead.id,
        kind: 'warm_nurture',
        scheduled_at: scheduledAt,
        template_name: 'warm_lead_nurture',
      });
    }

    return { status: 'success', score, reason };
  }

  private async checkAvailability(siteId?: string, daysAhead = 7) {
    const cacheKey = `${siteId || 'default'}-${daysAhead}`;
    const cached = this.availabilityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60_000) {
      return cached.data;
    }

    const site = siteId ? await sitesRepo.getById(siteId) : null;
    const eventTypeId =
      (site?.cal_event_type_id ? Number(site.cal_event_type_id) : null) || env.CAL_DEFAULT_EVENT_TYPE_ID;

    // 1. Single source of truth: Cal.com API v2
    if (env.CAL_API_KEY && eventTypeId) {
      try {
        const now = new Date();
        const startTime = now.toISOString();
        const endTime = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

        const slotsMap = await calClient.getSlots(eventTypeId, startTime, endTime);

        const flattenedSlots: Array<{ start: string }> = [];
        for (const dateKey of Object.keys(slotsMap).sort()) {
          const daySlots = slotsMap[dateKey] || [];
          for (const s of daySlots) {
            flattenedSlots.push(s);
          }
        }

        if (flattenedSlots.length > 0) {
          const result = {
            source: 'cal.com',
            event_type_id: eventTypeId,
            available_slots: flattenedSlots.slice(0, 6).map((s) => {
              const d = new Date(s.start);
              const formatted = d.toLocaleString('en-IN', {
                timeZone: env.BUSINESS_TIMEZONE,
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              });
              return {
                slot_id: s.start,
                starts_at: s.start,
                formatted_time: `${formatted} IST`,
                site_id: siteId || null,
              };
            }),
          };

          this.availabilityCache.set(cacheKey, { timestamp: Date.now(), data: result });
          return result;
        }
      } catch (err: any) {
        logger.warn({ err: err.message, siteId }, 'Cal.com slots fetch failed; falling back to offline slot store');
      }
    }

    // 2. Legacy offline fallback (clearly marked legacy)
    const fromDate = new Date().toISOString();
    const toDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

    const slots = await slotsRepo.getAvailable({
      siteId: siteId || null,
      fromDate,
      toDate,
      limit: 6,
    });

    if (slots.length === 0) {
      return {
        message: 'No slots available in the requested date range. Please offer other days or request a custom time.',
        slots: [],
      };
    }

    const legacyResult = {
      source: 'offline_fallback_legacy',
      available_slots: slots.map((s) => {
        const dateObj = new Date(s.starts_at);
        const formatted = dateObj.toLocaleString('en-IN', {
          timeZone: env.BUSINESS_TIMEZONE,
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return {
          slot_id: s.id,
          site_id: s.site_id,
          formatted_time: `${formatted} IST`,
          starts_at: s.starts_at,
          remaining_capacity: s.capacity - s.booked_count,
        };
      }),
    };

    this.availabilityCache.set(cacheKey, { timestamp: Date.now(), data: legacyResult });
    return legacyResult;
  }

  private async bookSiteVisit(
    slotId: string,
    siteId: string,
    notes: string | undefined,
    context: ToolExecutionContext
  ) {
    if (!slotId) return { error: 'slot_id is required' };

    const site = siteId ? await sitesRepo.getById(siteId) : null;
    const eventTypeId =
      (site?.cal_event_type_id ? Number(site.cal_event_type_id) : null) || env.CAL_DEFAULT_EVENT_TYPE_ID;

    // Validate email per Part C email rule
    const emailResult = z.string().email().safeParse(context.lead.email);
    let attendeeEmail = env.CAL_FALLBACK_ATTENDEE_EMAIL;
    let emailProvided = false;

    if (emailResult.success) {
      attendeeEmail = emailResult.data;
      emailProvided = true;
    }

    const attendeeName = context.lead.name || 'Site Visit Guest';
    const attendeePhone = context.lead.phone;

    // 1. Primary: Book via Cal.com API v2
    if (env.CAL_API_KEY && eventTypeId && (slotId.includes('T') || slotId.includes(':'))) {
      try {
        const booking = await calClient.createBooking({
          start: slotId,
          eventTypeId,
          attendee: {
            name: attendeeName,
            email: attendeeEmail,
            timeZone: env.BUSINESS_TIMEZONE,
            phoneNumber: attendeePhone,
          },
          metadata: {
            lead_id: context.lead.id,
            wa_id: context.lead.wa_id,
            site_id: siteId || '',
            source: 'whatsapp-agent',
          },
          bookingFieldsResponses: {
            notes: notes || '',
          },
        });

        // Format scheduled time for user
        const scheduledDate = new Date(booking.start);
        const dateStr = scheduledDate.toLocaleString('en-IN', {
          timeZone: env.BUSINESS_TIMEZONE,
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const rescheduleUrl = booking.rescheduleUrl || `https://cal.com/reschedule/${booking.uid}`;
        const cancelUrl = booking.cancelUrl || `https://cal.com/cancel/${booking.uid}`;

        // Persist booking in site_visits with Cal UID and links
        const visit = await visitsRepo.createCalVisit({
          lead_id: context.lead.id,
          site_id: site?.id || null,
          scheduled_at: booking.start,
          status: 'confirmed',
          cal_booking_uid: booking.uid,
          cal_booking_id: String(booking.id),
          cal_reschedule_url: rescheduleUrl,
          cal_cancel_url: cancelUrl,
          meeting_location: site?.location || 'On-site Development',
          pickup_request: notes?.includes('pickup') ? notes : null,
          notes: notes || null,
          created_by: 'ai',
        });

        // Cancel existing nurture follow-ups
        await followUpsRepo.cancelPendingForLead(context.lead.id, ['warm_nurture', 'cold_nurture', 'no_reply']);

        // Schedule visit reminders (24h and 2h before)
        const visitTime = scheduledDate.getTime();
        const reminder24h = new Date(visitTime - 24 * 60 * 60 * 1000);
        const reminder2h = new Date(visitTime - 2 * 60 * 60 * 1000);
        const now = Date.now();

        if (reminder24h.getTime() > now) {
          await followUpsRepo.create({
            lead_id: context.lead.id,
            kind: 'visit_reminder',
            scheduled_at: reminder24h.toISOString(),
            template_name: 'visit_reminder_24h',
            payload: { visit_id: visit.id, site_name: site?.name, cal_uid: booking.uid },
          });
        }

        if (reminder2h.getTime() > now) {
          await followUpsRepo.create({
            lead_id: context.lead.id,
            kind: 'visit_reminder',
            scheduled_at: reminder2h.toISOString(),
            template_name: 'visit_reminder_2h',
            payload: { visit_id: visit.id, site_name: site?.name, cal_uid: booking.uid },
          });
        }

        // Send email notifications to owner and lead
        emailService
          .notifySiteVisitConfirmed({
            lead: context.lead,
            site,
            scheduledAtStr: `${dateStr} IST`,
            calBookingUid: booking.uid,
            rescheduleUrl,
            cancelUrl,
            pickupRequest: notes?.includes('pickup') ? notes : null,
            visitId: visit.id,
          })
          .catch((err) => logger.warn({ err }, 'Failed to dispatch site visit confirmation email'));

        return {
          status: 'confirmed',
          cal_booking_uid: booking.uid,
          site_name: site?.name || 'Site Visit',
          site_address: site?.location || '',
          scheduled_at: `${dateStr} IST`,
          reschedule_url: rescheduleUrl,
          cancel_url: cancelUrl,
        };
      } catch (err: any) {
        logger.error({ err, slotId, siteId }, 'Cal.com booking creation encountered error');

        const isCollision =
          err.status === 409 ||
          err.message?.toLowerCase().includes('already booked') ||
          err.message?.toLowerCase().includes('slot taken') ||
          err.message?.toLowerCase().includes('slot is not available') ||
          err.message?.toLowerCase().includes('slot collision');

        if (isCollision) {
          // Re-fetch fresh slots immediately and offer to customer
          const freshSlots = await this.checkAvailability(siteId, 7);
          return {
            error: 'The requested slot was just booked by another customer.',
            fresh_slots: freshSlots,
            instruction: 'Politely inform the customer that this slot was just taken and offer these fresh alternative slots.',
          };
        }

        // On other Cal.com failure, do NOT claim it is booked
        await conversationsRepo.setNeedsAttention(context.conversation.id, true);
        emailService
          .notifyNeedsAttention(context.lead, `Cal.com booking failure: ${err.message}`)
          .catch((e) => logger.warn({ e }, 'Failed to dispatch alert'));

        return {
          error: 'Calendar booking system temporarily unavailable.',
          instruction: 'Apologise honestly that a technical issue occurred with our booking calendar. Do NOT claim the visit is confirmed. Let the customer know our team has been notified.',
        };
      }
    }

    // 2. Offline legacy fallback
    try {
      const result = await slotsRepo.bookAtomic({
        leadId: context.lead.id,
        siteId: siteId || null,
        slotId,
        createdBy: 'ai',
        notes: notes || null,
      });

      const scheduledDate = new Date(result.visit_scheduled_at);
      const dateStr = scheduledDate.toLocaleString('en-IN', {
        timeZone: env.BUSINESS_TIMEZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      await followUpsRepo.cancelPendingForLead(context.lead.id, ['warm_nurture', 'cold_nurture', 'no_reply']);

      // Schedule visit reminders (24h and 2h before)
      const visitTime = scheduledDate.getTime();
      const reminder24h = new Date(visitTime - 24 * 60 * 60 * 1000);
      const reminder2h = new Date(visitTime - 2 * 60 * 60 * 1000);
      const now = Date.now();

      if (reminder24h.getTime() > now) {
        await followUpsRepo.create({
          lead_id: context.lead.id,
          kind: 'visit_reminder',
          scheduled_at: reminder24h.toISOString(),
          template_name: 'visit_reminder_24h',
          payload: { visit_id: result.visit_id, site_name: site?.name },
        });
      }

      if (reminder2h.getTime() > now) {
        await followUpsRepo.create({
          lead_id: context.lead.id,
          kind: 'visit_reminder',
          scheduled_at: reminder2h.toISOString(),
          template_name: 'visit_reminder_2h',
          payload: { visit_id: result.visit_id, site_name: site?.name },
        });
      }

      return {
        status: 'confirmed',
        source: 'offline_fallback_legacy',
        visit_id: result.visit_id,
        scheduled_at: `${dateStr} IST`,
        site_name: site?.name || 'Site Visit',
        site_location: site?.location || '',
        map_url: site?.map_url || '',
      };
    } catch (err: any) {
      const isSlotError = err.name === 'SlotNotFoundError' || (err.message && err.message.includes('SLOT_NOT_FOUND'));
      if (isSlotError) {
        const freshSlots = await this.checkAvailability(siteId, 7);
        return {
          error: 'The selected slot is no longer available.',
          fresh_slots: freshSlots,
          instruction: 'Offer these fresh available slots to the customer.',
        };
      }
      throw err;
    }
  }

  private async rescheduleOrCancelVisit(
    visitId: string,
    action: 'cancel' | 'reschedule',
    newSlotId?: string,
    reason?: string
  ) {
    if (!visitId) return { error: 'visit_id is required' };

    // Find visit by UUID or Cal booking UID
    let visit = await visitsRepo.getById(visitId);
    if (!visit) {
      visit = await visitsRepo.getByCalUid(visitId);
    }

    if (action === 'cancel') {
      if (visit?.cal_booking_uid && env.CAL_API_KEY) {
        try {
          await calClient.cancelBooking(visit.cal_booking_uid, reason);
        } catch (calErr: any) {
          logger.warn({ calErr }, 'Cal.com cancel API error');
        }
      }

      await visitsRepo.cancelAtomic(visit ? visit.id : visitId, reason);

      if (visit) {
        const site = visit.site_id ? await sitesRepo.getById(visit.site_id) : null;
        const lead = await leadsRepo.getById(visit.lead_id);
        if (lead) {
          emailService
            .notifyBookingStatusChange({
              action: 'cancelled',
              lead,
              siteName: site?.name || 'Property Visit',
              reason,
              calUid: visit.cal_booking_uid || undefined,
            })
            .catch((e) => logger.warn({ e }, 'Failed to dispatch cancel email'));
        }
      }

      return { status: 'cancelled', message: 'Your site visit has been cancelled successfully.' };
    }

    if (action === 'reschedule') {
      if (!newSlotId) return { error: 'new_slot_id is required for rescheduling' };
      if (!visit) return { error: 'Visit record not found' };

      if (visit.cal_booking_uid && env.CAL_API_KEY) {
        try {
          const rescheduled = await calClient.rescheduleBooking(visit.cal_booking_uid, newSlotId, reason);
          await visitsRepo.updateCalVisit(visit.cal_booking_uid, {
            scheduled_at: rescheduled.start,
            status: 'rescheduled',
          });

          const site = visit.site_id ? await sitesRepo.getById(visit.site_id) : null;
          const lead = await leadsRepo.getById(visit.lead_id);
          if (lead) {
            emailService
              .notifyBookingStatusChange({
                action: 'rescheduled',
                lead,
                siteName: site?.name || 'Property Visit',
                newTimeStr: rescheduled.start,
                reason,
                calUid: visit.cal_booking_uid,
              })
              .catch((e) => logger.warn({ e }, 'Failed to dispatch reschedule email'));
          }

          return {
            status: 'rescheduled',
            scheduled_at: rescheduled.start,
            reschedule_url: rescheduled.rescheduleUrl,
            cancel_url: rescheduled.cancelUrl,
          };
        } catch (calErr: any) {
          logger.error({ calErr }, 'Cal.com reschedule error');
          return { error: `Failed to reschedule on Cal.com: ${calErr.message}` };
        }
      }

      // Legacy fallback
      await visitsRepo.cancelAtomic(visit.id, 'Rescheduled to new slot');
      const newBooking = await slotsRepo.bookAtomic({
        leadId: visit.lead_id,
        siteId: visit.site_id,
        slotId: newSlotId,
        createdBy: 'ai',
        notes: `Rescheduled from ${visitId}: ${reason || ''}`,
      });

      return {
        status: 'rescheduled',
        new_visit_id: newBooking.visit_id,
        new_scheduled_at: newBooking.visit_scheduled_at,
      };
    }

    return { error: `Unsupported action: ${action}` };
  }

  private async handoffToHuman(reason: string, context: ToolExecutionContext) {
    await conversationsRepo.setMode(context.conversation.id, 'human');
    context.conversation.mode = 'human';
    await conversationsRepo.setNeedsAttention(context.conversation.id, true);

    await auditRepo.log('conversation_handoff', context.conversation.id, 'escalated_to_human', 'agent', {
      lead_id: context.lead.id,
      reason,
    });

    emailService.notifyNeedsAttention(context.lead, reason).catch((err) => {
      logger.warn({ err }, 'Failed to dispatch human handoff email alert');
    });

    return {
      status: 'transferred',
      message: 'Conversation mode switched to human. Human agent alerted.',
    };
  }
}

export const toolExecutor = new ToolExecutor();

