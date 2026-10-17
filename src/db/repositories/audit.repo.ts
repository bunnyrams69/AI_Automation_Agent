import { getSupabase } from '../client.js';
import { AuditActor, AuditLog } from '../types.js';

export class AuditRepository {
  async log(
    entityType: string,
    entityId: string | null,
    action: string,
    actor: AuditActor = 'agent',
    details: Record<string, unknown> = {}
  ): Promise<AuditLog> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        actor,
        details,
      })
      .select()
      .single();

    if (error) {
      // Don't crash main operation if audit log insert fails, but log to console
      console.error('Failed to write audit log:', error);
      return {
        id: 'error',
        entity_type: entityType,
        entity_id: entityId,
        action,
        actor,
        details,
        created_at: new Date().toISOString(),
      };
    }
    return data;
  }

  async listRecent(limit = 50): Promise<AuditLog[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list audit logs: ${error.message}`);
    }
    return data || [];
  }
}

export const auditRepo = new AuditRepository();
