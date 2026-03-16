import pkg from 'pg';
const { Client } = pkg;
const client = new Client({ connectionString: "postgresql://postgres:RyU4GJ8eVCfySfUs@db.bmssgrwemsmdbclbdhfq.supabase.co:5432/postgres" });
(async () => {
  await client.connect();
  try {
    const res = await client.query("INSERT INTO users (role, name, email, passkey, status) VALUES ('Admin', 'System Admin', 'admin@medchain.net', 'admin123', 'Approved') ON CONFLICT (email) DO UPDATE SET role = 'Admin', status = 'Approved'");
    console.log("Admin account injected!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
})();
