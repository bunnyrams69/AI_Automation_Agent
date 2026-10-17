import dotenv from 'dotenv';
dotenv.config();

async function testBookingLifecycle() {
  const apiKey = process.env.CAL_API_KEY || process.env['cal.com'];
  const eventTypeId = Number(process.env.CAL_DEFAULT_EVENT_TYPE_ID) || 12345;

  // Let's create a test booking for next week
  const startUtc = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  startUtc.setUTCHours(9, 0, 0, 0); // 9:00 AM UTC = 2:30 PM IST

  const payload = {
    start: startUtc.toISOString(),
    eventTypeId,
    attendee: {
      name: 'Test Customer',
      email: 'customer@example.com',
      timeZone: 'Asia/Kolkata',
      phoneNumber: '+919876543210',
    },
    metadata: {
      lead_id: 'test-lead-uuid',
      wa_id: '919876543210',
      site_id: '11111111-1111-1111-1111-111111111111',
      source: 'whatsapp-agent',
    },
  };

  console.log('Testing Cal.com POST /v2/bookings...');
  const res = await fetch('https://api.cal.com/v2/bookings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13',
    },
    body: JSON.stringify(payload),
  });

  console.log('Create Booking Status:', res.status);
  const data = await res.json();
  console.log('Create Booking Response:', JSON.stringify(data, null, 2));

  if (res.ok && data?.data?.uid) {
    const uid = data.data.uid;
    console.log(`Booking created with UID: ${uid}. Now testing cancel...`);

    const cancelRes = await fetch(`https://api.cal.com/v2/bookings/${uid}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
      body: JSON.stringify({ cancellationReason: 'Test lifecycle validation' }),
    });

    console.log('Cancel Status:', cancelRes.status);
    const cancelData = await cancelRes.json();
    console.log('Cancel Response:', JSON.stringify(cancelData, null, 2));
  }
}

testBookingLifecycle();
