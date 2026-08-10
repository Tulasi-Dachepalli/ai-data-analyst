import pg from "pg";

const connectionString = process.argv[2];
if (!connectionString) {
  console.error("Please provide the database connection string as an argument:");
  console.error('node test_db.js "postgresql://user:password@host:port/database"');
  process.exit(1);
}

console.log("Testing database connection...");
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000
});

pool.query("SELECT NOW()")
  .then(res => {
    console.log("🟢 SUCCESS! Connected to database successfully.");
    console.log("Database current time:", res.rows[0].now);
    process.exit(0);
  })
  .catch(err => {
    console.error("🔴 FAILED! Database connection failed:");
    console.error(err);
    process.exit(1);
  });
