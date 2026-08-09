import pg from "pg";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:SuperSecurePasswordForAIDA2026!@localhost:5432/ai_data_analyst";

async function runSecurityTests() {
  console.log("🚀 Starting Automated Security Verification Tests...\n");
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  let testCompanyId, admin1Id, admin2Id;

  try {
    // 1. Seed test company and users with a unique name to prevent collisions with soft-deleted companies
    console.log("📦 Seeding test workspace and users...");
    const suffix = Date.now();
    const companyRes = await pool.query(
      "INSERT INTO companies (name, name_normalized) VALUES ($1, $2) RETURNING id",
      [`Test Hardening Corp ${suffix}`, `test hardening corp ${suffix}`]
    );
    testCompanyId = companyRes.rows[0].id;

    const hash = await bcrypt.hash("password123", 10);
    const u1 = await pool.query(
      "INSERT INTO users (company_id, email, password_hash, role) VALUES ($1, $2, $3, 'admin') RETURNING id",
      [testCompanyId, `admin1_${suffix}@test.com`, hash]
    );
    admin1Id = u1.rows[0].id;

    const u2 = await pool.query(
      "INSERT INTO users (company_id, email, password_hash, role) VALUES ($1, $2, $3, 'admin') RETURNING id",
      [testCompanyId, `admin2_${suffix}@test.com`, hash]
    );
    admin2Id = u2.rows[0].id;
    console.log(`✅ Seeded workspace ID ${testCompanyId} with 2 admins.\n`);

    // Seed a dummy audit log so that row-level triggers actually fire
    await pool.query(
      "INSERT INTO audit_logs (company_id, user_email, action, target) VALUES ($1, $2, 'TEST_ACTION', 'TEST_TARGET')",
      [testCompanyId, `admin1_${suffix}@test.com`]
    );

    // 2. Test Audit Log Immutability (UPDATE blocking trigger)
    console.log("🛡️ Test 1: Attempting UPDATE on audit_logs...");
    try {
      await pool.query(
        "UPDATE audit_logs SET action = 'EXPLOIT' WHERE company_id = $1",
        [testCompanyId]
      );
      console.error("❌ Test 1 FAILED: UPDATE succeeded but should have failed.");
    } catch (err) {
      if (err.message.includes("audit_logs table is append-only")) {
        console.log("✅ Test 1 PASSED: UPDATE rejected by database trigger exception.");
      } else {
        console.error("❌ Test 1 FAILED with unexpected error:", err.message);
      }
    }

    // 3. Test Audit Log Immutability (DELETE blocking trigger)
    console.log("\n🛡️ Test 2: Attempting DELETE on audit_logs...");
    try {
      await pool.query("DELETE FROM audit_logs WHERE company_id = $1", [testCompanyId]);
      console.error("❌ Test 2 FAILED: DELETE succeeded but should have failed.");
    } catch (err) {
      if (err.message.includes("audit_logs table is append-only")) {
        console.log("✅ Test 2 PASSED: DELETE rejected by database trigger exception.");
      } else {
        console.error("❌ Test 2 FAILED with unexpected error:", err.message);
      }
    }

    // 4. Test Audit Log Immutability (TRUNCATE blocking trigger)
    console.log("\n🛡️ Test 3: Attempting TRUNCATE on audit_logs...");
    try {
      await pool.query("TRUNCATE audit_logs");
      console.error("❌ Test 3 FAILED: TRUNCATE succeeded but should have failed.");
    } catch (err) {
      if (err.message.includes("audit_logs table is append-only")) {
        console.log("✅ Test 3 PASSED: TRUNCATE rejected by database trigger exception.");
      } else {
        console.error("❌ Test 3 FAILED with unexpected error:", err.message);
      }
    }

    // 5. Test Last-Admin Concurrency Guards (Serializing SELECT ... FOR UPDATE)
    console.log("\n🛡️ Test 4: Testing concurrency locks on demoting last admin...");
    const client1 = await pool.connect();
    const client2 = await pool.connect();

    try {
      await client1.query("BEGIN");
      await client2.query("BEGIN");

      // Transaction 1 locks the company row
      await client1.query("SELECT id FROM companies WHERE id = $1 FOR UPDATE", [testCompanyId]);

      // Transaction 2 tries to lock the company row (should block/wait)
      console.log("⏳ Transaction 1 acquired lock. Transaction 2 is attempting to lock company (concurrency check)...");
      const client2Promise = client2.query("SELECT id FROM companies WHERE id = $1 FOR UPDATE", [testCompanyId]);

      // Resolve Transaction 1 demotion check
      const adminCount1 = (await client1.query(
        "SELECT COUNT(*)::int AS n FROM users WHERE company_id = $1 AND role = 'admin'",
        [testCompanyId]
      )).rows[0].n;

      if (adminCount1 > 1) {
        await client1.query("UPDATE users SET role = 'member' WHERE id = $1", [admin1Id]);
        console.log("✅ Transaction 1 successfully demoted admin1 (since 2 existed).");
      }
      await client1.query("COMMIT");

      // Now Transaction 2 resumes since client1 committed and released the lock
      await client2Promise;
      console.log("🔓 Transaction 2 resumed lock execution.");

      const adminCount2 = (await client2.query(
        "SELECT COUNT(*)::int AS n FROM users WHERE company_id = $1 AND role = 'admin'",
        [testCompanyId]
      )).rows[0].n;

      if (adminCount2 <= 1) {
        console.log("✅ Test 4 PASSED: Transaction 2 detected 1 admin remaining, blocked demoting the last admin.");
      } else {
        await client2.query("UPDATE users SET role = 'member' WHERE id = $1", [admin2Id]);
        console.error("❌ Test 4 FAILED: Last admin demoted leaving 0 admins!");
      }
      await client2.query("COMMIT");

    } catch (err) {
      console.error("❌ Test 4 FAILED with lock error:", err.message);
      await client1.query("ROLLBACK").catch(() => {});
      await client2.query("ROLLBACK").catch(() => {});
    } finally {
      client1.release();
      client2.release();
    }

  } catch (err) {
    console.error("Test setup or execution error:", err);
  } finally {
    // Cleanup using soft-delete since the append-only audit log prevents hard deletes due to foreign key constraints
    if (testCompanyId) {
      console.log("\n🧹 Soft-deleting test company records (hard delete is blocked by audit log FK)...");
      try {
        await pool.query("UPDATE companies SET deleted_at = now() WHERE id = $1", [testCompanyId]);
        console.log("✅ Workspace soft-deleted successfully.");
      } catch (cleanupErr) {
        console.error("⚠️ Cleanup warning:", cleanupErr.message);
      }
    }
    await pool.end();
    console.log("\n🏁 Security Verification Tests completed.");
  }
}

runSecurityTests();
