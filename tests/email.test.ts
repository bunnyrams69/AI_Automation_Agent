import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/email/escape.js';
import { emailService } from '../src/email/service.js';

describe('Email Service & HTML Escaping', () => {
  it('escapes dangerous HTML characters to prevent XSS/injection', () => {
    const malicious = '<script>alert("hack")</script> & "special" \'quotes\'';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&amp;');
    expect(escaped).toContain('&quot;special&quot;');
    expect(escaped).toContain('&#39;quotes&#39;');
  });

  it('handles safe strings and empty inputs gracefully', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('safely dispatches test email without throwing in mock/test mode', async () => {
    const sent = await emailService.sendDirect({
      to: 'test@example.com',
      subject: 'Test Notification',
      text: 'Hello plain text',
      html: '<p>Hello HTML</p>',
    });
    expect(sent).toBe(true);
  });
});
