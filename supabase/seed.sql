-- ==============================================================================
-- Supabase Seed Data: Apex Green Estates & Luxury Living
-- Realistic data for Real Estate / Villa Plots / Commercial Showrooms
-- ==============================================================================

-- 1. Seed Business Profile
INSERT INTO business_profile (
    id,
    name,
    description,
    address,
    timezone,
    working_hours,
    languages,
    handoff_phone,
    tone_guidelines
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Apex Green Estates & Luxury Living',
    'Premier gated community developers specializing in HMDA & RERA approved premium villa plots, luxury triplex villas, and high-yield commercial showrooms.',
    'Apex Corporate Hub, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    'Asia/Kolkata',
    '{"start": "09:00", "end": "19:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}'::jsonb,
    ARRAY['en', 'hi', 'te'],
    '+919876500000',
    'Friendly, warm, professional, concise sales advisor. Speak in natural WhatsApp conversational style. Reply in the lead''s preferred language (English, Hindi, or Telugu). Stick strictly to verified project data. Encourage an on-site visit to inspect amenities and development work.'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. Seed Sites
INSERT INTO sites (
    id,
    name,
    location,
    description,
    price_range,
    highlights,
    map_url,
    status
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Emerald Meadows Villa Plots',
    'Shankarpally - Mokila Corridor, Hyderabad',
    '50-acre premium HMDA & RERA approved plotted community with 100% Vaastu, underground utilities, 40-foot blacktop roads, and an expansive 30,000 sq.ft clubhouse with sports arena.',
    '₹35 Lakhs - ₹75 Lakhs (₹22,000 / sq.yd)',
    ARRAY[
        'HMDA & RERA Approved (P02400005678)',
        '100% Clear Title & Spot Registration',
        'Grand Clubhouse with Swimming Pool & Sports Arena',
        'Underground Cabling, Water & Sewage Lines',
        '15 mins from Neopolis Kokapet & Financial District'
    ],
    'https://maps.google.com/?q=Emerald+Meadows+Mokila+Hyderabad',
    'available'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Skyline Sovereign Luxury Villas',
    'Narsingi - Financial District, Hyderabad',
    'Exclusive gated enclave of 80 ultra-luxury 4 & 5 BHK triplex villas featuring private plunge pools, Italian marble finishings, rooftop party decks, and smart home automation.',
    '₹2.8 Cr - ₹4.5 Cr',
    ARRAY[
        'Ultra-Luxury 4 & 5 BHK Triplex Layouts (3,800 - 5,200 sq.ft)',
        'Private Plunge Pool & Rooftop Terrace Garden',
        'RERA Approved (P02400009988) - Handover Dec 2026',
        'IGBC Platinum Pre-Certified Green Homes',
        'Direct 5-minute connectivity to ORR Exit 19 & Financial District'
    ],
    'https://maps.google.com/?q=Skyline+Sovereign+Villas+Narsingi+Hyderabad',
    'available'
),
(
    '33333333-3333-3333-3333-333333333333',
    'Apex Signature Commercial Plaza',
    'Gachibowli ORR Junction, Hyderabad',
    'Grade-A commercial retail showrooms and corporate office suites situated at the highest footfall junction. Ideal for high-end retail, clinics, cafes, and investment portfolios.',
    '₹85 Lakhs - ₹3.2 Cr',
    ARRAY[
        'Pre-leased Retail Showrooms with 8.5% Assured Rental Yield',
        'High Footfall Commercial Hub with 200ft Main Road Frontage',
        'Triple-Height Grand Entrance Lobby & Central Air-Conditioning',
        '3-Level Basements with 300+ Automated Car Parking Bays',
        'Immediate Possession & Registration'
    ],
    'https://maps.google.com/?q=Apex+Signature+Plaza+Gachibowli+Hyderabad',
    'available'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Site Images (public storage URLs)
INSERT INTO site_images (
    site_id,
    storage_path,
    public_url,
    caption,
    sort_order
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'emerald-meadows/entrance.jpg',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&auto=format&fit=crop&q=80',
    'Emerald Meadows Grand Entrance Arch & 60ft Avenue',
    1
),
(
    '11111111-1111-1111-1111-111111111111',
    'emerald-meadows/clubhouse.jpg',
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1000&auto=format&fit=crop&q=80',
    '30,000 sq.ft Resort Clubhouse with Infinity Swimming Pool',
    2
),
(
    '22222222-2222-2222-2222-222222222222',
    'skyline-sovereign/villa-exterior.jpg',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80',
    'Skyline Sovereign Triplex Villa Modern Contemporary Facade',
    1
),
(
    '22222222-2222-2222-2222-222222222222',
    'skyline-sovereign/living-room.jpg',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000&auto=format&fit=crop&q=80',
    'Double-Height Italian Marble Living & Lounge Space',
    2
),
(
    '33333333-3333-3333-3333-333333333333',
    'apex-signature/plaza-exterior.jpg',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
    'Apex Signature Plaza High-Street Retail & Corporate Facade',
    1
)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Knowledge Base (FAQs, Policies, Directions, Approvals)
INSERT INTO knowledge_base (
    title,
    content,
    category
) VALUES
(
    'Bank Loans and Financing Assistance',
    'All our projects (Emerald Meadows, Skyline Sovereign, Apex Signature) are pre-approved by leading national and private banks including SBI, HDFC Bank, ICICI Bank, and Axis Bank. Home and commercial loans up to 75% to 80% of project cost are available based on client eligibility. Our in-house banking team manages complete loan documentation at zero processing charge.',
    'financing'
),
(
    'Legal Approvals, RERA and Clear Title Guarantee',
    'All developments are 100% compliant with government regulations. Emerald Meadows is HMDA and TG RERA approved (RERA No: P02400005678). Skyline Sovereign Villas is RERA approved (RERA No: P02400009988). Apex Signature Plaza holds GHMC commercial sanction. All land titles are vetted with a 30-year certified legal search report available for inspection at our office.',
    'legal'
),
(
    'Site Visit Complimentary Cab Pickup & Drop Service',
    'We provide complimentary private AC cab pickup and drop from your residence or office anywhere across Hyderabad for your site visit. You will be accompanied by a senior project consultant who walks you through plots, model villas, and clubhouse construction. Refreshments and project brochures are provided at our on-site visitor lounge.',
    'site_visit'
),
(
    'Plot Sizes and Pricing at Emerald Meadows',
    'Emerald Meadows plots are available in popular dimensions: 167 sq.yds, 200 sq.yds, 300 sq.yds, and 500 sq.yds. Base price is ₹22,000 per sq.yd. Corner plots and East-facing plots carry a nominal preferential location charge (PLC) of ₹1,000 per sq.yd. Total investment ranges from ₹36.7 Lakhs to ₹75 Lakhs.',
    'pricing'
),
(
    'Villa Configurations and Handover Date at Skyline Sovereign',
    'Skyline Sovereign features 4 BHK (3,800 sq.ft) and 5 BHK (5,200 sq.ft) triplex villas with private passenger elevators, private plunge pool, and covered parking for 3 cars. Construction is currently in full swing with sample villa ready for walkthrough. Structural work is 80% complete; final handover is December 2026.',
    'pricing'
),
(
    'Commercial Showroom Rental Yield at Apex Signature',
    'Retail showrooms on ground and 1st floors range from 1,200 sq.ft to 4,500 sq.ft. Pre-leased units with reputed anchor brands (banks, cafes, apparel) offer guaranteed 8.5% annual rental return with a 9-year lease agreement and 15% escalation every 3 years.',
    'pricing'
),
(
    'Booking Process and Token Amounts',
    'A site visit is strongly recommended prior to booking. To block a plot at Emerald Meadows, the initial booking token is ₹1,00,000. For Skyline Sovereign Villas, the token is ₹5,00,000. For commercial units at Apex Signature Plaza, the token is ₹2,00,000. Tokens are 100% refundable within 7 days if the purchase is not finalized.',
    'policies'
),
(
    'Directions and Operating Hours',
    'Our sites and corporate office are open 7 days a week from 9:00 AM to 7:00 PM. Emerald Meadows is located along the Shankarpally highway, 15 minutes past Mokila junction. Skyline Sovereign is 5 minutes from ORR Exit 19 (Narsingi/Gandipet). Apex Signature is located directly on Gachibowli ORR junction opposite DLF Cybercity.',
    'directions'
);

-- 5. Seed Initial Availability Slots (Tomorrow & Next 7 Days)
-- Generate morning (10:30 AM), afternoon (02:30 PM), and evening (04:30 PM) slots
DO $$
DECLARE
    v_date DATE;
    v_slot_time TIMESTAMPTZ;
    v_site_plot UUID := '11111111-1111-1111-1111-111111111111';
    v_site_villa UUID := '22222222-2222-2222-2222-222222222222';
    v_site_comm UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    FOR i IN 1..7 LOOP
        v_date := (CURRENT_DATE + (i || ' day')::INTERVAL)::DATE;

        -- Emerald Meadows Slots
        -- Morning slot: 10:30 AM IST (05:00 UTC)
        v_slot_time := (v_date || ' 10:30:00+05:30')::TIMESTAMPTZ;
        INSERT INTO availability_slots (site_id, starts_at, ends_at, capacity, booked_count)
        VALUES (v_site_plot, v_slot_time, v_slot_time + INTERVAL '90 minutes', 2, 0);

        -- Afternoon slot: 02:30 PM IST (09:00 UTC)
        v_slot_time := (v_date || ' 14:30:00+05:30')::TIMESTAMPTZ;
        INSERT INTO availability_slots (site_id, starts_at, ends_at, capacity, booked_count)
        VALUES (v_site_plot, v_slot_time, v_slot_time + INTERVAL '90 minutes', 2, 0);

        -- Skyline Sovereign Slots
        -- Morning slot: 11:00 AM IST
        v_slot_time := (v_date || ' 11:00:00+05:30')::TIMESTAMPTZ;
        INSERT INTO availability_slots (site_id, starts_at, ends_at, capacity, booked_count)
        VALUES (v_site_villa, v_slot_time, v_slot_time + INTERVAL '90 minutes', 2, 0);

        -- Evening slot: 04:30 PM IST
        v_slot_time := (v_date || ' 16:30:00+05:30')::TIMESTAMPTZ;
        INSERT INTO availability_slots (site_id, starts_at, ends_at, capacity, booked_count)
        VALUES (v_site_villa, v_slot_time, v_slot_time + INTERVAL '90 minutes', 2, 0);

        -- General / Commercial Slots
        v_slot_time := (v_date || ' 15:00:00+05:30')::TIMESTAMPTZ;
        INSERT INTO availability_slots (site_id, starts_at, ends_at, capacity, booked_count)
        VALUES (v_site_comm, v_slot_time, v_slot_time + INTERVAL '90 minutes', 2, 0);
    END LOOP;
END $$;
