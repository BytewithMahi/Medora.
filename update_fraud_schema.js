import pkg from 'pg';
const { Client } = pkg;

async function updateDb() {
  const client = new Client({
    connectionString: "postgresql://postgres:RyU4GJ8eVCfySfUs@db.bmssgrwemsmdbclbdhfq.supabase.co:5432/postgres",
  });

  try {
    await client.connect();
    console.log("Connected to Supabase DB via pg.");

    // Add flagged_reasons to medicines
    await client.query(`
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS flagged_reasons JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("Added flagged_reasons column to medicines.");

    // Add location to ledger_events
    await client.query(`
      ALTER TABLE ledger_events ADD COLUMN IF NOT EXISTS location JSONB;
    `);
    console.log("Added location column to ledger_events.");

  } catch (err) {
    console.error("Database update failed:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

updateDb();
