import pg from "pg";
import jwt from "jsonwebtoken";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:SuperSecurePasswordForAIDA2026!@localhost:5432/ai_data_analyst";
const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log("🚀 Starting Node.js Express API Security Verification Tests...\n");
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  let companyAId, companyBId;
  let userAId, userBId;
  let tokenA, tokenB;
  let datasetAId;

  try {
    const suffix = Date.now();

    // 1. Seed Company A and User A
    const resA = await pool.query(
      "INSERT INTO companies (name, name_normalized) VALUES ($1, $2) RETURNING id",
      [`Test Security Corp A ${suffix}`, `test security corp a ${suffix}`]
    );
    companyAId = resA.rows[0].id;

    const userARes = await pool.query(
      "INSERT INTO users (company_id, email, password_hash, role) VALUES ($1, $2, 'dummy', 'admin') RETURNING id",
      [companyAId, `admin_a_${suffix}@test.com`]
    );
    userAId = userARes.rows[0].id;

    tokenA = jwt.sign(
      { userId: userAId, companyId: companyAId, email: `admin_a_${suffix}@test.com`, role: "admin" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );

    // 2. Seed Company B and User B
    const resB = await pool.query(
      "INSERT INTO companies (name, name_normalized) VALUES ($1, $2) RETURNING id",
      [`Test Security Corp B ${suffix}`, `test security corp b ${suffix}`]
    );
    companyBId = resB.rows[0].id;

    const userBRes = await pool.query(
      "INSERT INTO users (company_id, email, password_hash, role) VALUES ($1, $2, 'dummy', 'admin') RETURNING id",
      [companyBId, `admin_b_${suffix}@test.com`]
    );
    userBId = userBRes.rows[0].id;

    tokenB = jwt.sign(
      { userId: userBId, companyId: companyBId, email: `admin_b_${suffix}@test.com`, role: "admin" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );

    // 3. Seed Dataset A (belongs to Company A)
    const datasetARes = await pool.query(
      `INSERT INTO datasets (company_id, created_by, name, row_count, column_count, data_json, messages_json)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb) RETURNING id`,
      [
        companyAId,
        userAId,
        "Dataset A",
        3,
        2,
        JSON.stringify({
          rows: [
            { date: "2026-01-01", val: 10 },
            { date: "2026-01-02", val: 12 },
            { date: "2026-01-03", val: 15 }
          ],
          columns: ["date", "val"],
          stats: [
            { name: "date", type: "categorical", unique: 3, missing: 0 },
            { name: "val", type: "numeric", unique: 3, missing: 0, mean: 12.33, median: 12, min: 10, max: 15 }
          ]
        }),
        JSON.stringify([])
      ]
    );
    datasetAId = datasetARes.rows[0].id;
    console.log(`✅ Seeded test users, companies, and Dataset A ID: ${datasetAId}`);

    // --- TEST 1: Cross-company dataset read boundary check ---
    console.log("\n🛡️ Test 1: Query GET /api/datasets/:id for Dataset A with Company B Token...");
    const r1 = await fetch(`${BASE_URL}/datasets/${datasetAId}`, {
      headers: { "Authorization": `Bearer ${tokenB}` }
    });
    if (r1.status === 404) {
      console.log("✅ Test 1 PASSED: Cross-company read blocked with 404.");
    } else {
      console.error(`❌ Test 1 FAILED: Status was ${r1.status} (expected 404).`);
    }

    // --- TEST 2: Cross-company dataset delete boundary check ---
    console.log("\n🛡️ Test 2: Query DELETE /api/datasets/:id for Dataset A with Company B Token...");
    const r2 = await fetch(`${BASE_URL}/datasets/${datasetAId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${tokenB}` }
    });
    if (r2.status === 404) {
      console.log("✅ Test 2 PASSED: Cross-company delete blocked with 404.");
    } else {
      console.error(`❌ Test 2 FAILED: Status was ${r2.status} (expected 404).`);
    }

    // --- TEST 3: Cross-company ai_usage insertion boundary check ---
    console.log("\n🛡️ Test 3: Query POST /api/analyze with Company B Token and Company A datasetId...");
    const r3 = await fetch(`${BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenB}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        system: "System prompt",
        userText: "User prompt",
        requestType: "test",
        datasetId: datasetAId
      })
    });
    if (r3.status === 404) {
      console.log("✅ Test 3 PASSED: Cross-company ai_usage lookup rejected with 404.");
    } else {
      console.error(`❌ Test 3 FAILED: Status was ${r3.status} (expected 404).`);
    }

    // --- TEST 4: ML train test_size parameters validation check ---
    console.log("\n🛡️ Test 4: Query POST /ml/train with test_size = 0.99 (out of range)...");
    const r4 = await fetch(`${BASE_URL}/datasets/${datasetAId}/ml/train`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenA}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        task_type: "regression",
        target: "val",
        features: ["date"],
        test_size: 0.99
      })
    });
    if (r4.status === 400) {
      const body = await r4.json();
      console.log(`✅ Test 4 PASSED: Out-of-bounds test_size rejected: "${body.error}"`);
    } else {
      console.error(`❌ Test 4 FAILED: Status was ${r4.status} (expected 400).`);
    }

    // --- TEST 5: ML train cv_folds parameters validation check ---
    console.log("\n🛡️ Test 5: Query POST /ml/train with cv_folds = 12 (out of range)...");
    const r5 = await fetch(`${BASE_URL}/datasets/${datasetAId}/ml/train`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenA}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        task_type: "regression",
        target: "val",
        features: ["date"],
        cv_folds: 12
      })
    });
    if (r5.status === 400) {
      const body = await r5.json();
      console.log(`✅ Test 5 PASSED: Out-of-bounds cv_folds rejected: "${body.error}"`);
    } else {
      console.error(`❌ Test 5 FAILED: Status was ${r5.status} (expected 400).`);
    }

    // --- TEST 6: Forecasting horizon parameters validation check ---
    console.log("\n🛡️ Test 6: Query POST /forecast/train with horizon = 150 (out of range)...");
    const r6 = await fetch(`${BASE_URL}/datasets/${datasetAId}/forecast/train`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenA}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date_column: "date",
        target_column: "val",
        frequency: "D",
        horizon: 150
      })
    });
    if (r6.status === 400) {
      const body = await r6.json();
      console.log(`✅ Test 6 PASSED: Out-of-bounds horizon rejected: "${body.error}"`);
    } else {
      console.error(`❌ Test 6 FAILED: Status was ${r6.status} (expected 400).`);
    }

  } catch (err) {
    console.error("❌ Test runner error:", err);
  } finally {
    // 4. Cleanup seeded test database tables
    if (datasetAId) {
      await pool.query("DELETE FROM datasets WHERE id = $1", [datasetAId]);
    }
    if (userAId) {
      await pool.query("DELETE FROM users WHERE id = $1", [userAId]);
    }
    if (userBId) {
      await pool.query("DELETE FROM users WHERE id = $1", [userBId]);
    }
    if (companyAId) {
      await pool.query("DELETE FROM companies WHERE id = $1", [companyAId]);
    }
    if (companyBId) {
      await pool.query("DELETE FROM companies WHERE id = $1", [companyBId]);
    }
    console.log("\n🧹 Seed cleanup done.");
    await pool.end();
    console.log("\n🏁 Security Verification Tests completed.");
  }
}

runTests();
