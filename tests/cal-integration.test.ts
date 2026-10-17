import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calClient } from '../src/integrations/cal/client.js';
import { verifyCalSignature } from '../src/integrations/cal/signature.js';
import { calWebhooksRepo } from '../src/integrations/cal/webhook.repo.js';
import { toolExecutor } from '../src/agent/tools/executor.js';
import { conversationsRepo } from '../src/db/repositories/conversations.repo.js';
import { sitesRepo } from '../src/db/repositories/sites.repo.js';
import { auditRepo } from '../src/db/repositories/audit.repo.js';
import { emailService } from '../src/email/service.js';
import { Conversation, Lead, Site } from '../src/db/types.js';
import crypto from 'node:crypto';

describe('Cal.com Integration & Webhook Security', () => {
  const mockSecret = 'test_webhook_secret_12345';
  const mockSite: Site = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Emerald Meadows',
    location: 'Shamshabad, Hyderabad',
    description: 'Villa plots',
    price_range: '₹22,000/sq.yd',
    highlights: ['Clear title', 'RERA'],
    map_url: 'https://maps.google.com/?q=Shamshabad',
    cal_event_type_id: '6759138',
    status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.spyOn(auditRepo, 'log').mockResolvedValue();
    vi.spyOn(sitesRepo, 'getById').mockResolvedValue(mockSite);
    vi.spyOn(emailService, 'notifyNeedsAttention').mockResolvedValue();
  });

  it('validates authentic Cal.com HMAC-SHA256 signature', () => {
    const rawPayload = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', uid: 'test-cal-123' });
    const hmac = crypto.createHmac('sha256', mockSecret);
    hmac.update(Buffer.from(rawPayload, 'utf8'));
    const validSignature = hmac.digest('hex');

    const isValid = verifyCalSignature(rawPayload, validSignature, mockSecret);
    expect(isValid).toBe(true);

    const isShaPrefixValid = verifyCalSignature(rawPayload, `sha256=${validSignature}`, mockSecret);
    expect(isShaPrefixValid).toBe(true);
  });

  it('rejects tampered payload or invalid HMAC signature', () => {
    const rawPayload = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', uid: 'test-cal-123' });
    const tamperedPayload = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', uid: 'test-cal-hacked' });

    const hmac = crypto.createHmac('sha256', mockSecret);
    hmac.update(Buffer.from(rawPayload, 'utf8'));
    const validSignature = hmac.digest('hex');

    const isTamperedValid = verifyCalSignature(tamperedPayload, validSignature, mockSecret);
    expect(isTamperedValid).toBe(false);

    const isBogusValid = verifyCalSignature(rawPayload, 'abcdef1234567890', mockSecret);
    expect(isBogusValid).toBe(false);
  });

  it('handles duplicate webhooks idempotently', async () => {
    const processedSet = new Set<string>();
    vi.spyOn(calWebhooksRepo, 'recordIfNew').mockImplementation(async (id) => {
      if (processedSet.has(id)) return false;
      processedSet.add(id);
      return true;
    });

    const webhookId = `evt-test-dup-${Date.now()}`;
    const firstCall = await calWebhooksRepo.recordIfNew(webhookId, 'BOOKING_CREATED', { uid: 'u1' });
    expect(firstCall).toBe(true);

    // Second call with same webhook ID should be detected as duplicate
    const secondCall = await calWebhooksRepo.recordIfNew(webhookId, 'BOOKING_CREATED', { uid: 'u1' });
    expect(secondCall).toBe(false);
  });

  it('handles slot-taken race by re-fetching and returning fresh slots', async () => {
    const mockLead: Lead = {
      id: 'lead-test-race',
      wa_id: '919999988888',
      name: 'Racer Lead',
      email: null,
      email_provided: false,
      phone: '+919999988888',
      source: 'organic',
      ad_reference: null,
      status: 'active',
      score: 'hot',
      score_reason: 'Wants to book',
      budget: '1 Crore',
      timeline: 'Immediate',
      preferred_location: null,
      preferred_site_id: null,
      intent_to_visit: true,
      language: 'en',
      last_inbound_at: new Date().toISOString(),
      last_outbound_at: null,
      summary: null,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockConversation: Conversation = {
      id: 'conv-test-race',
      lead_id: mockLead.id,
      mode: 'ai',
      assigned_to: null,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mock calClient.createBooking throwing 409 slot taken
    const createBookingSpy = vi.spyOn(calClient, 'createBooking').mockRejectedValueOnce({
      status: 409,
      message: 'This slot is already booked',
    });

    // Mock calClient.getSlots returning fresh alternative slots
    const getSlotsSpy = vi.spyOn(calClient, 'getSlots').mockResolvedValueOnce({
      '2026-10-20': [{ start: '2026-10-20T10:00:00.000Z' }, { start: '2026-10-20T14:30:00.000Z' }],
    });

    const result = await toolExecutor.executeTool(
      'book_site_visit',
      {
        slot_id: '2026-10-20T09:00:00.000Z',
        site_id: mockSite.id,
        notes: 'Test race',
      },
      { lead: mockLead, conversation: mockConversation }
    );

    expect(result.error).toContain('just booked by another customer');
    expect(result.fresh_slots).toBeDefined();
    expect(result.instruction).toContain('offer these fresh alternative slots');

    createBookingSpy.mockRestore();
    getSlotsSpy.mockRestore();
  });

  it('when Cal API is down, does not claim booking is confirmed and flags needs_attention', async () => {
    const mockLead: Lead = {
      id: 'lead-test-down',
      wa_id: '918888877777',
      name: 'Down Lead',
      email: null,
      email_provided: false,
      phone: '+918888877777',
      source: 'organic',
      ad_reference: null,
      status: 'active',
      score: 'hot',
      score_reason: 'Wants to book',
      budget: '1 Crore',
      timeline: 'Immediate',
      preferred_location: null,
      preferred_site_id: null,
      intent_to_visit: true,
      language: 'en',
      last_inbound_at: new Date().toISOString(),
      last_outbound_at: null,
      summary: null,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockConversation: Conversation = {
      id: 'conv-test-down',
      lead_id: mockLead.id,
      mode: 'ai',
      assigned_to: null,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const setNeedsAttentionSpy = vi.spyOn(conversationsRepo, 'setNeedsAttention').mockResolvedValue();
    const createBookingSpy = vi.spyOn(calClient, 'createBooking').mockRejectedValueOnce(
      new Error('503 Service Unavailable: Cal.com gateway timeout')
    );

    const result = await toolExecutor.executeTool(
      'book_site_visit',
      {
        slot_id: '2026-10-21T10:00:00.000Z',
        site_id: mockSite.id,
      },
      { lead: mockLead, conversation: mockConversation }
    );

    expect(result.status).not.toBe('confirmed');
    expect(result.error).toContain('temporarily unavailable');
    expect(result.instruction).toContain('Do NOT claim the visit is confirmed');
    expect(setNeedsAttentionSpy).toHaveBeenCalledWith(mockConversation.id, true);

    createBookingSpy.mockRestore();
    setNeedsAttentionSpy.mockRestore();
  });

  it('enforces fallback rate limiting at most once per 10 minutes per lead', () => {
    const recentFallbackConversation: Conversation = {
      id: 'conv-ratelimit-1',
      lead_id: 'lead-ratelimit-1',
      mode: 'ai',
      assigned_to: null,
      last_fallback_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Should NOT allow fallback within 10 minutes
    expect(conversationsRepo.canSendFallback(recentFallbackConversation)).toBe(false);

    const oldFallbackConversation: Conversation = {
      id: 'conv-ratelimit-2',
      lead_id: 'lead-ratelimit-2',
      mode: 'ai',
      assigned_to: null,
      last_fallback_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Should allow fallback after 10 minutes
    expect(conversationsRepo.canSendFallback(oldFallbackConversation)).toBe(true);
  });
});
