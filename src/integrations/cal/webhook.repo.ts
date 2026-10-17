import { getSupabase } from '../../db/client.js';
import { logger } from '../../config/logger.js';

export class CalWebhooksRepository {
  /**
   * Check if a webhook was already processed, or mark it as processed atomically.
   * Returns true if newly recorded, false if already processed (duplicate).
   */
  async recordIfNew(webhookId: string, eventType: string, payload: Record<string, unknown>): Promise<boolean> {
    const supabase = getSupabase();
    try {
      const { data, error } = await supabase
        .from('processed_cal_webhooks')
        .insert({
          webhook_id: webhookId,
          event_type: eventType,
          payload,
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
          return false; // Duplicate
        }
        logger.warn({ error: error.message }, 'Could not record processed_cal_webhook row');
        return true; // Proceed anyway so we don't drop events if table pending
      }

      return Boolean(data);
    } catch {
      return true;
    }
  }
}

export const calWebhooksRepo = new CalWebhooksRepository();
