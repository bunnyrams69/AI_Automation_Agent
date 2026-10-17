import { getSupabase } from '../client.js';
import { FollowUp, FollowUpKind, FollowUpStatus } from '../types.js';

export class FollowUpsRepository {
  async create(input: {
    lead_id: string;
    kind: FollowUpKind;
    scheduled_at: string;
    template_name?: string | null;
    payload?: Record<string, unknown>;
  }): Promise<FollowUp> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('follow_ups')
      .insert({
        lead_id: input.lead_id,
        kind: input.kind,
        scheduled_at: input.scheduled_at,
        template_name: input.template_name || null,
        payload: input.payload || {},
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create follow-up: ${error.message}`);
    }
    return data;
  }

  async getDue(limit = 10): Promise<FollowUp[]> {
    const supabase = getSupabase();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get due follow-ups: ${error.message}`);
    }
    return data || [];
  }

  async markSent(id: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('follow_ups')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('follow_ups')
      .update({
        status: 'failed',
        error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async cancelPendingForLead(leadId: string, kinds?: FollowUpKind[]): Promise<void> {
    const supabase = getSupabase();
    let query = supabase
      .from('follow_ups')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('lead_id', leadId)
      .eq('status', 'pending');

    if (kinds && kinds.length > 0) {
      query = query.in('kind', kinds);
    }

    const { error } = await query;
    if (error) {
      throw new Error(`Failed to cancel pending follow-ups for lead: ${error.message}`);
    }
  }

  async countSentByKind(leadId: string, kind: FollowUpKind): Promise<number> {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', leadId)
      .eq('kind', kind)
      .eq('status', 'sent');

    if (error) {
      throw new Error(`Failed to count sent follow-ups: ${error.message}`);
    }
    return count || 0;
  }
}

export const followUpsRepo = new FollowUpsRepository();
