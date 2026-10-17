-- Migration: 20261017000001_agent_revisions.sql
-- Description: Schema extensions for Cal.com bookings, email outbox, budget normalisation, and conversation fallback state.

-- 1. Conversation State Extensions
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS needs_attention BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_fallback_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conversations_needs_attention ON conversations(needs_attention);

-- 2. Lead Budget & Email Extensions
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS email_provided BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS budget_min_inr BIGINT,
ADD COLUMN IF NOT EXISTS budget_max_inr BIGINT,
ADD COLUMN IF NOT EXISTS budget_text TEXT;

-- 3. Site Cal Event Type Extension
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS cal_event_type_id TEXT;

-- 4. Site Visit Cal.com Integration Extensions
ALTER TABLE site_visits
ADD COLUMN IF NOT EXISTS cal_booking_uid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS cal_booking_id TEXT,
ADD COLUMN IF NOT EXISTS cal_reschedule_url TEXT,
ADD COLUMN IF NOT EXISTS cal_cancel_url TEXT,
ADD COLUMN IF NOT EXISTS meeting_location TEXT,
ADD COLUMN IF NOT EXISTS pickup_request TEXT;

CREATE INDEX IF NOT EXISTS idx_site_visits_cal_uid ON site_visits(cal_booking_uid);

-- 5. Processed Cal Webhooks (Idempotency)
CREATE TABLE IF NOT EXISTS processed_cal_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_cal_webhooks_id ON processed_cal_webhooks(webhook_id);

-- 6. Email Outbox
CREATE TABLE IF NOT EXISTS email_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_address TEXT NOT NULL,
    subject TEXT NOT NULL,
    text_body TEXT NOT NULL,
    html_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    related_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    related_visit_id UUID REFERENCES site_visits(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox(status, created_at ASC);

-- 7. Row Level Security Policies
ALTER TABLE processed_cal_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view processed_cal_webhooks"
    ON processed_cal_webhooks FOR SELECT
    TO authenticated
    USING (is_admin_user());

CREATE POLICY "Admin users can manage email_outbox"
    ON email_outbox FOR ALL
    TO authenticated
    USING (is_admin_user())
    WITH CHECK (is_admin_user());
