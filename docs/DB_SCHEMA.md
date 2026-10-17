# Database Schema & Storage Architecture

This document describes the PostgreSQL database schema deployed on Supabase, including table structures, indexes, foreign keys, row-level security (RLS), atomic procedures, and storage buckets.

---

## 1. Tables Overview

| Table Name | Primary Key | Description |
|---|---|---|
| `business_profile` | `UUID` | Company identity, timezone, operating hours, and tone guidelines. |
| `sites` | `UUID` | Property projects (plots, villas, showrooms) with pricing, status, and `cal_event_type_id`. |
| `site_images` | `UUID` | Media gallery stored in Supabase Storage with public URLs. |
| `leads` | `UUID` | Customers with WhatsApp IDs, qualification scores, budgets, and email. |
| `conversations` | `UUID` | Active thread state per lead, tracking AI vs. Human mode, `needs_attention`, and fallback rates. |
| `messages` | `UUID` | Inbound and outbound message log with delivery receipts and transcripts. |
| `inbound_events` | `UUID` | Idempotent job queue powering background async worker processing. |
| `knowledge_base` | `UUID` | Project FAQs, policies, pricing, and approvals with full-text search. |
| `availability_slots`| `UUID` | Legacy offline appointment slots with capacity constraints. |
| `site_visits` | `UUID` | Scheduled appointments linked to Cal.com UID, links, meeting location, and pickup requests. |
| `follow_ups` | `UUID` | Automated reminder and nurture tasks evaluated by the cron scheduler. |
| `admin_users` | `UUID` | Authorized administrative accounts with role claims. |
| `audit_log` | `UUID` | Comprehensive audit trail of agent tool calls and admin actions. |
| `processed_cal_webhooks` | `UUID` | Idempotency registry for Cal.com webhook events. |
| `email_outbox` | `UUID` | Outbox queue delivering internal summaries and lead confirmations with retries. |

---

## 2. Detailed Table Definitions

### 2.1 `business_profile`
- `id` (UUID, PK, Default: `gen_random_uuid()`)
- `name` (TEXT, NOT NULL): Company business name.
- `description` (TEXT): Overview of projects and credentials.
- `address` (TEXT): Corporate office location.
- `timezone` (TEXT, NOT NULL, Default: `'Asia/Kolkata'`): Operating timezone.
- `working_hours` (JSONB): Operational schedule (e.g., `{"start":"09:00","end":"19:00"}`).
- `languages` (TEXT[], Default: `ARRAY['en', 'hi', 'te']`): Supported languages.
- `handoff_phone` (TEXT): Escalation manager contact number.
- `tone_guidelines` (TEXT): Natural conversational instructions for the AI agent.

### 2.2 `sites`
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL): Project name (e.g. "Emerald Meadows Villa Plots").
- `location` (TEXT, NOT NULL): Geographic corridor.
- `description` (TEXT, NOT NULL): Full project specifications.
- `price_range` (TEXT, NOT NULL): Verified pricing range.
- `highlights` (TEXT[]): Key features (e.g. "HMDA Approved", "Spot Registration").
- `map_url` (TEXT): Google Maps directions link.
- `cal_event_type_id` (TEXT, Nullable): Optional Cal.com event type ID override for this site.
- `status` (TEXT, CHECK: `'available' | 'sold' | 'hidden'`).

### 2.3 `leads`
- `id` (UUID, PK)
- `wa_id` (TEXT, UNIQUE, NOT NULL): WhatsApp identifier (without `+`).
- `phone` (TEXT, NOT NULL): Normalized E.164 phone number.
- `name` (TEXT): Full or first name retrieved from WhatsApp profile or AI chat.
- `email` (TEXT): Validated email address for appointment confirmations.
- `email_provided` (BOOLEAN, Default: `false`): True if lead provided email, false if skipped/fallback used.
- `source` (TEXT, Default: `'unknown'`): Acquisition source (`'ad' | 'organic'`).
- `ad_reference` (JSONB): Facebook / Instagram ad click metadata (`source_url`, `headline`).
- `status` (TEXT, CHECK: `'new' | 'active' | 'booked' | 'lost' | 'opted_out'`).
- `score` (TEXT, CHECK: `'cold' | 'warm' | 'hot' | 'unscored'`).
- `score_reason` (TEXT): Factual justification for the assigned score.
- `budget` (TEXT): Raw or normalized budget text phrase (e.g. "around Rs 1 crore").
- `budget_text` (TEXT): Clean standardized display budget (e.g. "₹1 Cr").
- `budget_min_inr` (BIGINT): Normalized minimum INR integer value (e.g. `10000000`).
- `budget_max_inr` (BIGINT): Normalized maximum INR integer value (e.g. `10000000`).
- `timeline` (TEXT): Stated buying timeframe (e.g. "Within 30 days").
- `preferred_location` (TEXT): Selected geographic corridor.
- `preferred_site_id` (UUID, FK -> `sites(id)`).
- `intent_to_visit` (BOOLEAN, Default: `false`).
- `last_inbound_at` (TIMESTAMPTZ): Crucial for 24-hour WhatsApp messaging window.
- `last_outbound_at` (TIMESTAMPTZ).
- `summary` (TEXT): Dynamic AI-generated summary of customer requirements.
- `tags` (TEXT[]).

