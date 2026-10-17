-- ==============================================================================
-- Migration: 20241017000000_init_schema.sql
-- WhatsApp AI Lead Qualification & Site-Visit Booking Agent
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. BUSINESS PROFILE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS business_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    working_hours JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "19:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}'::jsonb,
    languages TEXT[] NOT NULL DEFAULT ARRAY['en', 'hi', 'te'],
    handoff_phone TEXT,
    tone_guidelines TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. SITES & DEVELOPMENTS (Real estate / plots / showrooms)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    price_range TEXT NOT NULL,
    highlights TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    map_url TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);

-- ==============================================================================
-- 3. SITE IMAGES (Stored in Supabase Storage 'site-images')
-- ==============================================================================
CREATE TABLE IF NOT EXISTS site_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_images_site_id ON site_images(site_id);

-- ==============================================================================
-- 4. LEADS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wa_id TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'unknown',
    ad_reference JSONB,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'active', 'booked', 'lost', 'opted_out')),
    score TEXT NOT NULL DEFAULT 'unscored' CHECK (score IN ('cold', 'warm', 'hot', 'unscored')),
    score_reason TEXT,
    budget TEXT,
    timeline TEXT,
    preferred_location TEXT,
    preferred_site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    intent_to_visit BOOLEAN NOT NULL DEFAULT FALSE,
    language TEXT NOT NULL DEFAULT 'en',
    last_inbound_at TIMESTAMPTZ,
    last_outbound_at TIMESTAMPTZ,
    summary TEXT,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_wa_id ON leads(wa_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- ==============================================================================
-- 5. CONVERSATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE UNIQUE,
    mode TEXT NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai', 'human')),
    assigned_to TEXT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_mode ON conversations(mode);

-- ==============================================================================
-- 6. MESSAGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    wa_message_id TEXT UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    type TEXT NOT NULL CHECK (type IN ('text', 'audio', 'image', 'interactive', 'status', 'location', 'template', 'other')),
    body TEXT,
    transcript TEXT,
    media_id TEXT,
    media_storage_path TEXT,
    delivery_status TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),
    error TEXT,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_wa_id ON messages(wa_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead ON messages(lead_id);

-- ==============================================================================
-- 7. INBOUND EVENTS (Job Queue with idempotency)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inbound_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wa_message_id TEXT UNIQUE NOT NULL,
    lead_wa_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    locked_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbound_events_status ON inbound_events(status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_inbound_events_lead ON inbound_events(lead_wa_id);

-- ==============================================================================
-- 8. KNOWLEDGE BASE (FAQs, policies, pricing notes, directions with FTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || content || ' ' || category)
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_search ON knowledge_base USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_active ON knowledge_base(active, category);

-- ==============================================================================
-- 9. AVAILABILITY SLOTS (Capacity-checked site-visit appointments)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
    booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_slot_time CHECK (ends_at > starts_at),
    CONSTRAINT chk_slot_capacity CHECK (booked_count <= capacity)
);

CREATE INDEX IF NOT EXISTS idx_slots_range ON availability_slots(starts_at ASC, ends_at ASC);
CREATE INDEX IF NOT EXISTS idx_slots_site ON availability_slots(site_id, starts_at ASC);

-- ==============================================================================
-- 10. SITE VISITS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    slot_id UUID REFERENCES availability_slots(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled')),
    confirmation_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    notes TEXT,
    created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('ai', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_lead ON site_visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_visits_slot ON site_visits(slot_id);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled ON site_visits(scheduled_at ASC);

-- ==============================================================================
-- 11. FOLLOW UPS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('warm_nurture', 'cold_nurture', 'visit_reminder', 'no_reply')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    template_name TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
    sent_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON follow_ups(status, scheduled_at ASC);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups(lead_id);

-- ==============================================================================
-- 12. ADMIN USERS & AUDIT LOG
-- ==============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'agent', 'viewer')),
    name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    action TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'agent' CHECK (actor IN ('agent', 'admin', 'system')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ==============================================================================
-- 13. CONCURRENCY-SAFE ATOMIC PROCEDURES
-- ==============================================================================

-- Stored procedure to atomically book a site visit without race conditions
CREATE OR REPLACE FUNCTION book_site_visit_atomic(
    p_lead_id UUID,
    p_site_id UUID,
    p_slot_id UUID,
    p_created_by TEXT DEFAULT 'ai',
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    visit_id UUID,
    visit_scheduled_at TIMESTAMPTZ,
    visit_site_id UUID,
    visit_slot_id UUID,
    visit_status TEXT
) AS $$
DECLARE
    v_slot availability_slots%ROWTYPE;
    v_visit site_visits%ROWTYPE;
BEGIN
    -- 1. Lock the slot row exclusively
    SELECT * INTO v_slot
    FROM availability_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SLOT_NOT_FOUND: Slot ID % does not exist', p_slot_id;
    END IF;

    -- 2. Validate capacity
    IF v_slot.booked_count >= v_slot.capacity THEN
        RAISE EXCEPTION 'SLOT_FULL: Slot % has reached max capacity of %', p_slot_id, v_slot.capacity;
    END IF;

    -- 3. Atomically increment slot booked_count
    UPDATE availability_slots
    SET booked_count = booked_count + 1,
        updated_at = NOW()
    WHERE id = p_slot_id;

    -- 4. Insert the new site visit
    INSERT INTO site_visits (
        lead_id,
        site_id,
        slot_id,
        scheduled_at,
        status,
        notes,
        created_by
    ) VALUES (
        p_lead_id,
        COALESCE(p_site_id, v_slot.site_id),
        p_slot_id,
        v_slot.starts_at,
        'confirmed',
        p_notes,
        p_created_by
    ) RETURNING * INTO v_visit;

    -- 5. Mark lead as booked
    UPDATE leads
    SET status = 'booked',
        intent_to_visit = TRUE,
        updated_at = NOW()
    WHERE id = p_lead_id;

    -- Return the created visit
    RETURN QUERY SELECT
        v_visit.id,
        v_visit.scheduled_at,
        v_visit.site_id,
        v_visit.slot_id,
        v_visit.status;
END;
$$ LANGUAGE plpgsql;

-- Stored procedure to cancel a site visit atomically
CREATE OR REPLACE FUNCTION cancel_site_visit_atomic(
    p_visit_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_visit site_visits%ROWTYPE;
BEGIN
    SELECT * INTO v_visit
    FROM site_visits
    WHERE id = p_visit_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'VISIT_NOT_FOUND: Visit % not found', p_visit_id;
    END IF;

    IF v_visit.status = 'cancelled' THEN
        RETURN TRUE; -- Already cancelled
    END IF;

    -- Update status
    UPDATE site_visits
    SET status = 'cancelled',
        notes = CASE WHEN p_reason IS NOT NULL THEN COALESCE(notes, '') || ' [Cancelled: ' || p_reason || ']' ELSE notes END,
        updated_at = NOW()
    WHERE id = p_visit_id;

    -- Decrement slot count if slot was assigned
    IF v_visit.slot_id IS NOT NULL THEN
        UPDATE availability_slots
        SET booked_count = GREATEST(0, booked_count - 1),
            updated_at = NOW()
        WHERE id = v_visit.slot_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure to atomically claim inbound events with DB-timestamp debounce
CREATE OR REPLACE FUNCTION claim_inbound_events(
    p_batch_size INTEGER DEFAULT 5,
    p_lock_timeout_seconds INTEGER DEFAULT 60,
    p_debounce_seconds INTEGER DEFAULT 3
)
RETURNS SETOF inbound_events AS $$
BEGIN
    RETURN QUERY
    WITH eligible_leads AS (
        -- Enforce debounce purely through DB timestamps: only claim events for a lead
        -- if at least p_debounce_seconds have passed since their latest incoming message!
        SELECT lead_wa_id
        FROM inbound_events
        WHERE status = 'pending'
           OR (status = 'processing' AND locked_at < NOW() - (p_lock_timeout_seconds || ' seconds')::INTERVAL)
        GROUP BY lead_wa_id
        HAVING MAX(created_at) <= NOW() - (p_debounce_seconds || ' seconds')::INTERVAL
    ),
    candidate_events AS (
        SELECT id
        FROM inbound_events
        WHERE (status = 'pending' OR (status = 'processing' AND locked_at < NOW() - (p_lock_timeout_seconds || ' seconds')::INTERVAL))
          AND lead_wa_id IN (SELECT lead_wa_id FROM eligible_leads)
        ORDER BY created_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE inbound_events e
    SET status = 'processing',
        locked_at = NOW(),
        attempts = e.attempts + 1,
        updated_at = NOW()
    FROM candidate_events c
    WHERE e.id = c.id
    RETURNING e.*;
END;
$$ LANGUAGE plpgsql;

-- Full text search function on knowledge base
CREATE OR REPLACE FUNCTION search_knowledge_base(
    p_query TEXT,
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        k.id,
        k.title,
        k.content,
        k.category,
        ts_rank(k.search_vector, plainto_tsquery('english', p_query)) AS rank
    FROM knowledge_base k
    WHERE k.active = TRUE
      AND (p_category IS NULL OR k.category = p_category)
      AND (k.search_vector @@ plainto_tsquery('english', p_query) OR k.title ILIKE '%' || p_query || '%' OR k.content ILIKE '%' || p_query || '%')
    ORDER BY rank DESC, k.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) & STORAGE BUCKETS SETUP
-- ==============================================================================

-- Enable RLS on every table
ALTER TABLE business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Security helper function: verifies membership in admin_users or role claims
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        -- 1. Check custom claim / app_metadata role
        COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), (auth.jwt() ->> 'role')) = 'admin'
        OR
        -- 2. Verify membership in admin_users table by matching authenticated email and active status
        EXISTS (
            SELECT 1
            FROM admin_users
            WHERE admin_users.email = (auth.jwt() ->> 'email')
              AND admin_users.is_active = TRUE
              AND admin_users.role IN ('admin', 'agent')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For future authenticated admin platforms using Supabase Auth:
-- Policies strictly verify membership in admin_users or valid admin role claims.
DO $$
BEGIN
    CREATE POLICY admin_all_business_profile ON business_profile FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_sites ON sites FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_site_images ON site_images FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_leads ON leads FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_conversations ON conversations FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_messages ON messages FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_inbound_events ON inbound_events FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_knowledge_base ON knowledge_base FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_availability_slots ON availability_slots FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_site_visits ON site_visits FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_follow_ups ON follow_ups FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_admin_users ON admin_users FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
    CREATE POLICY admin_all_audit_log ON audit_log FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Storage buckets setup (executed in Supabase Storage schema)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public read for site-images, Service-role only for voice-notes
DO $$
BEGIN
    CREATE POLICY "Public Access for Site Images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'site-images');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
