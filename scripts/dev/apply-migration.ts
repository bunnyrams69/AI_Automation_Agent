import dotenv from 'dotenv';
dotenv.config();
import { getSupabase } from '../src/db/client.js';

async function testSchema() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('email_outbox').select('*').limit(1);
  if (error) {
    console.log('email_outbox table check:', error.message);
  } else {
    console.log('email_outbox table exists!');
  }
}

testSchema();
