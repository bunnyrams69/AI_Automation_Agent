# System Architecture: WhatsApp AI Lead Qualification & Site-Visit Booking Agent

This document details the architectural design, asynchronous processing pipeline, concurrency controls, Cal.com scheduling integration, email notification subsystem, and conversational state machine powering the WhatsApp AI Agent for local real estate businesses.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    Customer([WhatsApp User / Lead]) <-->|Official WhatsApp Cloud API| Meta[Meta Graph API Gateway]
    
    subgraph Webhook Ingestion Layer
        Meta -->|POST /webhook\nHMAC-SHA256 Signed| Fastify[Fastify Server]
        Fastify -->|Timing-safe HMAC Check| SigVerifier[Signature Verifier]
        SigVerifier -->|Valid Signature| Fast200[Immediate 200 OK Response]
        SigVerifier -->|Invalid| Reject401[401 Unauthorized]
        Fast200 --> InboundQueue[(inbound_events Table)]
    end

    subgraph Cal.com Scheduling Integration
        CalService([Cal.com v2 Cloud Engine]) <-->|POST /cal/webhook\nX-Cal-Signature-256| CalHook[Cal Webhook Handler]
        CalHook -->|Idempotency Check| CalDedup[(processed_cal_webhooks)]
        CalHook --> SiteVisits[(site_visits Table)]
    end

    subgraph Asynchronous Worker Pipeline
        InboundQueue -->|SELECT ... FOR UPDATE SKIP LOCKED| Worker[Queue Worker Loop]
        Worker --> Debouncer[3-Second DB Debounce Buffer]
        Debouncer --> LeadLock[Per-Lead Concurrency Lock]
        LeadLock --> OptOutCheck{Opt-Out STOP/Cancel?}
        OptOutCheck -->|Yes| OptOutService[Set status='opted_out'\nCancel Follow-ups\nSend Confirmation]
        OptOutCheck -->|No| AudioCheck{Is Audio / Voice Note?}
        
        AudioCheck -->|Yes| MediaDownload[Download from Graph API\nSave to Supabase 'voice-notes'\nGemini Multilingual Transcribe]
        AudioCheck -->|No| TextMsg[Normalize Text & History]
        
        MediaDownload --> ModeCheck{Conversation Mode?}
        TextMsg --> ModeCheck
        
        ModeCheck -->|mode = 'human'| HumanSilence[Log Inbound Message\nSuppress AI Response]
        ModeCheck -->|mode = 'ai'| Orchestrator[Gemini Agent Orchestrator]
    end

    subgraph Agent Tools & Reasoning Loop
        Orchestrator <-->|Function Calling Max 5 Loops| Tools[Agent Tools]
        Tools <--> SearchKB[search_knowledge\nPostgreSQL FTS]
        Tools <--> SitesData[list_sites & get_site_details]
        Tools <--> ImageDispatch[send_site_images\nWhatsApp Public CDN]
        Tools <--> Scorer[classify_lead\nCOLD / WARM / HOT]
        Tools <--> BudgetNormalizer[src/agent/budget.ts\nDeterministic INR Parser]
        Tools <--> CalClient[src/integrations/cal/client.ts\nCal.com v2 Real Availability & Bookings]
        Tools <--> Handoff[handoff_to_human]
        
        Tools --> AuditLog[(audit_log Table)]
    end

    subgraph Email Notification Subsystem
        Scorer -->|HOT Lead Alert| EmailOutbox[(email_outbox Table)]
        CalClient -->|Site Visit Confirmed| EmailOutbox
        Handoff -->|Needs Attention Alert| EmailOutbox
        EmailOutbox --> EmailWorker[Email Dispatch Worker]
        EmailWorker -->|Pluggable SMTP / Resend| OwnerMailbox([Owner & Lead Inboxes])
    end

    subgraph Outbound Dispatch
        Orchestrator --> PostProcessor[formatWhatsAppMessage\nStrict Bold *x* & No Headings]
        PostProcessor --> OutboundWA[WhatsApp Client]
        OptOutService --> OutboundWA
        OutboundWA -->|Text / Image / Template| Meta
    end

    subgraph Schedulers & Admin
        CronRunner[Follow-up & Reminder Cron\nEvery 60s] -->|24h & 2h Reminders| OutboundWA
        AdminApp([Custom Admin UI Platform]) <-->|Authenticated REST API| AdminAPI[Fastify /admin Routes]
        AdminAPI <--> CalClient
    end
