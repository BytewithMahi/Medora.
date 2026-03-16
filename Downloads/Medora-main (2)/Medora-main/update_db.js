import pkg from 'pg';
const { Client } = pkg;

async function updateDb() {
  const client = new Client({
    connectionString: "postgresql://postgres:RyU4GJ8eVCfySfUs@db.bmssgrwemsmdbclbdhfq.supabase.co:5432/postgres",
  });

  try {
    await client.connect();
    console.log("Connected to Supabase DB via pg.");

    // Add qr_token and scan_count to medicines table
    await client.query(`
      ALTER TABLE medicines 
      ADD COLUMN IF NOT EXISTS qr_token TEXT,
      ADD COLUMN IF NOT EXISTS scan_count INT DEFAULT 0;
    `);
    
    // Add unique constraint on qr_token
    try {
        await client.query(`ALTER TABLE medicines ADD CONSTRAINT qr_token_unique UNIQUE (qr_token);`);
    } catch (e) {
        console.log("Unique constraint on qr_token might already exist or token data overlaps.");
    }
    
    console.log("Successfully added qr_token and scan_count to medicines table.");

  } catch (err) {
    console.error("Database update failed:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

updateDb();
