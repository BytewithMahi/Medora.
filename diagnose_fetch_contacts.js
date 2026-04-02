import pkg from 'pg';
const { Client } = pkg;

async function diagnoseContacts() {
  const client = new Client({
    connectionString: "postgresql://postgres:RyU4GJ8eVCfySfUs@db.bmssgrwemsmdbclbdhfq.supabase.co:5432/postgres",
  });

  try {
    await client.connect();

    // Fetch all unique actors from ledger_events
    const actorsRes = await client.query(`SELECT DISTINCT actor_email FROM ledger_events`);
    const actors = actorsRes.rows.map(r => r.actor_email);

    console.log(`Found ${actors.length} actors in ledger_events:\n`);

    for (const email of actors) {
      // Find their role from users table
      const userRes = await client.query(`SELECT role FROM users WHERE email = $1`, [email]);
      const role = userRes.rows[0]?.role || 'Unknown';

      // Simulate fetchContacts logic for this user
      if (role === 'Manufacturer') {
        // Manufacturers have no preceding nodes
        console.log(`[Manufacturer] ${email} -> 0 contacts (By design)`);
        continue;
      }

      // Query user events directly
      const userEventsRes = await client.query(`
        SELECT DISTINCT medicine_id FROM ledger_events WHERE actor_email = $1
      `, [email]);
      const medicineIds = userEventsRes.rows.map(r => r.medicine_id);

      if (medicineIds.length === 0) {
        console.log(`[${role}] ${email} -> 0 contacts (No events)`);
        continue;
      }

      let precedingRoleDB = '';
      if (role === 'Customer') precedingRoleDB = 'Retailer Verification';
      else if (role === 'Retailer') precedingRoleDB = 'Distributor Verification';
      else if (role === 'Distributor') precedingRoleDB = 'Producer Initialization';

      let contactsFound = 0;

      for (const medId of medicineIds) {
         const precEventsRes = await client.query(`
           SELECT actor_email FROM ledger_events WHERE medicine_id = $1 AND role = $2
         `, [medId, precedingRoleDB]);
         
         const validPrec = precEventsRes.rows.filter(r => r.actor_email && r.actor_email !== email);
         contactsFound += validPrec.length;
      }

      console.log(`[${role}] ${email} -> ${contactsFound} contacts`);
    }

  } catch (err) {
    console.error("Diagnosis failed:", err);
  } finally {
    await client.end();
  }
}

diagnoseContacts();
