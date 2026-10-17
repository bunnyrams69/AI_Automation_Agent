import dotenv from 'dotenv';
dotenv.config();

const models = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-pro-preview',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
];

async function checkAll() {
  const key = process.env.GEMINI_API_KEY;
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }],
        }),
      });
      const data = await res.json();
      console.log(`[${model}] HTTP ${res.status}:`, res.status === 200 ? 'SUCCESS' : JSON.stringify(data).slice(0, 100));
      if (res.status === 200) {
        console.log(`🎯 FOUND WORKING MODEL WITH ACTIVE QUOTA: ${model}`);
        return model;
      }
    } catch (e: any) {
      console.log(`[${model}] Error:`, e.message);
    }
  }
}

checkAll();
