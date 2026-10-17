import dotenv from 'dotenv';
dotenv.config();
import { getSupabase } from '../src/db/client.js';

async function check() {
  const supabase = getSupabase();
  const { data: events, error } = await supabase
    .from('inbound_events')
    .select('id, status, attempts, last_error, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('Inbound Events in DB:', events, 'Error:', error);
}

check();
