export type LeadStatus = 'new' | 'active' | 'booked' | 'lost' | 'opted_out';
export type LeadScore = 'cold' | 'warm' | 'hot' | 'unscored';
export type ConversationMode = 'ai' | 'human';
export type MessageDirection = 'in' | 'out';
export type MessageType =
  | 'text'
  | 'audio'
  | 'image'
  | 'interactive'
  | 'status'
  | 'location'
  | 'template'
  | 'other';
export type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type EventStatus = 'pending' | 'processing' | 'done' | 'failed';
export type SiteStatus = 'available' | 'sold' | 'hidden';
export type VisitStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled';
export type FollowUpKind = 'warm_nurture' | 'cold_nurture' | 'visit_reminder' | 'no_reply';
export type FollowUpStatus = 'pending' | 'sent' | 'cancelled' | 'failed';
export type AuditActor = 'agent' | 'admin' | 'system';

export interface BusinessProfile {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  timezone: string;
  working_hours: {
    start: string;
    end: string;
    days: string[];
  };
  languages: string[];
  handoff_phone: string | null;
  tone_guidelines: string | null;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  name: string;
  location: string;
  description: string;
  price_range: string;
  highlights: string[];
  map_url: string | null;
  cal_event_type_id?: string | null;
  status: SiteStatus;
  created_at: string;
  updated_at: string;
}

export interface SiteImage {
  id: string;
  site_id: string;
  storage_path: string;
  public_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Lead {
  id: string;
  wa_id: string;
  name: string | null;
  email?: string | null;
  email_provided?: boolean;
  phone: string;
  source: string;
  ad_reference: Record<string, unknown> | null;
  status: LeadStatus;
  score: LeadScore;
  score_reason: string | null;
  budget: string | null;
  budget_min_inr?: number | null;
  budget_max_inr?: number | null;
  budget_text?: string | null;
  timeline: string | null;
  preferred_location: string | null;
  preferred_site_id: string | null;
  intent_to_visit: boolean;
  language: string;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  summary: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  mode: ConversationMode;
  assigned_to: string | null;
  needs_attention?: boolean;
  last_fallback_at?: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  lead_id: string;
  wa_message_id: string | null;
  direction: MessageDirection;
  type: MessageType;
  body: string | null;
  transcript: string | null;
  media_id: string | null;
  media_storage_path: string | null;
  delivery_status: DeliveryStatus;
  error: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface InboundEvent {
  id: string;
  wa_message_id: string;
  lead_wa_id: string;
  payload: Record<string, unknown>;
  status: EventStatus;
  attempts: number;
  locked_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  active: boolean;
  rank?: number;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  site_id: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked_count: number;
  created_at: string;
  updated_at: string;
}

export interface SiteVisit {
  id: string;
  lead_id: string;
  site_id: string | null;
  slot_id: string | null;
  scheduled_at: string;
  status: VisitStatus;
  cal_booking_uid?: string | null;
  cal_booking_id?: string | null;
  cal_reschedule_url?: string | null;
  cal_cancel_url?: string | null;
  meeting_location?: string | null;
  pickup_request?: string | null;
  confirmation_sent_at: string | null;
  reminder_sent_at: string | null;
  notes: string | null;
  created_by: 'ai' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  kind: FollowUpKind;
  scheduled_at: string;
  template_name: string | null;
  payload: Record<string, unknown>;
  status: FollowUpStatus;
  sent_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  actor: AuditActor;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ProcessedCalWebhook {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface EmailOutboxItem {
  id: string;
  to_address: string;
  subject: string;
  text_body: string;
  html_body: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  attempts: number;
  last_error: string | null;
  related_lead_id: string | null;
  related_visit_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}
