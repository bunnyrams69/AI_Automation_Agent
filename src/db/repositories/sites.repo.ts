import { getSupabase } from '../client.js';
import { Site, SiteStatus } from '../types.js';

export class SitesRepository {
  async listAvailable(): Promise<Site[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('status', 'available')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to list available sites: ${error.message}`);
    }
    return data || [];
  }

  async listAll(): Promise<Site[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list sites: ${error.message}`);
    }
    return data || [];
  }

  async getById(id: string): Promise<Site | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get site by id: ${error.message}`);
    }
    return data;
  }

  async create(input: {
    name: string;
    location: string;
    description: string;
    price_range: string;
    highlights?: string[];
    map_url?: string | null;
    status?: SiteStatus;
  }): Promise<Site> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('sites')
      .insert({
        name: input.name,
        location: input.location,
        description: input.description,
        price_range: input.price_range,
        highlights: input.highlights || [],
        map_url: input.map_url || null,
        status: input.status || 'available',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create site: ${error.message}`);
    }
    return data;
  }

  async update(id: string, updates: Partial<Site>): Promise<Site> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('sites')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update site: ${error.message}`);
    }
    return data;
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.from('sites').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete site: ${error.message}`);
    }
  }
}

export const sitesRepo = new SitesRepository();
