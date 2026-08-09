import pg from "pg";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:SuperSecurePasswordForAIDA2026!@localhost:5432/ai_data_analyst";

async function checkLatestDataset() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    const res = await pool.query("SELECT id, name, data_json->'stats' as stats FROM datasets ORDER BY created_at DESC LIMIT 1;");
    if (res.rows.length === 0) {
      console.log("No datasets found in database.");
      return;
    }
    const row = res.rows[0];
    console.log(`Latest Dataset ID: ${row.id}, Name: ${row.name}`);
    console.log("Computed Column Stats:");
    console.log(JSON.stringify(row.stats, null, 2));
  } catch (err) {
    console.error("Error reading database:", err);
  } finally {
    await pool.end();
  }
}

checkLatestDataset();
