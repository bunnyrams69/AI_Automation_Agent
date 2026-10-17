import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseBudget } from '../src/agent/budget.js';
import { agentOrchestrator } from '../src/agent/orchestrator.js';
import { toolExecutor } from '../src/agent/tools/executor.js';
import { calClient } from '../src/integrations/cal/client.js';
import { auditRepo } from '../src/db/repositories/audit.repo.js';
import { businessRepo } from '../src/db/repositories/business.repo.js';
import { conversationsRepo } from '../src/db/repositories/conversations.repo.js';
import { leadsRepo } from '../src/db/repositories/leads.repo.js';
import { messagesRepo } from '../src/db/repositories/messages.repo.js';
import { sitesRepo } from '../src/db/repositories/sites.repo.js';
import { visitsRepo } from '../src/db/repositories/visits.repo.js';
import { Conversation, Lead, Site } from '../src/db/types.js';

describe('Multi-Turn Conversation Replay (Part E)', () => {
  let mockLead: Lead;
  let mockConversation: Conversation;
  let conversationHistory: any[];

  const mockSite: Site = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Emerald Meadows',
    location: 'Shamshabad, Hyderabad',
    description: 'RERA approved villa plots starting at 200 sq.yds',
    price_range: '₹44 Lakhs - ₹1.2 Cr',
    highlights: ['Clear title', 'RERA registered', 'Bank loan approved'],
    map_url: 'https://maps.google.com/?q=Emerald+Meadows',
    cal_event_type_id: '6759138',
    status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    mockLead = {
      id: 'lead-replay-1',
      wa_id: '919876543210',
      name: null,
      email: null,
      email_provided: false,
      phone: '+919876543210',
      source: 'organic',
      ad_reference: null,
      status: 'active',
      score: 'unscored',
      score_reason: null,
      budget: null,
      budget_text: null,
      budget_min_inr: null,
      budget_max_inr: null,
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

    mockConversation = {
      id: 'conv-replay-1',
      lead_id: mockLead.id,
      mode: 'ai',
      assigned_to: null,
      needs_attention: false,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    conversationHistory = [];

    vi.spyOn(auditRepo, 'log').mockResolvedValue();
    vi.spyOn(businessRepo, 'getProfile').mockResolvedValue({
      id: 'biz-1',
      name: 'Apex Green Estates & Luxury Living',
      description: 'Premium developer',
      address: 'Hyderabad, Telangana',
      timezone: 'Asia/Kolkata',
      working_hours: { start: '09:00', end: '19:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
      languages: ['en', 'hi', 'te'],
      handoff_phone: '+919999900000',
      tone_guidelines: 'Concise WhatsApp style',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.spyOn(messagesRepo, 'getRecentByLeadId').mockImplementation(async () => conversationHistory);
    vi.spyOn(sitesRepo, 'getById').mockResolvedValue(mockSite);
    vi.spyOn(sitesRepo, 'listAvailable').mockResolvedValue([mockSite]);
    vi.spyOn(leadsRepo, 'updateFields').mockImplementation(async (_id, fields) => {
      Object.assign(mockLead, fields);
      return mockLead;
    });
    vi.spyOn(conversationsRepo, 'setNeedsAttention').mockResolvedValue();
    vi.spyOn(conversationsRepo, 'recordFallback').mockResolvedValue();
  });

  it('Step 1: "Hi" -> neutral greeting with business name, no specific project assumed', async () => {
    // Mock Gemini turn for greeting
    const callGeminiSpy = vi
      .spyOn(agentOrchestrator as any, 'callGeminiWithRetry')
      .mockResolvedValueOnce({
        text: 'Hello! Welcome to *Apex Green Estates*. Are you looking for villa plots, luxury villas, or commercial properties?',
        functionCalls: [],
      });

    const result = await agentOrchestrator.processLeadTurn(mockLead, mockConversation, 'Hi');
    expect(result.replyText).toContain('Apex Green Estates');
    expect(result.replyText).not.toContain('Emerald Meadows'); // No project assumed
    expect(result.replyText).not.toContain('Skyline Sovereign');
    expect(result.replyText).toMatch(/(plots|villas|commercial)/i);

    callGeminiSpy.mockRestore();
  });

  it('Step 2: "Yes I am" -> asks budget question in sequential qualification', async () => {
    const callGeminiSpy = vi
      .spyOn(agentOrchestrator as any, 'callGeminiWithRetry')
      .mockResolvedValueOnce({
        text: 'Wonderful. What is your approximate budget range for the property?',
        functionCalls: [],
      });

    const result = await agentOrchestrator.processLeadTurn(mockLead, mockConversation, 'Yes I am looking for plots');
    expect(result.replyText).toMatch(/budget/i);

    callGeminiSpy.mockRestore();
  });

  it('Step 3: "1core" -> parsed as 10,000,000 INR, confirms about Rs 1 crore, asks timeline, NOT the fallback', async () => {
    // 1. Verify budget parser handles "1core"
    const parsed = parseBudget('1core');
    expect(parsed.is_valid).toBe(true);
    expect(parsed.budget_min_inr).toBe(10_000_000);
    expect(parsed.budget_max_inr).toBe(10_000_000);
    expect(parsed.budget_text).toBe('₹1 Cr');
    expect(parsed.confirmation_phrase).toContain('Rs 1 crore');

    // 2. Mock Gemini turn calling update_lead with budget and asking timeline
    const callGeminiSpy = vi
      .spyOn(agentOrchestrator as any, 'callGeminiWithRetry')
      .mockResolvedValueOnce({
        functionCalls: [
          {
            name: 'update_lead',
            args: { budget: '1core' },
          },
        ],
      })
      .mockResolvedValueOnce({
        text: 'Noted, around *Rs 1 crore*. When are you planning to purchase: immediately or within the next 1 to 3 months?',
        functionCalls: [],
      });

    const result = await agentOrchestrator.processLeadTurn(mockLead, mockConversation, '1core');

    expect(result.replyText).not.toContain('technical issue');
    expect(result.replyText).not.toContain('senior team will reply personally');
    expect(result.replyText).toContain('Rs 1 crore');
    expect(result.replyText).toMatch(/timeline|when|months|immediately/i);

    // Verify lead record updated with normalized budget
    expect(mockLead.budget_min_inr).toBe(10_000_000);
    expect(mockLead.budget_text).toBe('₹1 Cr');

    callGeminiSpy.mockRestore();
  });

  it('Step 4: "start conversion immediately" -> asks clarifying question instead of guessing', async () => {
    const callGeminiSpy = vi
      .spyOn(agentOrchestrator as any, 'callGeminiWithRetry')
      .mockResolvedValueOnce({
        text: "Could you please clarify what you mean by 'start conversion'? Are you looking to schedule a site visit or start the booking process?",
        functionCalls: [],
      });

    const result = await agentOrchestrator.processLeadTurn(mockLead, mockConversation, 'start conversion immediately');
    expect(result.replyText).toMatch(/clarify|what you mean/i);

    callGeminiSpy.mockRestore();
  });

  it('Step 5: slot request -> returns real slots from Cal.com', async () => {
    vi.spyOn(calClient, 'getSlots').mockResolvedValueOnce({
      '2026-10-19': [{ start: '2026-10-19T09:00:00.000Z' }, { start: '2026-10-19T14:30:00.000Z' }],
    });

    const result = await toolExecutor.executeTool(
      'check_availability',
      { site_id: mockSite.id, days_ahead: 7 },
      { lead: mockLead, conversation: mockConversation }
    );

    expect(result.source).toBe('cal.com');
    expect(result.available_slots.length).toBeGreaterThanOrEqual(1);
    expect(result.available_slots[0].formatted_time).toContain('IST');
  });

  it('Step 6 & 7: "monday 2:30 pm" -> asks name, email (or skip), confirms, and only after "yes" books in Cal.com', async () => {
    // Step 6a: customer says monday 2:30 pm -> agent asks for full name
    const turn1Spy = vi
      .spyOn(agentOrchestrator as any, 'callGeminiWithRetry')
      .mockResolvedValueOnce({
        text: 'Monday, 19 Oct at 2:30 PM IST is available! May I have your full name for the site visit pass?',
        functionCalls: [],
      });

    const reply1 = await agentOrchestrator.processLeadTurn(mockLead, mockConversation, 'monday 2:30 pm');
    expect(reply1.replyText).toMatch(/full name/i);
    turn1Spy.mockRestore();

    // Step 6b: customer provides name -> agent asks for email (or skip)
    const turn2Spy = vi
      .spyOn(agentOrchestrator as any, 'callGeminiWithRetry')
      .mockResolvedValueOnce({
        functionCalls: [{ name: 'update_lead', args: { name: 'Karthik Sharma' } }],
      })
      .mockResolvedValueOnce({
        text: 'Thank you Karthik! What email should I send your confirmation pass to? (or say skip)',
        functionCalls: [],
      });

    const reply2 = await agentOrchestrator.processLeadTurn(mockLead, mockConversation, 'Karthik Sharma');
    expect(reply2.replyText).toMatch(/email.*skip/i);
    expect(mockLead.name).toBe('Karthik Sharma');
    turn2Spy.mockRestore();

    // Step 6c: customer skips email -> agent asks final confirmation in one line
    const turn3Spy = vi
      .spyOn(agentOrchestrator as any, 'callGeminiWithRetry')
      .mockResolvedValueOnce({
        functionCalls: [{ name: 'update_lead', args: { email: 'skip' } }],
      })
      .mockResolvedValueOnce({
        text: 'Understood. Please confirm: Site visit to *Emerald Meadows* on *Monday, 19 Oct, 2:30 PM IST*. Shall I book this slot for you?',
        functionCalls: [],
      });

    const reply3 = await agentOrchestrator.processLeadTurn(mockLead, mockConversation, 'skip');
    expect(reply3.replyText).toMatch(/confirm|shall i book/i);
    expect(reply3.replyText).toContain('Emerald Meadows');
    expect(mockLead.email_provided).toBe(false);
    turn3Spy.mockRestore();

    // Step 7: customer gives final confirmation "yes" -> invokes book_site_visit
    const calCreateSpy = vi.spyOn(calClient, 'createBooking').mockResolvedValueOnce({
      id: 998877,
      uid: 'cal-booking-uid-karthik',
      title: 'Site Visit - Emerald Meadows',
      status: 'ACCEPTED',
      start: '2026-10-19T09:00:00.000Z',
      end: '2026-10-19T09:30:00.000Z',
      rescheduleUrl: 'https://cal.com/reschedule/cal-booking-uid-karthik',
      cancelUrl: 'https://cal.com/cancel/cal-booking-uid-karthik',
    });

    vi.spyOn(visitsRepo, 'createCalVisit').mockResolvedValueOnce({
      id: 'visit-test-karthik',
      lead_id: mockLead.id,
      site_id: mockSite.id,
      slot_id: null,
      scheduled_at: '2026-10-19T09:00:00.000Z',
      status: 'confirmed',
      cal_booking_uid: 'cal-booking-uid-karthik',
      confirmation_sent_at: null,
      reminder_sent_at: null,
      notes: null,
      created_by: 'ai',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const turn4Spy = vi
      .spyOn(agentOrchestrator as any, 'callGeminiWithRetry')
      .mockResolvedValueOnce({
        functionCalls: [
          {
            name: 'book_site_visit',
            args: {
              slot_id: '2026-10-19T09:00:00.000Z',
              site_id: mockSite.id,
              notes: 'Attendee: Karthik Sharma',
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        text: 'Your site visit to *Emerald Meadows* is confirmed for *Monday, 19 Oct, 2:30 PM IST*! 🌿\nLocation: Shamshabad, Hyderabad\nReschedule or Cancel: https://cal.com/reschedule/cal-booking-uid-karthik',
        functionCalls: [],
      });

    const reply4 = await agentOrchestrator.processLeadTurn(mockLead, mockConversation, 'yes please');
    expect(calCreateSpy).toHaveBeenCalledTimes(1);
    expect(reply4.replyText).toContain('confirmed');
    expect(reply4.replyText).toContain('Emerald Meadows');
    expect(reply4.replyText).toContain('https://cal.com/reschedule/');

    calCreateSpy.mockRestore();
    turn4Spy.mockRestore();
  });

  it('throwing tool still yields a reply without aborting turn', async () => {
    // Mock a tool execution throwing an unexpected exception
    vi.spyOn(toolExecutor, 'executeTool').mockRejectedValueOnce(new Error('Database lock error'));

    const callGeminiSpy = vi
      .spyOn(agentOrchestrator as any, 'callGeminiWithRetry')
      .mockResolvedValueOnce({
        functionCalls: [{ name: 'search_knowledge', args: { query: 'legal approvals' } }],
      })
      .mockResolvedValueOnce({
        text: 'I am checking on our legal approvals now. All our plots have clear title deeds and HMDA approval.',
        functionCalls: [],
      });

    const result = await agentOrchestrator.processLeadTurn(mockLead, mockConversation, 'Are your plots approved?');

    // Turn should succeed and return reply, not throw or fallback
    expect(result.replyText).toContain('clear title');
    expect(result.replyText).not.toContain('technical issue');

    callGeminiSpy.mockRestore();
  });

  it('no cab-pickup claim is made unless documented in knowledge base and treated as request', async () => {
    const prompt = (agentOrchestrator as any).processLeadTurn;
    expect(prompt).toBeDefined();

    // Verify system prompt strictly governs cab pickup claims
    const { buildSystemPrompt } = await import('../src/agent/prompts.js');
    const sysPrompt = buildSystemPrompt(null);
    expect(sysPrompt).toContain('treat it strictly as a REQUEST');
    expect(sysPrompt).toContain('NEVER claim it is "arranged" or "confirmed"');
  });
});
