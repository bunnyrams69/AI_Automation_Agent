import dotenv from 'dotenv';
dotenv.config();
import { getSupabase } from '../src/db/client.js';

async function diagnose() {
  const supabase = getSupabase();

  console.log('=== INBOUND EVENTS (Latest 10) ===');
  const { data: events, error: eErr } = await supabase
    .from('inbound_events')
    .select('id, lead_wa_id, status, attempts, last_error, locked_at, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(JSON.stringify(events, null, 2), eErr);

  console.log('\n=== AUDIT LOG (Latest 10) ===');
  const { data: audits, error: aErr } = await supabase
    .from('audit_log')
    .select('id, event_type, entity_id, action, actor, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(JSON.stringify(audits, null, 2), aErr);

  console.log('\n=== CONVERSATIONS ===');
  const { data: convs, error: cErr } = await supabase
    .from('conversations')
    .select('id, lead_id, mode, last_message_at, updated_at');
  console.log(JSON.stringify(convs, null, 2), cErr);

  console.log('\n=== MESSAGES (Latest 12) ===');
  const { data: msgs, error: mErr } = await supabase
    .from('messages')
    .select('id, lead_id, direction, type, body, created_at')
    .order('created_at', { ascending: false })
    .limit(12);
  console.log(JSON.stringify(msgs?.reverse(), null, 2), mErr);
}

diagnose();
