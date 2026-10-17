import { getSupabase } from '../client.js';
import { InboundEvent } from '../types.js';

export class InboundEventsRepository {
  /**
   * Enqueue an incoming WhatsApp event idempotently.
   * If wa_message_id exists, does nothing and returns null.
   */
  async enqueue(
    waMessageId: string,
    leadWaId: string,
    payload: Record<string, unknown>
  ): Promise<InboundEvent | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('inbound_events')
      .upsert(
        {
          wa_message_id: waMessageId,
          lead_wa_id: leadWaId,
          payload,
          status: 'pending',
          attempts: 0,
        },
        { onConflict: 'wa_message_id', ignoreDuplicates: true }
      )
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to enqueue inbound event: ${error.message}`);
    }
    return data;
  }

  /**
   * Atomically claim pending events using database stored procedure with DB-level debounce
   */
  async claimBatch(batchSize = 5, lockTimeoutSeconds = 60, debounceSeconds = 3): Promise<InboundEvent[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('claim_inbound_events', {
      p_batch_size: batchSize,
      p_lock_timeout_seconds: lockTimeoutSeconds,
      p_debounce_seconds: debounceSeconds,
    });

    if (error) {
      // Fallback if RPC is not deployed in local/mock environments
      const now = new Date();
      const lockCutoff = new Date(now.getTime() - lockTimeoutSeconds * 1000).toISOString();
      const debounceCutoff = new Date(now.getTime() - debounceSeconds * 1000).toISOString();

      const { data: fallbackCandidates, error: candidateErr } = await supabase
        .from('inbound_events')
        .select('*')
        .lte('created_at', debounceCutoff)
        .or(`status.eq.pending,and(status.eq.processing,locked_at.lt.${lockCutoff})`)
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (candidateErr) {
        throw new Error(`Failed to claim inbound events fallback: ${candidateErr.message}`);
      }

      if (!fallbackCandidates || fallbackCandidates.length === 0) {
        return [];
      }

      const claimedIds = fallbackCandidates.map((c) => c.id);
      const { data: updated, error: updateErr } = await supabase
        .from('inbound_events')
        .update({
          status: 'processing',
          locked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('id', claimedIds)
        .select();

      if (updateErr) {
        throw new Error(`Failed to update claimed events: ${updateErr.message}`);
      }
      return updated || [];
    }

    return data || [];
  }

  async markDone(id: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('inbound_events')
      .update({
        status: 'done',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('inbound_events')
      .update({
        status: 'failed',
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  /**
   * Fetch any pending un-processed messages for the same lead arriving within debounce window
   */
  async getPendingForLead(leadWaId: string, excludeId: string): Promise<InboundEvent[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('inbound_events')
      .select('*')
      .eq('lead_wa_id', leadWaId)
      .eq('status', 'pending')
      .neq('id', excludeId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get pending events for lead: ${error.message}`);
    }
    return data || [];
  }
}

export const inboundEventsRepo = new InboundEventsRepository();
