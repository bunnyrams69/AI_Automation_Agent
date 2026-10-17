import crypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { buildServer } from '../src/server.js';
import { inboundEventsRepo } from '../src/db/repositories/events.repo.js';
import { env } from '../src/config/env.js';

describe('Webhook Delivery Idempotency & Replay Protection', () => {
  it('safely handles duplicate webhook deliveries of the same wa_message_id', async () => {
    const server = await buildServer();
    const fixedWaMessageId = 'wamid.HBgLMTIzNDU2Nzg5MA==_IDEMPOTENT_TEST';

    // In-memory mock database for inbound_events simulating unique constraint on wa_message_id
    const dbEvents = new Map<string, any>();

    vi.spyOn(inboundEventsRepo, 'enqueue').mockImplementation(async (waMessageId, leadWaId, payload) => {
      if (dbEvents.has(waMessageId)) {
        // ON CONFLICT DO NOTHING -> returns null or existing
        return null;
      }
      const event = {
        id: `event-${Date.now()}`,
        wa_message_id: waMessageId,
        lead_wa_id: leadWaId,
        payload,
        status: 'pending' as const,
        attempts: 0,
        locked_at: null,
        last_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dbEvents.set(waMessageId, event);
      return event;
    });

    const webhookPayload = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_123',
          changes: [
            {
              field: 'messages',
              value: {
                contacts: [{ profile: { name: 'Test Lead' }, wa_id: '919876543210' }],
                messages: [
                  {
                    from: '919876543210',
                    id: fixedWaMessageId,
                    type: 'text',
                    text: { body: 'Inquiring about project plots' },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    const bufferPayload = Buffer.from(webhookPayload, 'utf8');
    const hmac = crypto.createHmac('sha256', env.WHATSAPP_APP_SECRET);
    hmac.update(bufferPayload);
    const validSignature = `sha256=${hmac.digest('hex')}`;

    // 1. First webhook delivery
    const firstResponse = await server.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': validSignature,
      },
      payload: bufferPayload,
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.json()).toEqual({ status: 'ok', received: true });
    expect(dbEvents.size).toBe(1);

    // 2. Duplicate redelivery of the EXACT same message (e.g. Meta retry or network replay)
    const duplicateResponse = await server.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': validSignature,
      },
      payload: bufferPayload,
    });

    // Webhook still returns 200 OK so Meta stops retrying
    expect(duplicateResponse.statusCode).toBe(200);
    expect(duplicateResponse.json()).toEqual({ status: 'ok', received: true });

    // Database still has only 1 record (zero duplicate event created)
    expect(dbEvents.size).toBe(1);
    expect(dbEvents.has(fixedWaMessageId)).toBe(true);
  });
});
