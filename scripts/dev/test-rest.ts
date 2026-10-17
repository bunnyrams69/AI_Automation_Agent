import dotenv from 'dotenv';
dotenv.config();

async function testFetch(model: string) {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  console.log(`Testing direct REST fetch for ${model}...`);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hi' }] }],
      }),
    });
    const data = await res.json();
    console.log(`HTTP ${res.status} in ${Date.now() - t0}ms:`, JSON.stringify(data).slice(0, 200));
  } catch (err: any) {
    console.error(`Fetch failed for ${model}:`, err.message);
  }
}

async function run() {
  await testFetch('gemini-2.5-flash');
  await testFetch('gemini-2.5-pro');
  await testFetch('gemini-flash-latest');
  await testFetch('gemini-3.8-flash');
}

run();
