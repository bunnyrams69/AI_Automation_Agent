async function ping() {
  try {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();
    console.log('Public Health Check HTTP Status:', res.status);
    console.log('Public Health Response:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Ping error:', err.message);
  }
}
ping();
