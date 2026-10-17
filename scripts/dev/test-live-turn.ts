import dotenv from 'dotenv';
dotenv.config();
import { leadsRepo } from '../src/db/repositories/leads.repo.js';
import { conversationsRepo } from '../src/db/repositories/conversations.repo.js';
import { agentOrchestrator } from '../src/agent/orchestrator.js';

async function testTurn() {
  const testPhone = process.env.TEST_WHATSAPP_PHONE || '919876543210';
  const lead = await leadsRepo.findByWaId(testPhone);
  if (!lead) {
    console.error('Lead not found');
    return;
  }
  const conversation = await conversationsRepo.getOrCreateForLead(lead.id);

  console.log('Testing turn with message: "Hi what are the plot sizes"...');
  const t0 = Date.now();
  try {
    const res = await agentOrchestrator.processLeadTurn(
      lead,
      conversation,
      'Hi what are the plot sizes'
    );
    console.log(`\n🎉 Turn finished in ${Date.now() - t0}ms!`);
    console.log('Reply:', res.replyText);
    console.log('Tool calls executed:', res.toolCallsExecuted);
  } catch (err: any) {
    console.error(`\n❌ Turn failed in ${Date.now() - t0}ms:`, err);
  }
}

testTurn();
