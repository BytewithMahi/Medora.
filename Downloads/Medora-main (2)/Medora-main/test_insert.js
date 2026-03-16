import pkg from 'pg';
const { Client } = pkg;

async function testInsert() {
  const client = new Client({
    connectionString: "postgresql://postgres:RyU4GJ8eVCfySfUs@db.bmssgrwemsmdbclbdhfq.supabase.co:5432/postgres",
  });

  try {
    await client.connect();
    console.log("Connected to Supabase DB.");

    const testBatch = "TEST-" + Math.random().toString(36).substring(7).toUpperCase();
    const testToken = Math.random().toString(16).substring(2, 10).toUpperCase();

    console.log(`Trying to insert with batch: ${testBatch}, token: ${testToken}`);

    const res = await client.query(`
      INSERT INTO medicines (name, batch_no, mfg_date, expiry_date, composition, status, qr_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, ["Test Medicine", testBatch, "2026-03-12", "2028-06-16", "Test Composition", "created", testToken]);

    console.log("Insert medicine SUCCESS:", res.rows[0]);

    const medicineId = res.rows[0].id;

    // Test Ledger Event insert
    const ledgerRes = await client.query(`
      INSERT INTO ledger_events (medicine_id, role, status, details, actor_email, actor_phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [medicineId, 'Producer Initialization', 'verified', JSON.stringify({ 'Batch No': testBatch }), 'ops@medorapharma.com', '+1-555-0192']);

    console.log("Insert ledger SUCCESS:", ledgerRes.rows[0]);

  } catch (err) {
    console.error("Test failed with error:", err.message);
    if (err.detail) console.error("Detail:", err.detail);
    if (err.hint) console.error("Hint:", err.hint);
  } finally {
    await client.end();
  }
}

testInsert();
