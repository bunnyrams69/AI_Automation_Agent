import crypto from 'node:crypto';

/**
 * Validates Cal.com X-Cal-Signature-256 header using timingSafeEqual to prevent timing attacks.
 *
 * @param rawBody - Raw Buffer or string of the incoming HTTP request body
 * @param signatureHeader - Value of X-Cal-Signature-256
 * @param secret - Cal.com Webhook Secret
 * @returns boolean indicating if the signature is valid
 */
export function verifyCalSignature(
  rawBody: Buffer | string | undefined | null,
  signatureHeader: string | undefined | null,
  secret: string
): boolean {
  if (!rawBody || !signatureHeader || !secret) {
    return false;
  }

  const cleanHeader = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice(7).trim()
    : signatureHeader.trim();

  if (!cleanHeader) {
    return false;
  }

  try {
    const payloadBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadBuffer);
    const calculatedHex = hmac.digest('hex');

    const expectedBuffer = Buffer.from(cleanHeader, 'hex');
    const calculatedBuffer = Buffer.from(calculatedHex, 'hex');

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
  } catch {
    return false;
  }
}