### 2.4 `conversations`
- `id` (UUID, PK)
- `lead_id` (UUID, FK -> `leads(id)` ON DELETE CASCADE)
- `mode` (TEXT, CHECK: `'ai' | 'human'`, Default: `'ai'`)
- `assigned_to` (UUID, FK -> `admin_users(id)`)
- `needs_attention` (BOOLEAN, Default: `false`): Flagged when Gemini fails or human handoff is needed.
- `last_fallback_at` (TIMESTAMPTZ): Used to enforce the 10-minute fallback rate limit per lead.
- `last_message_at` (TIMESTAMPTZ)

### 2.5 `site_visits`
- `id` (UUID, PK)
- `lead_id` (UUID, FK -> `leads(id)` ON DELETE CASCADE)
- `site_id` (UUID, FK -> `sites(id)`)
- `slot_id` (UUID, FK -> `availability_slots(id)`, Nullable): Legacy offline slot ID.
- `scheduled_at` (TIMESTAMPTZ): UTC ISO appointment start time.
- `status` (CHECK: `'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled'`)
- `cal_booking_uid` (TEXT, UNIQUE): Cal.com booking UID.
- `cal_booking_id` (TEXT): Cal.com internal integer ID string.
- `cal_reschedule_url` (TEXT): Direct Cal.com reschedule URL.
- `cal_cancel_url` (TEXT): Direct Cal.com cancellation URL.
- `meeting_location` (TEXT): In-person property site address.
- `pickup_request` (TEXT): Pickup request location if requested by the lead.
- `notes` (TEXT): Customer special requests and booking notes.
- `created_by` (CHECK: `'ai' | 'admin'`)

### 2.6 `processed_cal_webhooks`
- `id` (UUID, PK, Default: `gen_random_uuid()`)
- `webhook_id` (TEXT, UNIQUE, NOT NULL): Compound key (`triggerEvent-uid-timestamp`) for deduplication.
- `event_type` (TEXT, NOT NULL): Event name (`BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`).
- `payload` (JSONB, NOT NULL): Full webhook payload for audit.
- `created_at` (TIMESTAMPTZ, Default: `NOW()`)

### 2.7 `email_outbox`
- `id` (UUID, PK, Default: `gen_random_uuid()`)
- `to_address` (TEXT, NOT NULL): Destination email (e.g. `admin@example.com`).
- `subject` (TEXT, NOT NULL): Email subject line.
- `text_body` (TEXT, NOT NULL): Plain text version.
- `html_body` (TEXT, NOT NULL): Sanitized HTML version with all user inputs escaped via `escapeHtml()`.
- `status` (TEXT, CHECK: `'pending' | 'sending' | 'sent' | 'failed'`, Default: `'pending'`)
- `attempts` (INTEGER, Default: 0)
- `last_error` (TEXT)
- `related_lead_id` (UUID, FK -> `leads(id)`)
- `related_visit_id` (UUID, FK -> `site_visits(id)`)
- `sent_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ, Default: `NOW()`)
- `updated_at` (TIMESTAMPTZ, Default: `NOW()`)

---

## 3. Row-Level Security (RLS) & Policies

1. All tables enforce `ROW LEVEL SECURITY`.
2. Public API access via `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS safely within server backend execution.
3. Administrative policies verify user membership via `is_admin_user()` checking `admin_users` table with authenticated session UID.
