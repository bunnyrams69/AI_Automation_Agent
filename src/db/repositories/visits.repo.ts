import { getSupabase } from '../client.js';
import { SiteVisit, VisitStatus } from '../types.js';

export interface VisitFilter {
  leadId?: string;
  siteId?: string;
  status?: VisitStatus;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export class VisitsRepository {
  async getById(id: string): Promise<SiteVisit | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('site_visits')
      .select('*, leads(*), sites(*), availability_slots(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get site visit: ${error.message}`);
    }
    return data;
  }

  async list(filter: VisitFilter = {}): Promise<{ visits: SiteVisit[]; total: number }> {
    const supabase = getSupabase();
    let query = supabase
      .from('site_visits')
      .select('*, leads(*), sites(*)', { count: 'exact' });

    if (filter.leadId) {
      query = query.eq('lead_id', filter.leadId);
    }
    if (filter.siteId) {
      query = query.eq('site_id', filter.siteId);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.fromDate) {
      query = query.gte('scheduled_at', filter.fromDate);
    }
    if (filter.toDate) {
      query = query.lte('scheduled_at', filter.toDate);
    }

    const limit = filter.limit ?? 20;
    const offset = filter.offset ?? 0;
    query = query.order('scheduled_at', { ascending: true }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Failed to list site visits: ${error.message}`);
    }

    return {
      visits: data || [],
      total: count || 0,
    };
  }

  async cancelAtomic(visitId: string, reason?: string): Promise<boolean> {
    const supabase = getSupabase();

    // Try stored procedure
    const { data, error } = await supabase.rpc('cancel_site_visit_atomic', {
      p_visit_id: visitId,
      p_reason: reason || null,
    });

    if (!error && data !== null) {
      return Boolean(data);
    }

    // Fallback logic
    const { data: visit, error: fetchErr } = await supabase
      .from('site_visits')
      .select('*')
      .eq('id', visitId)
      .maybeSingle();

    if (fetchErr || !visit) {
      throw new Error(`Visit ${visitId} not found`);
    }

    if (visit.status === 'cancelled') {
      return true;
    }

    await supabase
      .from('site_visits')
      .update({
        status: 'cancelled',
        notes: reason ? `${visit.notes || ''} [Cancelled: ${reason}]` : visit.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', visitId);

    if (visit.slot_id) {
      const { data: slot } = await supabase
        .from('availability_slots')
        .select('booked_count')
        .eq('id', visit.slot_id)
        .maybeSingle();

      if (slot && slot.booked_count > 0) {
        await supabase
          .from('availability_slots')
          .update({
            booked_count: slot.booked_count - 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', visit.slot_id);
      }
    }

    return true;
  }

  async updateStatus(id: string, status: VisitStatus, notes?: string): Promise<SiteVisit> {
    const supabase = getSupabase();
    const updates: Partial<SiteVisit> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('site_visits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update visit status: ${error.message}`);
    }
    return data;
  }

  async createCalVisit(visitData: {
    lead_id: string;
    site_id: string | null;
    scheduled_at: string;
    status: VisitStatus;
    cal_booking_uid?: string | null;
    cal_booking_id?: string | null;
    cal_reschedule_url?: string | null;
    cal_cancel_url?: string | null;
    meeting_location?: string | null;
    pickup_request?: string | null;
    notes?: string | null;
    created_by: 'ai' | 'admin';
  }): Promise<SiteVisit> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('site_visits')
      .insert({
        ...visitData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // In case new columns are not yet in remote DB, fallback to core fields
      const coreData = {
        lead_id: visitData.lead_id,
        site_id: visitData.site_id,
        scheduled_at: visitData.scheduled_at,
        status: visitData.status,
        notes: visitData.notes,
        created_by: visitData.created_by,
      };
      const fallback = await supabase
        .from('site_visits')
        .insert(coreData)
        .select()
        .single();
      if (fallback.error) {
        throw new Error(`Failed to create site visit: ${fallback.error.message}`);
      }
      return fallback.data;
    }
    return data;
  }

  async getByCalUid(calUid: string): Promise<SiteVisit | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('site_visits')
      .select('*, leads(*), sites(*)')
      .eq('cal_booking_uid', calUid)
      .maybeSingle();

    if (error) {
      return null;
    }
    return data;
  }

  async updateCalVisit(calUid: string, updates: Partial<SiteVisit>): Promise<SiteVisit | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('site_visits')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('cal_booking_uid', calUid)
      .select()
      .maybeSingle();

    if (error) {
      return null;
    }
    return data;
  }

  async markConfirmationSent(id: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('site_visits')
      .update({
        confirmation_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async markReminderSent(id: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('site_visits')
      .update({
        reminder_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }
}

export const visitsRepo = new VisitsRepository();
