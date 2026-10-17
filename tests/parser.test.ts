import { describe, expect, it } from 'vitest';
import {
  isOptOutMessage,
  isWithin24HourWindow,
  normalizePhone,
  parseWhatsAppWebhook,
  sanitizeText,
} from '../src/whatsapp/parser.js';

describe('WhatsApp Parser & Normalizer', () => {
  describe('normalizePhone', () => {
    it('normalizes 10-digit Indian numbers to E.164 and wa_id', () => {
      const result = normalizePhone('9876543210');
      expect(result.e164).toBe('+919876543210');
      expect(result.wa_id).toBe('919876543210');
    });

    it('handles formatted numbers with spaces and dashes', () => {
      const result = normalizePhone('+91 98765-43210');
      expect(result.e164).toBe('+919876543210');
      expect(result.wa_id).toBe('919876543210');
    });

    it('handles international numbers', () => {
      const result = normalizePhone('+14155552671');
      expect(result.e164).toBe('+14155552671');
      expect(result.wa_id).toBe('14155552671');
    });
  });

  describe('isOptOutMessage', () => {
    it('detects standard English opt-out keywords', () => {
      expect(isOptOutMessage('STOP')).toBe(true);
      expect(isOptOutMessage('stop')).toBe(true);
      expect(isOptOutMessage('  unsubscribe  ')).toBe(true);
      expect(isOptOutMessage('CANCEL')).toBe(true);
      expect(isOptOutMessage('Quit')).toBe(true);
    });

    it('detects Hindi and Telugu opt-out keywords', () => {
      expect(isOptOutMessage('ROKO')).toBe(true);
      expect(isOptOutMessage('vaddu')).toBe(true);
      expect(isOptOutMessage('appu')).toBe(true);
    });

    it('does not flag normal conversational messages', () => {
      expect(isOptOutMessage('Can you send details?')).toBe(false);
      expect(isOptOutMessage('What is the stop price?')).toBe(false);
      expect(isOptOutMessage('Book a visit')).toBe(false);
    });
  });

  describe('isWithin24HourWindow', () => {
    it('returns true for timestamps within 24 hours', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      expect(isWithin24HourWindow(oneHourAgo)).toBe(true);

      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
      expect(isWithin24HourWindow(twentyThreeHoursAgo)).toBe(true);
    });

    it('returns false for timestamps older than 24 hours', () => {
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      expect(isWithin24HourWindow(twentyFiveHoursAgo)).toBe(false);
    });

    it('returns false for null or undefined timestamps', () => {
      expect(isWithin24HourWindow(null)).toBe(false);
      expect(isWithin24HourWindow(undefined)).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('strips control characters and trims', () => {
      const raw = ' Hello \x00World \x07! \n Nice day. ';
      expect(sanitizeText(raw)).toBe('Hello World ! \n Nice day.');
    });

    it('caps maximum length', () => {
      const longText = 'A'.repeat(5000);
      expect(sanitizeText(longText, 100).length).toBe(100);
    });
  });

  describe('parseWhatsAppWebhook', () => {
    it('parses text messages with contact profile and referral', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_123',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '1234567890', phone_number_id: 'PN_123' },
                  contacts: [{ profile: { name: 'Rahul Sharma' }, wa_id: '919876543210' }],
                  messages: [
                    {
                      from: '919876543210',
                      id: 'wamid.HBgLMTIzNDU2Nzg5MA==',
                      timestamp: '1729177200',
                      type: 'text',
                      text: { body: 'Interested in Emerald Meadows villa plots' },
                      referral: {
                        source_url: 'https://fb.me/ad123',
                        source_id: 'ad_456',
                        headline: 'Luxury Plots in Mokila',
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = parseWhatsAppWebhook(payload);
      expect(result.messages.length).toBe(1);
      const msg = result.messages[0];
      expect(msg.wa_message_id).toBe('wamid.HBgLMTIzNDU2Nzg5MA==');
      expect(msg.lead_wa_id).toBe('919876543210');
      expect(msg.sender_name).toBe('Rahul Sharma');
      expect(msg.type).toBe('text');
      expect(msg.body).toBe('Interested in Emerald Meadows villa plots');
      expect(msg.referral?.headline).toBe('Luxury Plots in Mokila');
    });

    it('parses audio voice note messages', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  messages: [
                    {
                      from: '919876543210',
                      id: 'wamid.audio123',
                      type: 'audio',
                      audio: {
                        id: 'media_id_789',
                        mime_type: 'audio/ogg; codecs=opus',
                        voice: true,
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = parseWhatsAppWebhook(payload);
      expect(result.messages[0].type).toBe('audio');
      expect(result.messages[0].media_id).toBe('media_id_789');
    });

    it('parses interactive button replies', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  messages: [
                    {
                      from: '919876543210',
                      id: 'wamid.btn123',
                      type: 'interactive',
                      interactive: {
                        type: 'button_reply',
                        button_reply: {
                          id: 'slot_choice_sat_morning',
                          title: 'Saturday 10:30 AM',
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = parseWhatsAppWebhook(payload);
      expect(result.messages[0].type).toBe('interactive');
      expect(result.messages[0].interactive_id).toBe('slot_choice_sat_morning');
      expect(result.messages[0].body).toBe('Saturday 10:30 AM');
    });

    it('parses status callbacks (delivered, read, failed)', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  statuses: [
                    {
                      id: 'wamid.outbound123',
                      status: 'delivered',
                      timestamp: '1729177300',
                      recipient_id: '919876543210',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = parseWhatsAppWebhook(payload);
      expect(result.isStatusUpdate).toBe(true);
      expect(result.statuses.length).toBe(1);
      expect(result.statuses[0].status).toBe('delivered');
    });
  });
});
