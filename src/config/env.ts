import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env if present
dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),

  // Supabase
  SUPABASE_URL: z.string().url().describe('Supabase project URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).describe('Supabase Service Role Key (bypasses RLS)'),
  SUPABASE_ANON_KEY: z.string().min(1).describe('Supabase Anon/Public Key'),

  // WhatsApp Cloud API
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).describe('WhatsApp Phone Number ID'),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().min(1).describe('WhatsApp Business Account ID'),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).describe('WhatsApp Cloud API Access Token'),
  WHATSAPP_APP_SECRET: z.string().min(1).describe('Meta App Secret for HMAC validation'),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1).describe('Custom verification token for webhook handshake'),
  WHATSAPP_API_VERSION: z.string().default('v26.0'),

  // Google Gemini AI
  GEMINI_API_KEY: z.string().min(1).describe('Google Gemini API Key'),
  GEMINI_MODEL: z
    .string()
    .default('gemini-2.5-flash')
    .describe('Current Google Gemini free-tier model with tool calling & audio input'),

  // Admin Security
  ADMIN_API_KEY: z.string().min(8).describe('Admin API key for protected /admin routes'),

  // Business Config
  BUSINESS_TIMEZONE: z.string().default('Asia/Kolkata').describe('Business operating timezone'),
  NOTIFY_EMAIL: z.string().email().default('owner@example.com').describe('Owner notification email'),

  // Cal.com Scheduling Integration
  CAL_API_KEY: z
    .string()
    .default(process.env['cal.com'] || '')
    .describe('Cal.com v2 API Key'),
  CAL_API_VERSION: z.string().default('2024-08-13').describe('Cal.com bookings API version'),
  CAL_SLOTS_API_VERSION: z.string().default('2024-09-04').describe('Cal.com slots API version'),
  CAL_DEFAULT_EVENT_TYPE_ID: z.coerce.number().default(0).describe('Default Cal.com event type ID for site visits'),
  CAL_WEBHOOK_SECRET: z.string().default('cal_webhook_secret_secure_98765').describe('Secret for Cal.com webhook signature verification'),
  CAL_FALLBACK_ATTENDEE_EMAIL: z
    .string()
    .email()
    .default('bookings@example.com')
    .describe('Fallback email for Cal.com bookings when lead skips email'),

  // Email Notification Outbox
  EMAIL_PROVIDER: z.enum(['smtp', 'resend', 'mock']).default('mock'),
  SMTP_HOST: z.string().default('smtp.example.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() === 'true' : Boolean(val)),
    z.boolean().default(false)
  ),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('Apex Real Estate <notifications@example.com>'),
  RESEND_API_KEY: z.string().optional().default(''),

  // Voice Note Config
  VOICE_REPLY_ENABLED: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() === 'true' : Boolean(val)),
    z.boolean().default(false)
  ),
  TTS_PROVIDER: z.enum(['gemini', 'elevenlabs', 'mock']).default('mock'),
  ELEVENLABS_API_KEY: z.string().optional().default(''),
  ELEVENLABS_VOICE_ID: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error('\n❌ Invalid or missing Environment Variables:\n' + missingVars);
    console.error('\nPlease copy .env.example to .env and fill in the required values.\n');
  } else {
    console.error('Failed to parse environment variables:', error);
  }
  // In test environment, allow mock fallback if not completely provided
  if (process.env.NODE_ENV === 'test') {
    parsedEnv = envSchema.parse({
      SUPABASE_URL: 'https://mock.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
      SUPABASE_ANON_KEY: 'mock-anon-key',
      WHATSAPP_PHONE_NUMBER_ID: '123456789012345',
      WHATSAPP_BUSINESS_ACCOUNT_ID: '123456789012345',
      WHATSAPP_ACCESS_TOKEN: 'mock-whatsapp-token',
      WHATSAPP_APP_SECRET: 'mock-app-secret-1234567890abcdef',
      WHATSAPP_VERIFY_TOKEN: 'mock-verify-token',
      GEMINI_API_KEY: 'mock-gemini-key',
      ADMIN_API_KEY: 'mock-admin-secret-key-12345',
      ...process.env,
    });
  } else {
    process.exit(1);
  }
}

export const env = parsedEnv;
