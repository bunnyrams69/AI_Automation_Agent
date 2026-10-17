import dotenv from 'dotenv';
dotenv.config();

async function getEventTypes() {
  const apiKey = process.env.CAL_API_KEY || process.env['cal.com'];
  const res = await fetch(`https://api.cal.com/v2/event-types`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': '2024-06-11',
    },
  });
  const data = await res.json();
  console.log('Event Types:', JSON.stringify(data, null, 2));
}

getEventTypes();
