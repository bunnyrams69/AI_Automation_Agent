import dotenv from 'dotenv';
dotenv.config();

async function testToken() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const res = await fetch(`https://graph.facebook.com/v26.0/${phoneId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Meta Token Check Status:', res.status);
  console.log('Response body:', JSON.stringify(data, null, 2));
}

testToken().catch(console.error);
