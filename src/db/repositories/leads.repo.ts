import { getSupabase } from '../client.js';
import { Lead, LeadScore, LeadStatus } from '../types.js';

export interface LeadFilter {
  status?: LeadStatus;
  score?: LeadScore;
  search?: string;
  limit?: number;
  offset?: number;
}

export class LeadsRepository {
  async findByWaId(waId: string): Promise<Lead | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('wa_id', waId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find lead by wa_id: ${error.message}`);
    }
    return data;
  }

  async getById(id: string): Promise<Lead | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get lead by id: ${error.message}`);
    }
    return data;
  }

  async upsertLead(input: {
    wa_id: string;
    phone: string;
    name?: string | null;
    source?: string;
    ad_reference?: Record<string, unknown> | null;
  }): Promise<Lead> {
    const supabase = getSupabase();

    // Check if exists
    const existing = await this.findByWaId(input.wa_id);
    if (existing) {
      const updates: Partial<Lead> = {
        last_inbound_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (input.name && !existing.name) {
        updates.name = input.name;
      }
      if (input.ad_reference && !existing.ad_reference) {
        updates.ad_reference = input.ad_reference;
      }
      if (input.source && existing.source === 'unknown') {
        updates.source = input.source;
      }

      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update existing lead: ${error.message}`);
      }
      return data;
    }

    // Insert new
    const { data, error } = await supabase
      .from('leads')
      .insert({
        wa_id: input.wa_id,
        phone: input.phone,
        name: input.name || null,
        source: input.source || 'unknown',
        ad_reference: input.ad_reference || null,
        status: 'new',
        score: 'unscored',
        intent_to_visit: false,
        last_inbound_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert lead: ${error.message}`);
    }
    return data;
  }

  async updateScore(id: string, score: LeadScore, reason: string): Promise<Lead> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('leads')
      .update({
        score,
        score_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update lead score: ${error.message}`);
    }
    return data;
  }

  async updateFields(id: string, fields: Partial<Lead>): Promise<Lead> {
    const supabase = getSupabase();
    let { data, error } = await supabase
      .from('leads')
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error && error.message.includes('column')) {
      // If new migration columns are not yet applied in remote DB, strip them and retry
      const safeFields: Record<string, any> = { ...fields };
      delete safeFields.budget_text;
      delete safeFields.budget_min_inr;
      delete safeFields.budget_max_inr;
      delete safeFields.email;
      delete safeFields.email_provided;

      const fallbackRes = await supabase
        .from('leads')
        .update({
          ...safeFields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      throw new Error(`Failed to update lead fields: ${error.message}`);
    }
    return data;
  }

  async setOptedOut(id: string): Promise<Lead> {
    return this.updateFields(id, {
      status: 'opted_out',
      summary: 'Lead requested opt-out / STOP',
    });
  }

  async recordOutbound(id: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('leads')
      .update({
        last_outbound_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async listLeads(filter: LeadFilter = {}): Promise<{ leads: Lead[]; total: number }> {
    const supabase = getSupabase();
    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.score) {
      query = query.eq('score', filter.score);
    }
    if (filter.search) {
      query = query.or(`name.ilike.%${filter.search}%,phone.ilike.%${filter.search}%,wa_id.ilike.%${filter.search}%`);
    }

    const limit = filter.limit ?? 20;
    const offset = filter.offset ?? 0;

    query = query.order('last_inbound_at', { ascending: false, nullsFirst: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Failed to list leads: ${error.message}`);
    }

    return {
      leads: data || [],
      total: count || 0,
    };
  }
}

export const leadsRepo = new LeadsRepository();
