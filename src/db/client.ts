import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

/**
 * Health check helper for Supabase connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('business_profile').select('id').limit(1);
    return !error;
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    return false;
  }
}
