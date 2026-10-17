import dotenv from 'dotenv';
dotenv.config();

async function checkMetaAuth() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION || 'v26.0';

  console.log(`Testing Meta Graph API: Phone ID = ${phoneId}, Version = ${version}`);
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log(`Status Code: ${res.status}`);
    console.log('Response Payload:', JSON.stringify(data, null, 2));

    if (res.ok) {
      console.log('✅ Meta WhatsApp Cloud API credentials are VALID!');
    } else {
      console.error('❌ Meta WhatsApp Cloud API returned an error.');
    }
  } catch (err) {
    console.error('Network or fetch error:', err);
  }
}

checkMetaAuth();
