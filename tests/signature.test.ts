import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyWhatsAppSignature } from '../src/whatsapp/signature.js';

describe('WhatsApp Webhook Signature Verification', () => {
  const secret = 'test-meta-app-secret-12345';
  const payload = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });

  it('validates a correct HMAC-SHA256 signature', () => {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const validSignature = `sha256=${hmac.digest('hex')}`;

    const isValid = verifyWhatsAppSignature(payload, validSignature, secret);
    expect(isValid).toBe(true);
  });

  it('validates a Buffer payload correctly', () => {
    const bufferPayload = Buffer.from(payload, 'utf8');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(bufferPayload);
    const validSignature = `sha256=${hmac.digest('hex')}`;

    const isValid = verifyWhatsAppSignature(bufferPayload, validSignature, secret);
    expect(isValid).toBe(true);
  });

  it('rejects an altered payload', () => {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const validSignature = `sha256=${hmac.digest('hex')}`;

    const tamperedPayload = payload + ' ';
    const isValid = verifyWhatsAppSignature(tamperedPayload, validSignature, secret);
    expect(isValid).toBe(false);
  });

  it('rejects an incorrect secret', () => {
    const hmac = crypto.createHmac('sha256', 'wrong-secret');
    hmac.update(payload);
    const invalidSignature = `sha256=${hmac.digest('hex')}`;

    const isValid = verifyWhatsAppSignature(payload, invalidSignature, secret);
    expect(isValid).toBe(false);
  });

  it('rejects missing or malformed signature header', () => {
    expect(verifyWhatsAppSignature(payload, '', secret)).toBe(false);
    expect(verifyWhatsAppSignature(payload, null, secret)).toBe(false);
    expect(verifyWhatsAppSignature(payload, 'invalid-format-without-sha256', secret)).toBe(false);
    expect(verifyWhatsAppSignature(payload, 'sha256=', secret)).toBe(false);
  });
});
