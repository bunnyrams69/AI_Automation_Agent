import { getSupabase } from '../client.js';
import { BusinessProfile } from '../types.js';

export class BusinessRepository {
  async getProfile(): Promise<BusinessProfile | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('business_profile')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch business profile: ${error.message}`);
    }
    return data;
  }

  async updateProfile(id: string, updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('business_profile')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update business profile: ${error.message}`);
    }
    return data;
  }
}

export const businessRepo = new BusinessRepository();
