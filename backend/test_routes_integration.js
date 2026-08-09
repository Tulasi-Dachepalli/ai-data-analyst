import pg from "pg";
import jwt from "jsonwebtoken";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:SuperSecurePasswordForAIDA2026!@localhost:5432/ai_data_analyst";
const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runIntegrationTests() {
  console.log("🚀 Starting End-to-End Functional Integration Tests...\n");
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  let companyId, userId, token, datasetId;

  try {
    const suffix = Date.now();

    // 1. Seed Company and User
    const resCompany = await pool.query(
      "INSERT INTO companies (name, name_normalized) VALUES ($1, $2) RETURNING id",
      [`Integration Corp ${suffix}`, `integration corp ${suffix}`]
    );
    companyId = resCompany.rows[0].id;

    const resUser = await pool.query(
      "INSERT INTO users (company_id, email, password_hash, role) VALUES ($1, $2, 'dummy', 'admin') RETURNING id",
      [companyId, `integrator_${suffix}@test.com`]
    );
    userId = resUser.rows[0].id;

    token = jwt.sign(
      { userId, companyId, email: `integrator_${suffix}@test.com`, role: "admin" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );

    // 2. Upload / Register Dataset (succeeds without SQL error due to rounded score float-to-int mapping)
    console.log("📥 Step 1: Query POST /api/datasets to register a profiled dataset...");
    const datasetPayload = {
      name: "SaiGroup_ComplianceExport_122stores_2026-05-25.xlsx",
      rows: [
        { date: "2026-01-01", target: 120, category: "A" },
        { date: "2026-01-02", target: 130, category: "B" },
        { date: "2026-01-03", target: 140, category: "A" },
        { date: "2026-01-04", target: 125, category: "B" },
        { date: "2026-01-05", target: 135, category: "A" },
        { date: "2026-01-06", target: 145, category: "B" },
        { date: "2026-01-07", target: 150, category: "A" },
        { date: "2026-01-08", target: 155, category: "B" },
        { date: "2026-01-09", target: 160, category: "A" },
        { date: "2026-01-10", target: 165, category: "B" },
        { date: "2026-01-11", target: 170, category: "A" },
        { date: "2026-01-12", target: 175, category: "B" }
      ],
      columns: ["date", "target", "category"],
      stats: [
        { name: "date", type: "categorical", unique: 12, missing: 0 },
        { name: "target", type: "numeric", unique: 12, missing: 0, mean: 147.5, median: 147.5, min: 120, max: 175 },
        { name: "category", type: "categorical", unique: 2, missing: 0 }
      ],
      quality: {
        score: 96.43 // Float score test case: must resolve cleanly to integer 96 in database
      }
    };

    const uploadRes = await fetch(`${BASE_URL}/datasets`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datasetPayload)
    });

    if (uploadRes.status === 201) {
      const uploadBody = await uploadRes.json();
      datasetId = uploadBody.dataset.id;
      console.log(`✅ Step 1 PASSED: Dataset registered successfully. serverId = ${datasetId}`);
    } else {
      const errText = await uploadRes.text();
      throw new Error(`Step 1 FAILED: Status ${uploadRes.status}. Error: ${errText}`);
    }

    // 3. EDA Insights
    console.log("\n🔍 Step 2: Query POST /api/datasets/:id/eda to verify auto-visualizations...");
    const edaRes = await fetch(`${BASE_URL}/datasets/${datasetId}/eda`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (edaRes.status === 200) {
      const edaBody = await edaRes.json();
      console.log(`✅ Step 2 PASSED: EDA charts generated. Total: ${edaBody.charts?.length || 0}`);
    } else {
      const errText = await edaRes.text();
      console.error(`❌ Step 2 FAILED: Status ${edaRes.status}. Error: ${errText}`);
    }

    // 4. Statistics Report
    console.log("\n📊 Step 3: Query POST /api/datasets/:id/statistics to verify stats report...");
    const statsRes = await fetch(`${BASE_URL}/datasets/${datasetId}/statistics`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (statsRes.status === 200) {
      const statsBody = await statsRes.json();
      console.log(`✅ Step 3 PASSED: Stats and correlations generated successfully.`);
    } else {
      const errText = await statsRes.text();
      console.error(`❌ Step 3 FAILED: Status ${statsRes.status}. Error: ${errText}`);
    }

    // 5. Data Cleaning Pipeline
    console.log("\n🧹 Step 4: Query POST /api/datasets/:id/clean to clean dataset...");
    const cleanRes = await fetch(`${BASE_URL}/datasets/${datasetId}/clean`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (cleanRes.status === 201) {
      const cleanBody = await cleanRes.json();
      console.log(`✅ Step 4 PASSED: Cleaned dataset saved. New dataset ID: ${cleanBody.cleanedDataset.id}`);
      // Cleanup the generated cleaned dataset
      await pool.query("DELETE FROM datasets WHERE id = $1", [cleanBody.cleanedDataset.id]);
    } else {
      const errText = await cleanRes.text();
      console.error(`❌ Step 4 FAILED: Status ${cleanRes.status}. Error: ${errText}`);
    }

    // 6. ML Model Training
    console.log("\n🤖 Step 5: Query POST /api/datasets/:id/ml/train to fit model...");
    const mlRes = await fetch(`${BASE_URL}/datasets/${datasetId}/ml/train`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        task_type: "regression",
        target: "target",
        features: ["category"],
        test_size: 0.2,
        cv_folds: 2
      })
    });
    if (mlRes.status === 200 || mlRes.status === 201) {
      const mlBody = await mlRes.json();
      console.log(`✅ Step 5 PASSED: ML Model trained successfully. Algorithm: ${mlBody.algorithm}`);
    } else {
      const errText = await mlRes.text();
      console.error(`❌ Step 5 FAILED: Status ${mlRes.status}. Error: ${errText}`);
    }

    // 7. Time-Series Forecasting
    console.log("\n📈 Step 6: Query POST /api/datasets/:id/forecast/train to verify forecasting...");
    const forecastRes = await fetch(`${BASE_URL}/datasets/${datasetId}/forecast/train`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date_column: "date",
        target_column: "target",
        frequency: "D",
        horizon: 2
      })
    });
    if (forecastRes.status === 200 || forecastRes.status === 201) {
      const forecastBody = await forecastRes.json();
      console.log(`✅ Step 6 PASSED: Forecasting completed successfully. Algorithm: ${forecastBody.algorithm}`);
    } else {
      const errText = await forecastRes.text();
      console.error(`❌ Step 6 FAILED: Status ${forecastRes.status}. Error: ${errText}`);
    }

  } catch (err) {
    console.error("❌ Integration test suite error:", err);
  } finally {
    // Cleanup test data
    if (datasetId) {
      await pool.query("DELETE FROM datasets WHERE id = $1", [datasetId]);
    }
    if (userId) {
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    }
    if (companyId) {
      await pool.query("UPDATE companies SET deleted_at = now() WHERE id = $1", [companyId]);
    }
    console.log("\n🧹 Cleaned up seeded integration database records.");
    await pool.end();
    console.log("\n🏁 Integration Tests completed.");
  }
}

runIntegrationTests();
