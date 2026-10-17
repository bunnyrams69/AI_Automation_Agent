import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { followUpsRepo } from '../../db/repositories/follow-ups.repo.js';
import { leadsRepo } from '../../db/repositories/leads.repo.js';
import { messagesRepo } from '../../db/repositories/messages.repo.js';
import { sitesRepo } from '../../db/repositories/sites.repo.js';
import { visitsRepo } from '../../db/repositories/visits.repo.js';
import { emailService } from '../../email/service.js';
import { whatsAppClient } from '../../whatsapp/client.js';
import { formatWhatsAppMessage } from '../../whatsapp/format.js';
import { verifyCalSignature } from './signature.js';
import { calWebhooksRepo } from './webhook.repo.js';

export async function registerCalWebhookRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/cal/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    const signatureHeader =
      (request.headers['x-cal-signature-256'] as string | undefined) ||
      (request.headers['x-hub-signature-256'] as string | undefined);

    const rawBodyBuffer =
      (request as any).rawBody ??
      (typeof request.body === 'string' ? request.body : JSON.stringify(request.body));

    // 1. Verify HMAC signature
    const isValid = verifyCalSignature(rawBodyBuffer, signatureHeader, env.CAL_WEBHOOK_SECRET);
    if (!isValid) {
      logger.warn({ signatureHeader }, 'Rejected Cal.com webhook request with invalid HMAC signature');
      return reply.status(401).send({ error: 'Invalid Cal.com HMAC signature' });
    }

    const body = (request.body as Record<string, any>) || {};
    const triggerEvent = body.triggerEvent || body.event || 'UNKNOWN';
    const bookingPayload = body.payload || body.data || body;
    const uid = bookingPayload.uid || bookingPayload.bookingId || String(bookingPayload.id || '');

    logger.info({ triggerEvent, uid }, 'Received valid Cal.com webhook');

    // 2. Idempotency verification
    const webhookId = `${triggerEvent}-${uid}-${bookingPayload.startTime || bookingPayload.start || Date.now()}`;
    const isNew = await calWebhooksRepo.recordIfNew(webhookId, triggerEvent, body);
    if (!isNew) {
      logger.info({ webhookId }, 'Duplicate Cal.com webhook event ignored');
      return reply.status(200).send({ status: 'duplicate_ignored' });
    }

    // 3. Process event types
    try {
      if (triggerEvent === 'BOOKING_CREATED') {
        const existing = await visitsRepo.getByCalUid(uid);
        if (!existing) {
          const leadId = bookingPayload.metadata?.lead_id;
          const siteId = bookingPayload.metadata?.site_id || null;
          if (leadId) {
            await visitsRepo.createCalVisit({
              lead_id: leadId,
              site_id: siteId,
              scheduled_at: bookingPayload.startTime || bookingPayload.start,
              status: 'confirmed',
              cal_booking_uid: uid,
              cal_booking_id: String(bookingPayload.id || ''),
              cal_reschedule_url: bookingPayload.rescheduleUrl || `https://cal.com/reschedule/${uid}`,
              cal_cancel_url: bookingPayload.cancelUrl || `https://cal.com/cancel/${uid}`,
              meeting_location: bookingPayload.location || 'On-site Development',
              notes: bookingPayload.notes || null,
              created_by: 'ai',
            });
          }
        }
      } else if (triggerEvent === 'BOOKING_RESCHEDULED') {
        const visit = await visitsRepo.getByCalUid(uid);
        const newStart = bookingPayload.startTime || bookingPayload.start;

        if (visit) {
          await visitsRepo.updateCalVisit(uid, {
            scheduled_at: newStart,
            status: 'rescheduled',
          });

          // Cancel previous reminders and rebuild new ones
          await followUpsRepo.cancelPendingForLead(visit.lead_id, ['visit_reminder']);

          const scheduledDate = new Date(newStart);
          const visitTime = scheduledDate.getTime();
          const now = Date.now();
          const reminder24h = new Date(visitTime - 24 * 60 * 60 * 1000);
          const reminder2h = new Date(visitTime - 2 * 60 * 60 * 1000);

          if (reminder24h.getTime() > now) {
            await followUpsRepo.create({
              lead_id: visit.lead_id,
              kind: 'visit_reminder',
              scheduled_at: reminder24h.toISOString(),
              template_name: 'visit_reminder_24h',
              payload: { visit_id: visit.id, cal_uid: uid },
            });
          }

          if (reminder2h.getTime() > now) {
            await followUpsRepo.create({
              lead_id: visit.lead_id,
              kind: 'visit_reminder',
              scheduled_at: reminder2h.toISOString(),
              template_name: 'visit_reminder_2h',
              payload: { visit_id: visit.id, cal_uid: uid },
            });
          }

          const lead = await leadsRepo.getById(visit.lead_id);
          const site = visit.site_id ? await sitesRepo.getById(visit.site_id) : null;

          const formattedTime = scheduledDate.toLocaleString('en-IN', {
            timeZone: env.BUSINESS_TIMEZONE,
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

          // Message the lead on WhatsApp
          if (lead) {
            const rawMsg = `Your site visit to *${site?.name || 'our property'}* has been rescheduled to *${formattedTime} IST*.\nIf you have any questions, feel free to reply here!`;
            const formatted = formatWhatsAppMessage(rawMsg);
            await whatsAppClient.sendText(lead.phone, formatted).catch((e) => {
              logger.warn({ e }, 'Failed to send WhatsApp reschedule message');
            });

            // Email owner
            emailService
              .notifyBookingStatusChange({
                action: 'rescheduled',
                lead,
                siteName: site?.name || 'Property Visit',
                newTimeStr: `${formattedTime} IST`,
                calUid: uid,
              })
              .catch((e) => logger.warn({ e }, 'Failed to send reschedule email to owner'));
          }
        }
      } else if (triggerEvent === 'BOOKING_CANCELLED') {
        const visit = await visitsRepo.getByCalUid(uid);
        if (visit) {
          await visitsRepo.updateCalVisit(uid, {
            status: 'cancelled',
          });

          await followUpsRepo.cancelPendingForLead(visit.lead_id, ['visit_reminder']);

          const lead = await leadsRepo.getById(visit.lead_id);
          const site = visit.site_id ? await sitesRepo.getById(visit.site_id) : null;

          if (lead) {
            const rawMsg = `Your site visit to *${site?.name || 'our property'}* has been cancelled.\nPlease message us anytime if you would like to pick a new date!`;
            const formatted = formatWhatsAppMessage(rawMsg);
            await whatsAppClient.sendText(lead.phone, formatted).catch((e) => {
              logger.warn({ e }, 'Failed to send WhatsApp cancellation message');
            });

            emailService
              .notifyBookingStatusChange({
                action: 'cancelled',
                lead,
                siteName: site?.name || 'Property Visit',
                calUid: uid,
              })
              .catch((e) => logger.warn({ e }, 'Failed to send cancel email to owner'));
          }
        }
      }
    } catch (procErr: any) {
      logger.error({ procErr, triggerEvent, uid }, 'Error handling Cal.com webhook action');
    }

    return reply.status(200).send({ status: 'success' });
  });
}
