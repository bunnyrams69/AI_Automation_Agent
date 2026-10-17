import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      HOST: '0.0.0.0',
      PUBLIC_BASE_URL: 'http://localhost:3000',
      SUPABASE_URL: 'https://mock.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
      SUPABASE_ANON_KEY: 'mock-anon-key',
      WHATSAPP_PHONE_NUMBER_ID: '123456789012345',
      WHATSAPP_BUSINESS_ACCOUNT_ID: '123456789012345',
      WHATSAPP_ACCESS_TOKEN: 'mock-whatsapp-access-token',
      WHATSAPP_APP_SECRET: 'mock-app-secret-1234567890abcdef',
      WHATSAPP_VERIFY_TOKEN: 'mock-verify-token-123',
      WHATSAPP_API_VERSION: 'v26.0',
      GEMINI_API_KEY: 'mock-gemini-api-key',
      GEMINI_MODEL: 'gemini-2.5-flash',
      ADMIN_API_KEY: 'mock-admin-api-key-test-12345',
      BUSINESS_TIMEZONE: 'Asia/Kolkata',
      VOICE_REPLY_ENABLED: 'false',
    },
  },
});
