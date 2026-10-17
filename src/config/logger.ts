import pino from 'pino';

/**
 * Mask sensitive data like phone numbers (+919876543210 -> +9198****3210)
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return '';
  const clean = phone.trim();
  if (clean.length <= 6) return '****';
  return clean.slice(0, 4) + '****' + clean.slice(-4);
}

/**
 * Mask text message bodies for privacy compliance
 */
export function maskText(text?: string | null, maxVisible = 10): string {
  if (!text) return '';
  if (text.length <= maxVisible) return '[MASKED]';
  return `${text.slice(0, 5)}...[${text.length} chars masked]`;
}

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  serializers: {
    // Custom serializers to prevent accidental PII logging
    phone: (val: string) => maskPhone(val),
    wa_id: (val: string) => maskPhone(val),
  },
  base: {
    service: 'whatsapp-ai-agent',
    env: process.env.NODE_ENV || 'development',
  },
});
