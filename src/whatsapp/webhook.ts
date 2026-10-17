import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { inboundEventsRepo } from '../db/repositories/events.repo.js';
import { messagesRepo } from '../db/repositories/messages.repo.js';
import { whatsAppClient } from './client.js';
import { parseWhatsAppWebhook } from './parser.js';
import { verifyWhatsAppSignature } from './signature.js';

export async function registerWebhookRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /webhook - Meta Webhook Verification Handshake
   */
  fastify.get('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | undefined>;

    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      logger.info('Meta WhatsApp Webhook subscription verified successfully');
      return reply.status(200).send(challenge);
    }

    logger.warn({ mode, token }, 'Unauthorized WhatsApp Webhook verification attempt');
    return reply.status(403).send('Forbidden: Verification token mismatch');
  });

  /**
   * POST /webhook - Inbound Event Receiver
   * Verifies HMAC signature, stores in queue, and replies 200 OK under 1 second.
   */
  fastify.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    const signatureHeader = request.headers['x-hub-signature-256'] as string | undefined;
    const rawBodyBuffer =
      (request as any).rawBody ??
      (typeof request.body === 'string' ? request.body : JSON.stringify(request.body));

    // Verify cryptographic signature
    const isValid = verifyWhatsAppSignature(rawBodyBuffer, signatureHeader, env.WHATSAPP_APP_SECRET);
    if (!isValid) {
      logger.warn({ signatureHeader }, 'Rejected webhook request with invalid HMAC signature');
      return reply.status(401).send({ error: 'Invalid HMAC signature' });
    }

    const payload = request.body;
    const parsed = parseWhatsAppWebhook(payload);

    // 1. Process delivery status callbacks asynchronously
    if (parsed.statuses.length > 0) {
      for (const st of parsed.statuses) {
        messagesRepo
          .updateDeliveryStatus(st.wa_message_id, st.status, st.error)
          .catch((err) => logger.debug({ err, st }, 'Failed to update delivery status'));
      }
    }

    // 2. Enqueue inbound messages idempotently into inbound_events
    if (parsed.messages.length > 0) {
      for (const msg of parsed.messages) {
        try {
          await inboundEventsRepo.enqueue(msg.wa_message_id, msg.lead_wa_id, {
            ...msg,
            _raw: msg.raw,
          });

          // Acknowledge read marker to WhatsApp asynchronously
          whatsAppClient.markAsRead(msg.wa_message_id).catch(() => {});
        } catch (err) {
          logger.error({ err, wa_message_id: msg.wa_message_id }, 'Failed to enqueue inbound event');
        }
      }
    }

    // Fast 200 OK within milliseconds
    return reply.status(200).send({ status: 'ok', received: true });
  });
}
