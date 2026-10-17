import { describe, expect, it } from 'vitest';
import { formatWhatsAppMessage } from '../src/whatsapp/format.js';

describe('formatWhatsAppMessage', () => {
  it('converts double asterisks to single asterisks for bold', () => {
    const input = 'Here is **bold text** and another **important** word.';
    const output = formatWhatsAppMessage(input);
    expect(output).toBe('Here is *bold text* and another *important* word.');
    expect(output).not.toContain('**');
  });

  it('strips markdown headings and formats as bold', () => {
    const input = '### Available Sites\nHere are the details:\n# Final Step';
    const output = formatWhatsAppMessage(input);
    expect(output).toContain('*Available Sites*');
    expect(output).toContain('*Final Step*');
    expect(output).not.toContain('###');
    expect(output).not.toContain('#');
  });

  it('converts leading asterisk bullets to bullet symbols', () => {
    const input = 'Amenities:\n* 24/7 Security\n* Club house\n* Water supply';
    const output = formatWhatsAppMessage(input);
    expect(output).toContain('• 24/7 Security');
    expect(output).toContain('• Club house');
    expect(output).not.toMatch(/^[ \t]*\*[ \t]+/m);
  });

  it('handles mixed markdown input properly', () => {
    const input = '## Project Overview\nWe offer **premium villas**:\n* 3 BHK\n* 4 BHK\nTotal price is **Rs 1.2 Cr**.';
    const output = formatWhatsAppMessage(input);
    expect(output).toBe('*Project Overview*\nWe offer *premium villas*:\n• 3 BHK\n• 4 BHK\nTotal price is *Rs 1.2 Cr*.');
  });

  it('handles empty or null safely', () => {
    expect(formatWhatsAppMessage('')).toBe('');
    expect(formatWhatsAppMessage(null)).toBe('');
    expect(formatWhatsAppMessage(undefined)).toBe('');
  });
});
