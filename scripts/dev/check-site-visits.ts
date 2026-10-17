import dotenv from 'dotenv';
dotenv.config();
import { getSupabase } from '../src/db/client.js';

async function checkVisits() {
  const supabase = getSupabase();
  const { data: visits } = await supabase.from('site_visits').select('*, sites(name), availability_slots(starts_at)').order('created_at', { ascending: false });
  console.log('--- SITE VISITS IN SUPABASE ---');
  console.log(JSON.stringify(visits, null, 2));
}

checkVisits();
