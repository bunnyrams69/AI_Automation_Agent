import { getSupabase } from '../client.js';
import { DeliveryStatus, Message, MessageDirection, MessageType } from '../types.js';

export interface CreateMessageInput {
  conversation_id: string;
  lead_id: string;
  wa_message_id?: string | null;
  direction: MessageDirection;
  type: MessageType;
  body?: string | null;
  transcript?: string | null;
  media_id?: string | null;
  media_storage_path?: string | null;
  delivery_status?: DeliveryStatus;
  error?: string | null;
  raw_payload?: Record<string, unknown> | null;
}

export class MessagesRepository {
  async create(input: CreateMessageInput): Promise<Message> {
    const supabase = getSupabase();
    if (input.wa_message_id) {
      const { data: existing } = await supabase
        .from('messages')
        .select('*')
        .eq('wa_message_id', input.wa_message_id)
        .maybeSingle();

      if (existing) {
        return existing;
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: input.conversation_id,
        lead_id: input.lead_id,
        wa_message_id: input.wa_message_id || null,
        direction: input.direction,
        type: input.type,
        body: input.body || null,
        transcript: input.transcript || null,
        media_id: input.media_id || null,
        media_storage_path: input.media_storage_path || null,
        delivery_status: input.delivery_status || 'sent',
        error: input.error || null,
        raw_payload: input.raw_payload || null,
      })
      .select()
      .single();

    if (error) {
      // Gracefully handle race condition if another worker inserted same wa_message_id
      if (input.wa_message_id && error.code === '23505') {
        const { data: existing } = await supabase
          .from('messages')
          .select('*')
          .eq('wa_message_id', input.wa_message_id)
          .maybeSingle();
        if (existing) return existing;
      }
      throw new Error(`Failed to create message: ${error.message}`);
    }
    return data;
  }

  async updateDeliveryStatus(
    waMessageId: string,
    status: DeliveryStatus,
    errorMsg?: string | null
  ): Promise<Message | null> {
    const supabase = getSupabase();
    const updates: Partial<Message> = {
      delivery_status: status,
    };
    if (errorMsg) {
      updates.error = errorMsg;
    }

    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('wa_message_id', waMessageId)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update delivery status: ${error.message}`);
    }
    return data;
  }

  async getRecentByLeadId(leadId: string, limit = 20): Promise<Message[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent messages: ${error.message}`);
    }
    // Return in chronological order
    return (data || []).reverse();
  }

  async getByConversationId(conversationId: string): Promise<Message[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages for conversation: ${error.message}`);
    }
    return data || [];
  }
}

export const messagesRepo = new MessagesRepository();
