import dotenv from 'dotenv';
dotenv.config();
import { getSupabase } from '../src/db/client.js';

async function resetAllToAiMode() {
  const supabase = getSupabase();
  const { data: convs, error } = await supabase
    .from('conversations')
    .update({ mode: 'ai' })
    .neq('mode', 'ai')
    .select('id, lead_id, mode');

  console.log('Reset result:', JSON.stringify(convs, null, 2), error);

  const { data: all } = await supabase.from('conversations').select('id, lead_id, mode');
  console.log('All Conversations currently:', JSON.stringify(all, null, 2));
}

resetAllToAiMode();
