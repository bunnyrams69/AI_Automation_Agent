import { getSupabase } from '../client.js';
import { SiteImage } from '../types.js';

export class SiteImagesRepository {
  async listBySiteId(siteId: string): Promise<SiteImage[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('site_images')
      .select('*')
      .eq('site_id', siteId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to list site images: ${error.message}`);
    }
    return data || [];
  }

  async create(input: {
    site_id: string;
    storage_path: string;
    public_url: string;
    caption?: string | null;
    sort_order?: number;
  }): Promise<SiteImage> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('site_images')
      .insert({
        site_id: input.site_id,
        storage_path: input.storage_path,
        public_url: input.public_url,
        caption: input.caption || null,
        sort_order: input.sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create site image: ${error.message}`);
    }
    return data;
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.from('site_images').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete site image: ${error.message}`);
    }
  }
}

export const siteImagesRepo = new SiteImagesRepository();
