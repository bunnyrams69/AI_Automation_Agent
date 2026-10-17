import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { adminAuthMiddleware } from './auth.js';
import { auditRepo } from '../db/repositories/audit.repo.js';
import { conversationsRepo } from '../db/repositories/conversations.repo.js';
import { knowledgeRepo } from '../db/repositories/knowledge.repo.js';
import { leadsRepo } from '../db/repositories/leads.repo.js';
import { messagesRepo } from '../db/repositories/messages.repo.js';
import { siteImagesRepo } from '../db/repositories/site-images.repo.js';
import { sitesRepo } from '../db/repositories/sites.repo.js';
import { slotsRepo } from '../db/repositories/slots.repo.js';
import { visitsRepo } from '../db/repositories/visits.repo.js';
import { getSupabase } from '../db/client.js';
import { whatsAppClient } from '../whatsapp/client.js';
import { ConversationMode } from '../db/types.js';
import { env } from '../config/env.js';
import { calClient } from '../integrations/cal/client.js';

export async function registerAdminRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply admin auth hook strictly to routes inside this plugin scope
  fastify.addHook('preHandler', adminAuthMiddleware);

  // ============================================================================
  // 1. LEADS MANAGEMENT
  // ============================================================================

  // GET /admin/leads - Filter & List Leads
  fastify.get('/leads', async (request: FastifyRequest, reply: FastifyReply) => {
    const querySchema = z.object({
      status: z.enum(['new', 'active', 'booked', 'lost', 'opted_out']).optional(),
      score: z.enum(['cold', 'warm', 'hot', 'unscored']).optional(),
      search: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).default(20),
      offset: z.coerce.number().min(0).default(0),
    });

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const result = await leadsRepo.listLeads(parsed.data);
    return reply.send({
      data: result.leads,
      pagination: {
        total: result.total,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      },
    });
  });

  // GET /admin/leads/:id - Full Lead Dossier (Details, Conversation, Messages, Visits)
  fastify.get('/leads/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const lead = await leadsRepo.getById(id);
    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    const conversation = await conversationsRepo.getByLeadId(id);
    let messages: any[] = [];
    if (conversation) {
      messages = await messagesRepo.getByConversationId(conversation.id);
    }

    const visitsResult = await visitsRepo.list({ leadId: id });

    return reply.send({
      lead,
      conversation,
      messages,
      site_visits: visitsResult.visits,
    });
  });

  // PATCH /admin/leads/:id - Update Lead fields
  fastify.patch('/leads/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const bodySchema = z.object({
      status: z.enum(['new', 'active', 'booked', 'lost', 'opted_out']).optional(),
      score: z.enum(['cold', 'warm', 'hot', 'unscored']).optional(),
      score_reason: z.string().optional(),
      budget: z.string().optional(),
      timeline: z.string().optional(),
      preferred_location: z.string().optional(),
      summary: z.string().optional(),
      tags: z.array(z.string()).optional(),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const updated = await leadsRepo.updateFields(id, parsed.data);
    await auditRepo.log('lead', id, 'admin_update_lead', 'admin', parsed.data);

    return reply.send({ data: updated });
  });

  // ============================================================================
  // 2. SITE VISITS MANAGEMENT
  // ============================================================================

  // GET /admin/visits - List & Filter Site Visits
  fastify.get('/visits', async (request: FastifyRequest, reply: FastifyReply) => {
    const querySchema = z.object({
      leadId: z.string().uuid().optional(),
      siteId: z.string().uuid().optional(),
      status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled']).optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).default(20),
      offset: z.coerce.number().min(0).default(0),
    });

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const result = await visitsRepo.list(parsed.data);
    return reply.send({
      data: result.visits,
      pagination: {
        total: result.total,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      },
    });
  });

  // GET /admin/cal/health - Cal.com API & Event Type Health Verification
  fastify.get('/cal/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    const health = await calClient.checkHealth();
    return reply.status(health.ok ? 200 : 503).send(health);
  });

  // POST /admin/visits - Manual Visit Booking (via Cal.com with offline fallback)
  fastify.post('/visits', async (request: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      lead_id: z.string().uuid(),
      site_id: z.string().uuid().nullable().optional(),
      slot_id: z.string(), // Can be slot UUID or ISO timestamp
      notes: z.string().optional(),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const { lead_id, site_id, slot_id, notes } = parsed.data;
    const lead = await leadsRepo.getById(lead_id);
    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    const site = site_id ? await sitesRepo.getById(site_id) : null;
    const eventTypeId =
      (site?.cal_event_type_id ? Number(site.cal_event_type_id) : null) || env.CAL_DEFAULT_EVENT_TYPE_ID;

    // 1. Primary: Book via Cal.com
    if (env.CAL_API_KEY && eventTypeId && (slot_id.includes('T') || slot_id.includes(':'))) {
      try {
        const attendeeEmail = lead.email || env.CAL_FALLBACK_ATTENDEE_EMAIL;
        const booking = await calClient.createBooking({
          start: slot_id,
          eventTypeId,
          attendee: {
            name: lead.name || 'Site Visit Guest',
            email: attendeeEmail,
            timeZone: env.BUSINESS_TIMEZONE,
            phoneNumber: lead.phone,
          },
          metadata: {
            lead_id: lead.id,
            wa_id: lead.wa_id,
            site_id: site_id || '',
            source: 'admin-portal',
          },
          bookingFieldsResponses: {
            notes: notes || 'Admin manual booking',
          },
        });

        const rescheduleUrl = booking.rescheduleUrl || `https://cal.com/reschedule/${booking.uid}`;
        const cancelUrl = booking.cancelUrl || `https://cal.com/cancel/${booking.uid}`;

        const visit = await visitsRepo.createCalVisit({
          lead_id: lead.id,
          site_id: site_id || null,
          scheduled_at: booking.start,
          status: 'confirmed',
          cal_booking_uid: booking.uid,
          cal_booking_id: String(booking.id),
          cal_reschedule_url: rescheduleUrl,
          cal_cancel_url: cancelUrl,
          meeting_location: site?.location || 'On-site Development',
          notes: notes || 'Admin manual booking',
          created_by: 'admin',
        });

        await auditRepo.log('site_visit', visit.id, 'admin_cal_booking', 'admin', {
          cal_uid: booking.uid,
          scheduled_at: booking.start,
        });

        return reply.status(201).send({
          data: visit,
          cal_links: {
            reschedule_url: rescheduleUrl,
            cancel_url: cancelUrl,
          },
        });
      } catch (calErr: any) {
        return reply.status(400).send({ error: `Cal.com booking failed: ${calErr.message}` });
      }
    }

    // 2. Legacy fallback
    try {
      const booking = await slotsRepo.bookAtomic({
        leadId: parsed.data.lead_id,
        siteId: parsed.data.site_id || null,
        slotId: parsed.data.slot_id,
        createdBy: 'admin',
        notes: parsed.data.notes || 'Admin manual booking',
      });

      await auditRepo.log('site_visit', booking.visit_id, 'admin_manual_booking', 'admin', parsed.data);
      return reply.status(201).send({ data: booking });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Booking failed' });
    }
  });

  // PATCH /admin/visits/:id - Update Visit Status / Notes
  fastify.patch('/visits/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const bodySchema = z.object({
      status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled']),
      notes: z.string().optional(),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const updated = await visitsRepo.updateStatus(id, parsed.data.status, parsed.data.notes);
    await auditRepo.log('site_visit', id, 'admin_update_visit_status', 'admin', parsed.data);
    return reply.send({ data: updated });
  });

  // POST /admin/visits/:id/cancel - Atomically cancel visit (syncing Cal.com if linked)
  fastify.post('/visits/:id/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const bodySchema = z.object({
      reason: z.string().optional(),
    });

    const parsed = bodySchema.safeParse(request.body || {});
    const reason = parsed.success ? parsed.data.reason : undefined;

    // Check if visit has Cal UID
    let visit = await visitsRepo.getById(id);
    if (!visit) {
      visit = await visitsRepo.getByCalUid(id);
    }

    if (visit?.cal_booking_uid && env.CAL_API_KEY) {
      try {
        await calClient.cancelBooking(visit.cal_booking_uid, reason || 'Cancelled by admin');
      } catch (calErr: any) {
        request.log.warn({ calErr }, 'Cal.com cancel API error');
      }
    }

    await visitsRepo.cancelAtomic(visit ? visit.id : id, reason);
    await auditRepo.log('site_visit', id, 'admin_cancel_visit', 'admin', parsed.data);
    return reply.send({ success: true, message: 'Visit cancelled successfully.' });
  });

  // POST /admin/visits/:id/reschedule - Reschedule visit (syncing Cal.com if linked)
  fastify.post('/visits/:id/reschedule', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const bodySchema = z.object({
      new_slot_id: z.string(), // ISO start time or slot UUID
      reason: z.string().optional(),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const { new_slot_id, reason } = parsed.data;
    let visit = await visitsRepo.getById(id);
    if (!visit) {
      visit = await visitsRepo.getByCalUid(id);
    }
    if (!visit) {
      return reply.status(404).send({ error: 'Visit record not found' });
    }

    if (visit.cal_booking_uid && env.CAL_API_KEY) {
      try {
        const rescheduled = await calClient.rescheduleBooking(visit.cal_booking_uid, new_slot_id, reason);
        await visitsRepo.updateCalVisit(visit.cal_booking_uid, {
          scheduled_at: rescheduled.start,
          status: 'rescheduled',
        });

        await auditRepo.log('site_visit', visit.id, 'admin_reschedule_cal_visit', 'admin', parsed.data);

        return reply.send({
          success: true,
          scheduled_at: rescheduled.start,
          cal_links: {
            reschedule_url: rescheduled.rescheduleUrl,
            cancel_url: rescheduled.cancelUrl,
          },
        });
      } catch (calErr: any) {
        return reply.status(400).send({ error: `Cal.com reschedule failed: ${calErr.message}` });
      }
    }

    // Legacy fallback
    await visitsRepo.cancelAtomic(visit.id, 'Rescheduled to new slot');
    const newBooking = await slotsRepo.bookAtomic({
      leadId: visit.lead_id,
      siteId: visit.site_id,
      slotId: new_slot_id,
      createdBy: 'admin',
      notes: `Rescheduled from ${id}: ${reason || ''}`,
    });

    await auditRepo.log('site_visit', newBooking.visit_id, 'admin_reschedule_visit', 'admin', parsed.data);

    return reply.send({
      success: true,
      new_visit_id: newBooking.visit_id,
      new_scheduled_at: newBooking.visit_scheduled_at,
    });
  });


  // ============================================================================
  // 3. SITES & IMAGES CRUD
  // ============================================================================

  // GET /admin/sites
  fastify.get('/sites', async (_req, reply) => {
    const sites = await sitesRepo.listAll();
    return reply.send({ data: sites });
  });

  // POST /admin/sites
  fastify.post('/sites', async (request: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      name: z.string().min(1),
      location: z.string().min(1),
      description: z.string().min(1),
      price_range: z.string().min(1),
      highlights: z.array(z.string()).default([]),
      map_url: z.string().url().optional(),
      status: z.enum(['available', 'sold', 'hidden']).default('available'),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const created = await sitesRepo.create(parsed.data);
    await auditRepo.log('site', created.id, 'admin_create_site', 'admin', parsed.data);
    return reply.status(201).send({ data: created });
  });

  // PUT /admin/sites/:id
  fastify.put('/sites/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const updated = await sitesRepo.update(id, request.body as any);
    await auditRepo.log('site', id, 'admin_update_site', 'admin', request.body as any);
    return reply.send({ data: updated });
  });

  // DELETE /admin/sites/:id
  fastify.delete('/sites/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await sitesRepo.delete(id);
    await auditRepo.log('site', id, 'admin_delete_site', 'admin');
    return reply.send({ success: true });
  });

  // POST /admin/sites/:id/images - Register image in public Storage
  fastify.post('/sites/:id/images', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const bodySchema = z.object({
      storage_path: z.string().min(1),
      public_url: z.string().url(),
      caption: z.string().optional(),
      sort_order: z.number().int().default(0),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const image = await siteImagesRepo.create({
      site_id: id,
      ...parsed.data,
    });
    return reply.status(201).send({ data: image });
  });

  // ============================================================================
  // 4. KNOWLEDGE BASE CRUD
  // ============================================================================

  // GET /admin/knowledge
  fastify.get('/knowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await knowledgeRepo.listAll();
    return reply.send({ data: result.items, total: result.total });
  });

  // POST /admin/knowledge
  fastify.post('/knowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      category: z.string().min(1),
      active: z.boolean().default(true),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const created = await knowledgeRepo.create(parsed.data);
    await auditRepo.log('knowledge', created.id, 'admin_create_knowledge', 'admin', parsed.data);
    return reply.status(201).send({ data: created });
  });

  // PUT /admin/knowledge/:id
  fastify.put('/knowledge/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const updated = await knowledgeRepo.update(id, request.body as any);
    await auditRepo.log('knowledge', id, 'admin_update_knowledge', 'admin', request.body as any);
    return reply.send({ data: updated });
  });

  // DELETE /admin/knowledge/:id
  fastify.delete('/knowledge/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await knowledgeRepo.delete(id);
    await auditRepo.log('knowledge', id, 'admin_delete_knowledge', 'admin');
    return reply.send({ success: true });
  });

  // ============================================================================
  // 5. AVAILABILITY SLOTS
  // ============================================================================

  // GET /admin/slots
  fastify.get('/slots', async (request: FastifyRequest, reply: FastifyReply) => {
    const slots = await slotsRepo.getAvailable({ limit: 50 });
    return reply.send({ data: slots });
  });

  // POST /admin/slots
  fastify.post('/slots', async (request: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      site_id: z.string().uuid().nullable().optional(),
      starts_at: z.string().datetime(),
      ends_at: z.string().datetime(),
      capacity: z.number().int().min(1).default(1),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const slot = await slotsRepo.create(parsed.data);
    return reply.status(201).send({ data: slot });
  });

  // ============================================================================
  // 6. CONVERSATIONS & HUMAN TAKEOVER
  // ============================================================================

  // GET /admin/conversations/:leadId
  fastify.get('/conversations/:leadId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { leadId } = request.params as { leadId: string };
    const conversation = await conversationsRepo.getByLeadId(leadId);
    if (!conversation) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }
    const messages = await messagesRepo.getByConversationId(conversation.id);
    return reply.send({ conversation, messages });
  });

  // PATCH /admin/conversations/:leadId/mode - Switch between AI and Human mode
  fastify.patch('/conversations/:leadId/mode', async (request: FastifyRequest, reply: FastifyReply) => {
    const { leadId } = request.params as { leadId: string };
    const bodySchema = z.object({
      mode: z.enum(['ai', 'human']),
      assigned_to: z.string().optional(),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const conversation = await conversationsRepo.getOrCreateForLead(leadId);
    const updated = await conversationsRepo.setMode(
      conversation.id,
      parsed.data.mode as ConversationMode,
      parsed.data.assigned_to
    );

    await auditRepo.log('conversation', conversation.id, `mode_switched_to_${parsed.data.mode}`, 'admin', {
      assigned_to: parsed.data.assigned_to,
    });

    return reply.send({ data: updated });
  });

  // POST /admin/conversations/:leadId/messages - Human Agent sends outbound WhatsApp message
  fastify.post('/conversations/:leadId/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const { leadId } = request.params as { leadId: string };
    const bodySchema = z.object({
      message: z.string().min(1),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', issues: parsed.error.issues });
    }

    const lead = await leadsRepo.getById(leadId);
    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    const conversation = await conversationsRepo.getOrCreateForLead(leadId);

    // Send through WhatsApp client
    const waMsgId = await whatsAppClient.sendText(lead.phone, parsed.data.message);

    // Record outbound message in DB
    const recordedMessage = await messagesRepo.create({
      conversation_id: conversation.id,
      lead_id: lead.id,
      wa_message_id: waMsgId,
      direction: 'out',
      type: 'text',
      body: parsed.data.message,
    });

    await leadsRepo.recordOutbound(lead.id);
    await conversationsRepo.touchLastMessage(conversation.id);

    await auditRepo.log('message', recordedMessage.id, 'admin_sent_whatsapp_message', 'admin', {
      lead_id: leadId,
      message_length: parsed.data.message.length,
    });

    return reply.status(201).send({ data: recordedMessage });
  });

  // ============================================================================
  // 7. DASHBOARD STATS
  // ============================================================================

  // GET /admin/stats - Lead conversion & operational metrics
  fastify.get('/stats', async (_req, reply: FastifyReply) => {
    const supabase = getSupabase();

    // Query aggregate numbers
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: hotLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('score', 'hot');
    const { count: warmLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('score', 'warm');
    const { count: coldLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('score', 'cold');
    const { count: bookedVisits } = await supabase.from('site_visits').select('*', { count: 'exact', head: true }).eq('status', 'confirmed');
    const { count: humanConversations } = await supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('mode', 'human');

    return reply.send({
      summary: {
        total_leads: totalLeads || 0,
        score_breakdown: {
          hot: hotLeads || 0,
          warm: warmLeads || 0,
          cold: coldLeads || 0,
        },
        site_visits_confirmed: bookedVisits || 0,
        active_human_handoffs: humanConversations || 0,
      },
    });
  });
}
