import { getSupabase } from '../client.js';
import { KnowledgeItem } from '../types.js';

export class KnowledgeRepository {
  /**
   * Search knowledge base using full text search with fallback
   */
  async search(query: string, category?: string, limit = 5): Promise<KnowledgeItem[]> {
    const supabase = getSupabase();

    // Try full-text search RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('search_knowledge_base', {
      p_query: query,
      p_category: category || null,
      p_limit: limit,
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData;
    }

    // Fallback: ILIKE query across title and content
    let q = supabase
      .from('knowledge_base')
      .select('*')
      .eq('active', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    if (category) {
      q = q.eq('category', category);
    }

    const { data, error } = await q.limit(limit);
    if (error) {
      // If error, return empty array to prevent breaking agent loop
      return [];
    }

    return data || [];
  }

  async listAll(limit = 50, offset = 0): Promise<{ items: KnowledgeItem[]; total: number }> {
    const supabase = getSupabase();
    const { data, count, error } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list knowledge items: ${error.message}`);
    }

    return {
      items: data || [],
      total: count || 0,
    };
  }

  async getById(id: string): Promise<KnowledgeItem | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get knowledge item: ${error.message}`);
    }
    return data;
  }

  async create(input: {
    title: string;
    content: string;
    category: string;
    active?: boolean;
  }): Promise<KnowledgeItem> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        title: input.title,
        content: input.content,
        category: input.category,
        active: input.active !== undefined ? input.active : true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create knowledge item: ${error.message}`);
    }
    return data;
  }

  async update(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('knowledge_base')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update knowledge item: ${error.message}`);
    }
    return data;
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete knowledge item: ${error.message}`);
    }
  }
}

export const knowledgeRepo = new KnowledgeRepository();
