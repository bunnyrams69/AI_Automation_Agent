import crypto from 'node:crypto';

/**
 * Validates Meta X-Hub-Signature-256 header using timingSafeEqual to prevent timing attacks.
 *
 * @param rawBody - Raw Buffer or string of the incoming HTTP request body
 * @param signatureHeader - Value of X-Hub-Signature-256 (format: "sha256=<hex>")
 * @param appSecret - Meta App Secret
 * @returns boolean indicating if the signature is valid
 */
export function verifyWhatsAppSignature(
  rawBody: Buffer | string | undefined | null,
  signatureHeader: string | undefined | null,
  appSecret: string
): boolean {
  if (!rawBody || !signatureHeader || !appSecret) {
    return false;
  }

  // Format must be "sha256=<hash>"
  if (!signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const expectedSignatureHex = signatureHeader.slice(7).trim();
  if (!expectedSignatureHex) {
    return false;
  }

  try {
    const payloadBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');

    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(payloadBuffer);
    const calculatedSignatureHex = hmac.digest('hex');

    const expectedBuffer = Buffer.from(expectedSignatureHex, 'hex');
    const calculatedBuffer = Buffer.from(calculatedSignatureHex, 'hex');

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
  } catch {
    return false;
  }
}
