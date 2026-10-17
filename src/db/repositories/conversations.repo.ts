import { getSupabase } from '../client.js';
import { Conversation, ConversationMode } from '../types.js';

export class ConversationsRepository {
  async getOrCreateForLead(leadId: string): Promise<Conversation> {
    const supabase = getSupabase();

    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to check existing conversation: ${findError.message}`);
    }

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        lead_id: leadId,
        mode: 'ai',
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return data;
  }

  async getByLeadId(leadId: string): Promise<Conversation | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get conversation: ${error.message}`);
    }
    return data;
  }

  async setMode(id: string, mode: ConversationMode, assignedTo?: string | null): Promise<Conversation> {
    const supabase = getSupabase();
    const updates: Partial<Conversation> = {
      mode,
      updated_at: new Date().toISOString(),
    };
    if (assignedTo !== undefined) {
      updates.assigned_to = assignedTo;
    }

    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set conversation mode: ${error.message}`);
    }
    return data;
  }

  async setNeedsAttention(id: string, needsAttention = true): Promise<void> {
    const supabase = getSupabase();
    try {
      await supabase
        .from('conversations')
        .update({
          needs_attention: needsAttention,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch {
      // Graceful if column not present yet
    }
  }

  async recordFallback(id: string): Promise<void> {
    const supabase = getSupabase();
    try {
      await supabase
        .from('conversations')
        .update({
          needs_attention: true,
          last_fallback_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch {
      // Graceful if column not present yet
    }
  }

  canSendFallback(conversation: Conversation): boolean {
    if (!conversation.last_fallback_at) return true;
    const diff = Date.now() - new Date(conversation.last_fallback_at).getTime();
    return diff > 10 * 60 * 1000; // At most one fallback per lead per 10 minutes
  }

  async touchLastMessage(id: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }
}

export const conversationsRepo = new ConversationsRepository();
