import dotenv from 'dotenv';
import { whatsAppClient } from '../src/whatsapp/client.js';

dotenv.config();

const targetPhone = process.argv[2] || process.env.TEST_WHATSAPP_PHONE || '';
const testMessage =
  process.argv[3] ||
  'Hello from Apex Green Estates! 🌿 This is a test message from your WhatsApp AI Sales Agent.';

if (!targetPhone) {
  console.error('\nUsage: npm run send-test <phone_number_with_country_code> [optional_message]');
  console.error('Example: npm run send-test 919876543210 "Hello from the agent!"\n');
  process.exit(1);
}

async function run() {
  console.log(`\nDispatching test WhatsApp message to: ${targetPhone}...`);
  try {
    const msgId = await whatsAppClient.sendText(targetPhone, testMessage);
    console.log(`✅ Success! WhatsApp Message ID: ${msgId}\n`);
  } catch (err: any) {
    console.error(`\n❌ Error sending message:`, err.message);
    process.exit(1);
  }
}

run();
