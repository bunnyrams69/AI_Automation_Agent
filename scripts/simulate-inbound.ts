import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const appSecret = process.env.WHATSAPP_APP_SECRET || 'mock-app-secret-1234567890abcdef';
const port = process.env.PORT || 3000;
const targetUrl = process.argv.find((a) => a.startsWith('--url='))?.split('=')[1] || `http://localhost:${port}/webhook`;
const msgType = process.argv.find((a) => a.startsWith('--type='))?.split('=')[1] || 'text';
const phone = process.argv.find((a) => a.startsWith('--phone='))?.split('=')[1] || '919876543210';
const customText =
  process.argv.find((a) => a.startsWith('--message='))?.split('=')[1] ||
  'Hi! I saw your ad for Emerald Meadows villa plots. Can I book a site visit for this Saturday morning?';

console.log(`\n======================================================`);
console.log(`🚀 Simulating WhatsApp Webhook Inbound Event`);
console.log(`🎯 Target Endpoint: ${targetUrl}`);
console.log(`📱 From Phone: ${phone}`);
console.log(`✉️ Message Type: ${msgType}`);
console.log(`======================================================\n`);

let messagePayload: any;

switch (msgType) {
  case 'audio':
    messagePayload = {
      from: phone,
      id: `wamid.SIM_AUDIO_${Date.now()}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type: 'audio',
      audio: {
        id: 'mock_voice_media_id_123',
        mime_type: 'audio/ogg; codecs=opus',
        voice: true,
      },
    };
    break;

  case 'image':
    messagePayload = {
      from: phone,
      id: `wamid.SIM_IMAGE_${Date.now()}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type: 'image',
      image: {
        id: 'mock_image_media_id_456',
        mime_type: 'image/jpeg',
        caption: 'Can I get something similar to this layout?',
      },
    };
    break;

  case 'status':
    messagePayload = null; // statuses handled separately
    break;

  case 'button':
    messagePayload = {
      from: phone,
      id: `wamid.SIM_BTN_${Date.now()}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type: 'interactive',
      interactive: {
        type: 'button_reply',
        button_reply: {
          id: 'slot_sat_1030',
          title: 'Saturday 10:30 AM',
        },
      },
    };
    break;

  case 'text':
  default:
    messagePayload = {
      from: phone,
      id: `wamid.SIM_TEXT_${Date.now()}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type: 'text',
      text: { body: customText },
      referral: {
        source_url: 'https://fb.me/luxury_plots',
        source_id: 'fb_ad_789012',
        headline: 'Exclusive HMDA Villa Plots in Mokila Corridor',
      },
    };
    break;
}

const webhookBody = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1555019999',
              phone_number_id: 'WHATSAPP_PHONE_NUMBER_ID',
            },
            contacts: [
              {
                profile: { name: 'Simulated Lead' },
                wa_id: phone,
              },
            ],
            messages: messagePayload ? [messagePayload] : [],
            statuses:
              msgType === 'status'
                ? [
                    {
                      id: `wamid.SIM_STATUS_${Date.now()}`,
                      status: 'delivered',
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      recipient_id: phone,
                    },
                  ]
                : [],
          },
        },
      ],
    },
  ],
};

const rawBodyString = JSON.stringify(webhookBody);
const hmac = crypto.createHmac('sha256', appSecret);
hmac.update(Buffer.from(rawBodyString, 'utf8'));
const signatureHeader = `sha256=${hmac.digest('hex')}`;

async function sendSimulation() {
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signatureHeader,
      },
      body: rawBodyString,
    });

    const status = res.status;
    const body = await res.text();

    console.log(`Server HTTP Response: ${status}`);
    console.log(`Response Body: ${body}`);

    if (res.ok) {
      console.log('\n✅ Webhook accepted successfully! The background queue worker is now processing.');
    } else {
      console.log('\n❌ Webhook was rejected by the server.');
    }
  } catch (err: any) {
    console.error('\n❌ Failed to connect to server:', err.message);
    console.error('Make sure the server is running (npm run dev) on the specified port.');
  }
}

sendSimulation();
