import pkg from 'pg';
const { Client } = pkg;

async function createMessagesTable() {
  const client = new Client({
    connectionString: "postgresql://postgres:RyU4GJ8eVCfySfUs@db.bmssgrwemsmdbclbdhfq.supabase.co:5432/postgres",
  });

  try {
    await client.connect();
    console.log("Connected to Supabase DB via pg.");

    // Create messages_queue table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages_queue (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        sender_email TEXT NOT NULL,
        receiver_email TEXT NOT NULL,
        content TEXT NOT NULL,
        batch_no TEXT,
        status TEXT DEFAULT 'queued',
        timestamp_delivery TIMESTAMPTZ DEFAULT NOW(),
        timestamp_receive TIMESTAMPTZ
      );
    `);
    console.log("messages_queue table created or exists.");

    // Enable RLS
    await client.query(`ALTER TABLE messages_queue ENABLE ROW LEVEL SECURITY;`);

    // Drop existing policy if exists
    await client.query(`DROP POLICY IF EXISTS "Allow public read-write for messages_queue" ON messages_queue;`).catch(() => {});

    // Create policy for public access (simulating anon role for setup)
    await client.query(`
      CREATE POLICY "Allow public read-write for messages_queue" 
      ON messages_queue FOR ALL USING (true) WITH CHECK (true);
    `);
    console.log("RLS policy created for messages_queue.");

  } catch (err) {
    console.error("Failed to create messages_queue table:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

createMessagesTable();