```

---

## 2. Ingestion & Asynchronous Queue Pipeline

Meta's Cloud API requires webhooks to return a `200 OK` response within 3 seconds; otherwise, Meta will continuously retry, causing duplicate processing.

1. **HMAC-SHA256 Signature Verification**:
   - The raw byte buffer (`request.rawBody`) is captured before JSON parsing.
   - The `x-hub-signature-256` header is computed with `crypto.timingSafeEqual` to avoid timing attacks.
2. **Sub-Second Enqueue**:
   - Inbound messages are inserted into the `inbound_events` table with `ON CONFLICT (wa_message_id) DO NOTHING`.
   - The HTTP response returns `200 OK` in less than 50 milliseconds.
3. **Database-Level Debounce**:
   - Customers often send multiple short messages in succession (e.g. "Hi", "Are plots available?", "In Shamshabad").
   - The stored procedure `claim_inbound_events()` uses `HAVING MAX(created_at) <= NOW() - INTERVAL '3 seconds'` so that a customer's turn is only claimed once they pause typing for 3 seconds, bundling them into a single coherent prompt turn.

---

## 3. Cal.com v2 Scheduling Integration

Cal.com serves as the single source of truth for all site visit bookings:

- **Live Slot Availability**: Calls `GET https://api.cal.com/v2/slots?eventTypeId=...&startTime=...&endTime=...` with header `cal-api-version: 2024-09-04`. Results are formatted into `Asia/Kolkata` time and cached in memory for 60 seconds.
- **Booking Creation**: Calls `POST https://api.cal.com/v2/bookings` with header `cal-api-version: 2024-08-13`. Automatically associates lead metadata (`lead_id`, `wa_id`, `site_id`, `source: whatsapp-agent`).
- **Cancellation & Rescheduling**: Uses `POST /v2/bookings/{uid}/cancel` and `POST /v2/bookings/{uid}/reschedule`.
- **Webhook Handshake & Idempotency**: `POST /cal/webhook` verifies the `X-Cal-Signature-256` HMAC header with `CAL_WEBHOOK_SECRET` and de-duplicates events using the `processed_cal_webhooks` table.

---

## 4. Email Notification Outbox Architecture

To ensure that email delivery issues never slow down or block instant WhatsApp replies:

1. **Asynchronous Outbox**: Emails are queued into the `email_outbox` table with HTML and plain-text versions.
2. **HTML Injection Protection**: All customer-supplied text (names, notes, inquiries) is strictly escaped via `escapeHtml()`.
3. **Retry & Backoff**: A dedicated email worker delivers pending emails via SMTP (Nodemailer) or Resend, with up to 5 retries.
4. **Triggered Notifications**:
   - **Site Visit Confirmed**: Summary sent to `NOTIFY_EMAIL` (`admin@example.com`) with lead name, WhatsApp number, site, date/time in IST, score, budget, timeline, purpose, summary, pickup request, and Cal reschedule/cancel links. A copy is sent to the lead if email was provided.
   - **HOT Lead Alert**: Instant alert when lead is classified as HOT.
   - **Needs Attention Alert**: Triggered on human handoff or technical booking failures.
   - **Booking Status Change**: Sent whenever a visit is cancelled or rescheduled.

---

## 5. Resilient AI Turn Loop & Fallbacks

- **Deterministic Numeric Budgeting**: `src/agent/budget.ts` parses expressions like `1core`, `50-60 lakhs`, `under 80L`, `1.5 cr` into clean INR integers (`10,000,000`), protecting against LLM arithmetic hallucinations.
- **Tool Error Catching**: Tool errors never abort a turn. All tool exceptions return `{ error: message }` to Gemini so the model can recover and reply.
- **Exponential Backoff**: Up to 2 retries with backoff on Gemini 429 rate-limits or 5xx server errors.
- **Per-Turn Hard Timeout**: 25-second timeout enforced via `Promise.race`.
- **Honest Fallback**: If Gemini fails after retries, sends an honest message: *"Sorry, I hit a small technical issue. Could you send that again in a minute?"* Rate-limited to at most one fallback per lead per 10 minutes.
