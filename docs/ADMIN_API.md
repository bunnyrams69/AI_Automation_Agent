# Admin REST API Specification

The Admin API enables your custom dashboard or internal tool to manage leads, monitor live conversations, switch between AI and human takeover mode, schedule site visits via Cal.com, maintain property listings, and review performance analytics.

---

## 1. Authentication

All routes under `/admin/*` require authentication. Two methods are supported:

### Option A: Static Admin API Key Header (Recommended for custom servers)
```http
x-admin-key: your_admin_api_key_here
```
Or via standard Bearer token:
```http
Authorization: Bearer your_admin_api_key_here
```

### Option B: Supabase Auth JWT (For future frontend platform integrations)
```http
Authorization: Bearer <supabase_jwt_access_token>
```

---

## 2. API Endpoints Reference

### 2.1 Cal.com Health & Status

#### `GET /admin/cal/health`
Verify that your Cal.com API key is active and that your default site visit event type is properly mapped.

**Response (200 OK):**
```json
{
  "ok": true,
  "user": {
    "id": 123456,
    "username": "apex-admin",
    "email": "admin@example.com",
    "timeZone": "Asia/Kolkata"
  },
  "defaultEventType": {
    "id": 1234567,
    "title": "Site Visit Meeting",
    "slug": "site-visit",
    "length": 30
  }
}
```

---

### 2.2 Leads Management

#### `GET /admin/leads`
Retrieve paginated and filtered lead records.

**Query Parameters:**
- `status` (string, optional): `new`, `active`, `booked`, `lost`, `opted_out`
- `score` (string, optional): `cold`, `warm`, `hot`, `unscored`
- `search` (string, optional): Search by name, phone number, or wa_id.
- `limit` (number, default: 20): Items per page (max 100).
- `offset` (number, default: 0): Pagination offset.

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "c1f7b822-...",
      "wa_id": "919876543210",
      "phone": "+919876543210",
      "name": "Rahul Sharma",
      "email": "rahul.sharma@example.com",
      "email_provided": true,
      "source": "ad",
      "status": "booked",
      "score": "hot",
      "score_reason": "Requested weekend site visit with ₹1 Cr budget.",
      "budget": "around Rs 1 crore",
      "budget_text": "₹1 Cr",
      "budget_min_inr": 10000000,
      "budget_max_inr": 10000000,
      "timeline": "Within 15 days",
      "preferred_location": "Mokila Corridor",
      "last_inbound_at": "2026-10-17T15:30:00Z"
    }
  ],
  "pagination": { "total": 142, "limit": 20, "offset": 0 }
}
```

#### `GET /admin/leads/:id`
Fetch complete dossier for a lead, including active conversation mode, full message transcript history, and booked visits.

---

### 2.3 Site Visits & Cal.com Appointment Management

#### `GET /admin/visits`
List scheduled site visit appointments.

**Query Parameters:**
- `status`: `confirmed`, `cancelled`, `completed`, `no_show`, `rescheduled`
- `siteId`: Filter by property UUID.
- `fromDate` & `toDate`: Filter appointment time ranges.

#### `POST /admin/visits`
Manually schedule a site visit appointment on behalf of a customer through Cal.com (with offline fallback).

**Request Body:**
```json
{
  "lead_id": "c1f7b822-...",
  "site_id": "11111111-...",
  "slot_id": "2026-10-19T09:00:00.000Z",
  "notes": "Customer requested visit for 3 BHK plots"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "visit-uuid-123",
    "lead_id": "c1f7b822-...",
    "scheduled_at": "2026-10-19T09:00:00.000Z",
    "status": "confirmed",
    "cal_booking_uid": "9TymvAbKs6JyBxbW2rc6Nc"
  },
  "cal_links": {
    "reschedule_url": "https://cal.com/reschedule/9TymvAbKs6JyBxbW2rc6Nc",
    "cancel_url": "https://cal.com/cancel/9TymvAbKs6JyBxbW2rc6Nc"
  }
}
```

#### `POST /admin/visits/:id/reschedule`
Reschedule an existing visit to a new slot via Cal.com.

**Request Body:**
```json
{
  "new_slot_id": "2026-10-20T14:30:00.000Z",
  "reason": "Customer requested afternoon timing"
}
```

#### `POST /admin/visits/:id/cancel`
Cancel an appointment in Cal.com and restore local availability.

**Request Body:**
```json
{
  "reason": "Customer had a scheduling conflict"
}
```

---

### 2.4 Conversation Takeover & Messaging

#### `POST /admin/conversations/:id/mode`
Switch between automated AI mode and human takeover.

**Request Body:**
```json
{
  "mode": "human"
}
```

#### `POST /admin/messages/send`
Send a manual outbound WhatsApp message from an admin agent.
