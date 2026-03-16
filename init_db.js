import pkg from 'pg';
const { Client } = pkg;

async function initDb() {
  const client = new Client({
    connectionString: "postgresql://postgres:RyU4GJ8eVCfySfUs@db.bmssgrwemsmdbclbdhfq.supabase.co:5432/postgres",
  });

  try {
    await client.connect();
    console.log("Connected to Supabase DB via pg.");

    // Create medicines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        batch_no TEXT NOT NULL UNIQUE,
        mfg_date DATE,
        expiry_date DATE,
        composition TEXT,
        status TEXT DEFAULT 'created',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("medicines table created or exists.");

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passkey TEXT NOT NULL,
        status TEXT DEFAULT 'Approved',
        request_id TEXT,
        kyc_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Attempt to manually add them in case the table already existed without them
    try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Approved';`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS request_id TEXT;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_data JSONB;`);
    } catch (e) {
        console.log("Columns might already exist.");
    }

    console.log("users table created or exists.");

    // Create ledger_events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ledger_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        actor_email TEXT,
        actor_phone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("ledger_events table created or exists.");

    // Create Row Level Security policies (allow all for now, as anon key will act as anon user)
    // First enable RLS
    await client.query(`ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE ledger_events ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);

    // Drop existing policies if they exist (ignore errors)
    await client.query(`DROP POLICY IF EXISTS "Allow public read-write for medicines" ON medicines;`).catch(() => {});
    await client.query(`DROP POLICY IF EXISTS "Allow public read-write for ledger_events" ON ledger_events;`).catch(() => {});
    await client.query(`DROP POLICY IF EXISTS "Allow public read-write for users" ON users;`).catch(() => {});

    // Create policies to allow public access (since there is no auth yet, anon user needs access)
    await client.query(`CREATE POLICY "Allow public read-write for medicines" ON medicines FOR ALL USING (true) WITH CHECK (true);`);
    await client.query(`CREATE POLICY "Allow public read-write for ledger_events" ON ledger_events FOR ALL USING (true) WITH CHECK (true);`);
    await client.query(`CREATE POLICY "Allow public read-write for users" ON users FOR ALL USING (true) WITH CHECK (true);`);
    console.log("RLS policies created for public access.");

  } catch (err) {
    console.error("Database initialization failed:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

initDb();
