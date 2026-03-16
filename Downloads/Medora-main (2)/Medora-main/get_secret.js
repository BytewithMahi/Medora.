import pkg from 'pg';
const { Client } = pkg;

async function getJwtSecret() {
  const client = new Client({
    connectionString: "postgresql://postgres:RyU4GJ8eVCfySfUs@db.bmssgrwemsmdbclbdhfq.supabase.co:5432/postgres",
  });

  try {
    await client.connect();
    // Try to get supabase jwt secret
    const res = await client.query("SHOW pgrst.jwt_secret;");
    console.log("Secret from SHOW pgrst.jwt_secret:", res.rows);
  } catch (err) {
    console.error("Error with SHOW pgrst.jwt_secret:", err.message);
  }

  try {
    const res2 = await client.query("SELECT current_setting('pgrst.jwt_secret', true);");
    console.log("Secret from current_setting('pgrst.jwt_secret', true):", res2.rows);
  } catch (err) {
    console.error("Error with current_setting:", err.message);
  }

  try {
    const res3 = await client.query('SELECT current_setting(\'app.settings.jwt_secret\', true);');
    console.log("Secret from current_setting('app.settings.jwt_secret', true):", res3.rows);
  } catch (err) {
    console.error("Error with app.settings.jwt_secret:", err.message);
  }

  await client.end();
}

getJwtSecret();
