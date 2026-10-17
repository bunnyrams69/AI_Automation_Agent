async function check() {
  const res = await fetch('http://127.0.0.1:3000/health');
  const data = await res.json();
  console.log('/health status:', res.status, data);

  const calHealth = await fetch('http://127.0.0.1:3000/admin/cal/health', {
    headers: { 'x-admin-key': process.env.ADMIN_API_KEY || 'admin_secret_key_change_in_production_98765' }
  });
  const calData = await calHealth.json();
  console.log('/admin/cal/health status:', calHealth.status, calData);
}

check().catch(console.error);
