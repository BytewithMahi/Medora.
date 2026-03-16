import pkg from 'pg';
const { Client } = pkg;

async function checkBatch() {
  const client = new Client({
    connectionString: "postgresql://postgres:RyU4GJ8eVCfySfUs@db.bmssgrwemsmdbclbdhfq.supabase.co:5432/postgres",
  });

  try {
    await client.connect();
    
    // Check if 123456 exists
    const res = await client.query("SELECT id, name, batch_no FROM medicines WHERE batch_no = '123456'");
    if (res.rows.length > 0) {
      console.log("FOUND existing record for batch '123456':", res.rows[0]);
    } else {
      console.log("Batch '123456' DOES NOT exist in database.");
    }

    // List last 5 medicines to see what is there
    const listRes = await client.query("SELECT id, name, batch_no, created_at FROM medicines ORDER BY created_at DESC LIMIT 5");
    console.log("Last 5 medicines in DB:");
    listRes.rows.forEach(r => console.log(` - ${r.name} (Batch: ${r.batch_no}) ID: ${r.id}`));

  } catch (err) {
    console.error("Query failed:", err.message);
  } finally {
    await client.end();
  }
}

checkBatch();
