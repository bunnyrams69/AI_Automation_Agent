import dotenv from 'dotenv';
dotenv.config();
import { leadsRepo } from '../src/db/repositories/leads.repo.js';
import { messagesRepo } from '../src/db/repositories/messages.repo.js';

async function check() {
  const testPhone = process.env.TEST_WHATSAPP_PHONE || '919876543210';
  const lead = await leadsRepo.findByWaId(testPhone);
  console.log('--- LEAD RECORD ---');
  console.log('ID:', lead?.id);
  console.log('Name:', lead?.name);
  console.log('Phone:', lead?.phone);
  console.log('Lead Score:', lead?.score);
  console.log('Score Reason:', lead?.score_reason);
  console.log('Intent to visit:', lead?.intent_to_visit);
  console.log('Summary:', lead?.summary);

  if (lead) {
    const msgs = await messagesRepo.getRecentByLeadId(lead.id, 10);
    console.log('\n--- MESSAGES HISTORY ---');
    for (const m of msgs) {
      console.log(`[${m.direction.toUpperCase()} | ${m.created_at}] ${m.body}`);
    }
  }
}

check();
