import { MessageType } from '../db/types.js';

export interface NormalizedInboundMessage {
  wa_message_id: string;
  lead_wa_id: string;
  phone_e164: string;
  sender_name?: string | null;
  timestamp: string;
  type: MessageType;
  body: string | null;
  media_id: string | null;
  mime_type: string | null;
  interactive_id: string | null;
  interactive_title: string | null;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  } | null;
  referral?: Record<string, unknown> | null;
  raw: Record<string, unknown>;
}

export interface NormalizedStatusUpdate {
  wa_message_id: string;
  recipient_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  error?: string | null;
}

export interface ParsedWebhook {
  isStatusUpdate: boolean;
  messages: NormalizedInboundMessage[];
  statuses: NormalizedStatusUpdate[];
}

/**
 * Normalizes phone numbers to standard E.164 format
 */
export function normalizePhone(rawPhone: string): { e164: string; wa_id: string } {
  if (!rawPhone) return { e164: '', wa_id: '' };

  // Strip all whitespace and special characters except leading +
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Handle standard 10-digit Indian numbers (default business context)
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }

  const e164 = `+${cleaned}`;
  const wa_id = cleaned;

  return { e164, wa_id };
}

/**
 * Checks if user message contains standard opt-out keywords (English, Hindi, Telugu)
 */
export function isOptOutMessage(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = text.trim().toUpperCase();

  const optOutKeywords = [
    'STOP',
    'UNSUBSCRIBE',
    'CANCEL',
    'END',
    'QUIT',
    'OPT OUT',
    'OPTOUT',
    'STOP ALL',
    'ROKO',
    'BAND KARO',
    'APPU',
    'VADDU',
  ];

  return optOutKeywords.includes(normalized);
}

/**
 * Checks if lead is within the official Meta 24-hour customer service window
 */
export function isWithin24HourWindow(lastInboundAt: string | Date | null | undefined): boolean {
  if (!lastInboundAt) return false;
  const lastTime = new Date(lastInboundAt).getTime();
  if (Number.isNaN(lastTime)) return false;

  const diffMs = Date.now() - lastTime;
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  return diffMs >= 0 && diffMs <= TWENTY_FOUR_HOURS_MS;
}

/**
 * Sanitizes input text, removing control characters and capping length
 */
export function sanitizeText(text: string | null | undefined, maxLength = 2000): string {
  if (!text) return '';
  // Strip null bytes and non-printable control characters except newlines/tabs
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Parses raw WhatsApp Webhook JSON payload from Meta Cloud API
 */
export function parseWhatsAppWebhook(body: any): ParsedWebhook {
  const result: ParsedWebhook = {
    isStatusUpdate: false,
    messages: [],
    statuses: [],
  };

  if (!body || body.object !== 'whatsapp_business_account' || !Array.isArray(body.entry)) {
    return result;
  }

  for (const entry of body.entry) {
    if (!Array.isArray(entry.changes)) continue;

    for (const change of entry.changes) {
      if (change.field !== 'messages' || !change.value) continue;

      const val = change.value;

      // Extract contact profile names if provided
      const contactMap = new Map<string, string>();
      if (Array.isArray(val.contacts)) {
        for (const contact of val.contacts) {
          if (contact.wa_id && contact.profile?.name) {
            contactMap.set(contact.wa_id, contact.profile.name);
          }
        }
      }

      // 1. Process Status updates (delivered, read, failed)
      if (Array.isArray(val.statuses)) {
        result.isStatusUpdate = true;
        for (const st of val.statuses) {
          let errorMsg: string | null = null;
          if (Array.isArray(st.errors) && st.errors.length > 0) {
            errorMsg = st.errors.map((e: any) => `${e.code || ''}: ${e.title || e.message || ''}`).join('; ');
          }

          result.statuses.push({
            wa_message_id: st.id,
            recipient_id: st.recipient_id,
            status: st.status,
            timestamp: st.timestamp,
            error: errorMsg,
          });
        }
      }

      // 2. Process Inbound Messages
      if (Array.isArray(val.messages)) {
        for (const msg of val.messages) {
          const from = msg.from;
          const { e164, wa_id } = normalizePhone(from);
          const senderName = contactMap.get(from) || null;

          let type: MessageType = 'other';
          let bodyText: string | null = null;
          let mediaId: string | null = null;
          let mimeType: string | null = null;
          let interactiveId: string | null = null;
          let interactiveTitle: string | null = null;
          let location: NormalizedInboundMessage['location'] = null;

          switch (msg.type) {
            case 'text':
              type = 'text';
              bodyText = sanitizeText(msg.text?.body);
              break;

            case 'audio':
              type = 'audio';
              mediaId = msg.audio?.id || null;
              mimeType = msg.audio?.mime_type || null;
              break;

            case 'image':
              type = 'image';
              mediaId = msg.image?.id || null;
              mimeType = msg.image?.mime_type || null;
              bodyText = sanitizeText(msg.image?.caption);
              break;

            case 'interactive':
              type = 'interactive';
              if (msg.interactive?.type === 'button_reply') {
                interactiveId = msg.interactive.button_reply?.id || null;
                interactiveTitle = msg.interactive.button_reply?.title || null;
                bodyText = interactiveTitle;
              } else if (msg.interactive?.type === 'list_reply') {
                interactiveId = msg.interactive.list_reply?.id || null;
                interactiveTitle = msg.interactive.list_reply?.title || null;
                bodyText = interactiveTitle;
              }
              break;

            case 'button':
              type = 'interactive';
              interactiveTitle = msg.button?.text || null;
              interactiveId = msg.button?.payload || null;
              bodyText = interactiveTitle;
              break;

            case 'location':
              type = 'location';
              location = {
                latitude: msg.location?.latitude,
                longitude: msg.location?.longitude,
                name: msg.location?.name,
                address: msg.location?.address,
              };
              bodyText = msg.location?.name
                ? `Location: ${msg.location.name} (${msg.location.address || ''})`
                : `Location coordinates: ${msg.location?.latitude}, ${msg.location?.longitude}`;
              break;

            default:
              type = 'other';
              bodyText = `[Received unsupported message format: ${msg.type}]`;
          }

          result.messages.push({
            wa_message_id: msg.id,
            lead_wa_id: wa_id,
            phone_e164: e164,
            sender_name: senderName,
            timestamp: msg.timestamp || String(Math.floor(Date.now() / 1000)),
            type,
            body: bodyText,
            media_id: mediaId,
            mime_type: mimeType,
            interactive_id: interactiveId,
            interactive_title: interactiveTitle,
            location,
            referral: msg.referral || null,
            raw: msg,
          });
        }
      }
    }
  }

  return result;
}
