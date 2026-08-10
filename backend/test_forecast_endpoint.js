import pg from "pg";
import fs from "fs";

const connectionString = "postgresql://aida:JRSkrX8Mde5aGYruRKCPfgfUyNbQAy3W@dpg-d9l1moj7uimc738cjo30-a.oregon-postgres.render.com/aida_q30e";

console.log("Connecting to database...");
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("SELECT id, name, data_json FROM datasets ORDER BY id DESC LIMIT 1");
    if (res.rows.length === 0) {
      console.log("No datasets found in database.");
      process.exit(0);
    }
    
    const dataset = res.rows[0];
    console.log(`Latest dataset: ID=${dataset.id}, Name="${dataset.name}"`);
    
    const sourceRows = dataset.data_json.rows || [];
    const sourceCols = dataset.data_json.columns || [];
    
    // Save to scratch directory
    const payload = { rows: sourceRows, columns: sourceCols };
    fs.writeFileSync("temp_dataset.json", JSON.stringify(payload, null, 2));
    console.log("Saved dataset payload to temp_dataset.json");
    
    process.exit(0);
  } catch (err) {
    console.error("Failed to fetch and save dataset:", err);
    process.exit(1);
  }
}

run();
