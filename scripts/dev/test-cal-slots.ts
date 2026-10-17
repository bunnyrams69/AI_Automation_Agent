import dotenv from 'dotenv';
dotenv.config();

async function testSlots() {
  const apiKey = process.env.CAL_API_KEY || process.env['cal.com'];
  const eventTypeId = 6759138;

  const now = new Date();
  const start = now.toISOString();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`Querying slots for eventType ${eventTypeId} between ${start} and ${end}...`);

  // Test with 2024-09-04 and 2024-08-13
  for (const ver of ['2024-09-04', '2024-08-13']) {
    const url = `https://api.cal.com/v2/slots?eventTypeId=${eventTypeId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&timeZone=Asia/Kolkata`;
    console.log(`Testing cal-api-version: ${ver}...`);
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'cal-api-version': ver,
        },
      });
      console.log(`[${ver}] HTTP Status:`, res.status);
      const data = await res.json();
      console.log(`[${ver}] Data sample:`, JSON.stringify(data, null, 2).slice(0, 400));
    } catch (e: any) {
      console.error(e.message);
    }
  }
}

testSlots();
