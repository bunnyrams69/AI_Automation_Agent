import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

async function simulateLeadMessage() {
  const secret = process.env.WHATSAPP_APP_SECRET || '';
  const testPhone = process.env.TEST_WHATSAPP_PHONE || '919876543210';
  const url = 'http://127.0.0.1:3000/webhook';

  const messageId = `wamid.SIMULATED_${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '2515017775685712',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15556700586',
                phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '1209038115629162',
              },
              contacts: [
                {
                  profile: {
                    name: 'Test Customer',
                  },
                  wa_id: testPhone,
                },
              ],
              messages: [
                {
                  from: testPhone,
                  id: messageId,
                  timestamp,
                  text: {
                    body: 'Hi, I saw your ad for Green Meadows plots near Shamshabad. What is the price per square yard and can I visit tomorrow at 11 AM?',
                  },
                  type: 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  const bodyStr = JSON.stringify(payload);
  const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');

  console.log(`Sending simulated webhook message from ${testPhone} to local server...`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature,
    },
    body: bodyStr,
  });

  const text = await res.text();
  console.log(`Server responded with Status: ${res.status}, Body: ${text}`);
}

simulateLeadMessage();
