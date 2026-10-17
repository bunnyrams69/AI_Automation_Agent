import dotenv from 'dotenv';
dotenv.config();

async function testSendMessage() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION || 'v26.0';
  const recipient = process.env.TEST_WHATSAPP_PHONE || '919876543210';

  console.log(`Sending test template message to: ${recipient}`);

  // Test with standard hello_world template
  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US',
      },
    },
  };

  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (res.ok) {
      console.log('🎉 Outbound WhatsApp message successfully delivered to Meta queue!');
    } else {
      console.log('⚠️ Meta returned error for outbound message.');
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testSendMessage();
