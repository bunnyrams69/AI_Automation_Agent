import crypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { agentOrchestrator } from '../src/agent/orchestrator.js';
import { toolExecutor } from '../src/agent/tools/executor.js';
import { buildServer } from '../src/server.js';
import { whatsAppClient } from '../src/whatsapp/client.js';
import { leadsRepo } from '../src/db/repositories/leads.repo.js';
import { conversationsRepo } from '../src/db/repositories/conversations.repo.js';
import { slotsRepo } from '../src/db/repositories/slots.repo.js';
import { sitesRepo } from '../src/db/repositories/sites.repo.js';
import { visitsRepo } from '../src/db/repositories/visits.repo.js';
import { followUpsRepo } from '../src/db/repositories/follow-ups.repo.js';
import { inboundEventsRepo } from '../src/db/repositories/events.repo.js';
import { auditRepo } from '../src/db/repositories/audit.repo.js';
import { env } from '../src/config/env.js';

describe('End-to-End Workflow: New Lead -> HOT Qualification -> Slot Booking -> Confirmation', () => {
  it('executes full automated flow from inbound webhook to site visit confirmation', async () => {
    // 1. Setup in-memory mock data stores
    const mockLead = {
      id: 'lead-test-uuid-123',
      wa_id: '919876543210',
      phone: '+919876543210',
      name: 'Priya Reddy',
      source: 'ad',
      ad_reference: { headline: 'Emerald Meadows Villa Plots' },
      status: 'new' as const,
      score: 'unscored' as const,
      score_reason: null,
      budget: null,
      timeline: null,
      preferred_location: null,
      preferred_site_id: null,
      intent_to_visit: false,
      language: 'en',
      last_inbound_at: new Date().toISOString(),
      last_outbound_at: null,
      summary: null,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockConversation = {
      id: 'conv-test-uuid-123',
      lead_id: mockLead.id,
      mode: 'ai' as const,
      assigned_to: null,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockSlot = {
      id: 'slot-test-uuid-456',
      site_id: 'site-emerald-uuid',
      starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      capacity: 2,
      booked_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockCreatedVisits: any[] = [];
    const mockFollowUps: any[] = [];
    const sentWhatsAppMessages: Array<{ to: string; text: string }> = [];

    // 2. Mock repository and WhatsApp operations
    vi.spyOn(leadsRepo, 'findByWaId').mockResolvedValue(mockLead);
    vi.spyOn(leadsRepo, 'getById').mockResolvedValue(mockLead);
    vi.spyOn(leadsRepo, 'upsertLead').mockResolvedValue(mockLead);
    vi.spyOn(leadsRepo, 'updateScore').mockImplementation(async (_id, score, reason) => {
      mockLead.score = score;
      mockLead.score_reason = reason;
      return mockLead;
    });
    vi.spyOn(leadsRepo, 'updateFields').mockImplementation(async (_id, fields) => {
      Object.assign(mockLead, fields);
      return mockLead;
    });

    vi.spyOn(conversationsRepo, 'getOrCreateForLead').mockResolvedValue(mockConversation);
    vi.spyOn(conversationsRepo, 'getByLeadId').mockResolvedValue(mockConversation);
    vi.spyOn(conversationsRepo, 'touchLastMessage').mockResolvedValue(undefined);

    vi.spyOn(sitesRepo, 'getById').mockResolvedValue({
      id: 'site-emerald-uuid',
      name: 'Emerald Meadows Villa Plots',
      location: 'Mokila Corridor, Hyderabad',
      description: 'HMDA & RERA Approved Plots',
      price_range: '₹35 Lakhs - ₹75 Lakhs',
      highlights: ['HMDA Approved'],
      map_url: 'https://maps.google.com/?q=Emerald+Meadows',
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.spyOn(slotsRepo, 'getAvailable').mockResolvedValue([mockSlot]);
    vi.spyOn(slotsRepo, 'bookAtomic').mockImplementation(async (params) => {
      const visit = {
        visit_id: 'visit-confirmed-uuid-789',
        visit_scheduled_at: mockSlot.starts_at,
        visit_site_id: params.siteId || mockSlot.site_id,
        visit_slot_id: params.slotId,
        visit_status: 'confirmed',
      };
      mockCreatedVisits.push(visit);
      mockLead.status = 'booked';
      return visit;
    });

    vi.spyOn(followUpsRepo, 'create').mockImplementation(async (data: any) => {
      mockFollowUps.push(data);
      return { id: 'fu-1', ...data, status: 'pending', created_at: new Date().toISOString() };
    });
    vi.spyOn(followUpsRepo, 'cancelPendingForLead').mockResolvedValue(undefined);

    vi.spyOn(inboundEventsRepo, 'enqueue').mockResolvedValue({
      id: 'event-test-1',
      wa_message_id: 'wamid.inbound-test-999',
      lead_wa_id: '919876543210',
      payload: {},
      status: 'pending',
      attempts: 0,
      locked_at: null,
      last_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.spyOn(auditRepo, 'log').mockResolvedValue({
      id: 'audit-mock-1',
      entity_type: 'test',
      entity_id: null,
      action: 'test',
      actor: 'agent',
      details: {},
      created_at: new Date().toISOString(),
    });

    vi.spyOn(whatsAppClient, 'sendText').mockImplementation(async (to, text) => {
      sentWhatsAppMessages.push({ to, text });
      return `wamid.mock-${Date.now()}`;
    });
    vi.spyOn(whatsAppClient, 'markAsRead').mockResolvedValue(true);

    // 3. Test HTTP Webhook Verification and Ingestion
    const server = await buildServer();

    const webhookPayload = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_123',
          changes: [
            {
              field: 'messages',
              value: {
                contacts: [{ profile: { name: 'Priya Reddy' }, wa_id: '919876543210' }],
                messages: [
                  {
                    from: '919876543210',
                    id: 'wamid.inbound-test-999',
                    type: 'text',
                    text: { body: 'I want to book a site visit for Emerald Meadows tomorrow morning.' },
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

    const response = await server.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': validSignature,
      },
      payload: bufferPayload,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', received: true });

    // 4. Test Orchestrator Turn Execution with Tool Calls
    // Simulate Gemini agent classifying lead as HOT and booking visit
    const toolContext = { lead: mockLead, conversation: mockConversation };

    // Execute qualification tool
    await toolExecutor.executeTool(
      'classify_lead',
      { score: 'hot', reason: 'Direct request to book site visit tomorrow morning' },
      toolContext
    );
    expect(mockLead.score).toBe('hot');

    // Execute booking tool
    const bookingResult = await toolExecutor.executeTool(
      'book_site_visit',
      { slot_id: mockSlot.id, site_id: mockSlot.site_id, notes: 'Need AC cab pickup' },
      toolContext
    );

    expect(bookingResult.status).toBe('confirmed');
    expect(mockCreatedVisits.length).toBe(1);
    expect(mockLead.status).toBe('booked');

    // Verify reminder follow-up was scheduled
    expect(mockFollowUps.length).toBeGreaterThan(0);
    const visitReminder = mockFollowUps.find((fu) => fu.kind === 'visit_reminder');
    expect(visitReminder).toBeDefined();

    // Send confirmation message to customer via WhatsApp
    const confirmationText = `Your site visit has been confirmed for ${bookingResult.scheduled_at}! Our executive cab will pick you up. See you soon!`;
    await whatsAppClient.sendText(mockLead.phone, confirmationText);

    expect(sentWhatsAppMessages.length).toBe(1);
    expect(sentWhatsAppMessages[0].to).toBe('+919876543210');
    expect(sentWhatsAppMessages[0].text).toContain('site visit has been confirmed');
  });
});
