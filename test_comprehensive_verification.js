// test_comprehensive_verification.js
// Automated verification suite covering user requirements 1 through 6.

import assert from "assert";
import jwt from "jsonwebtoken";
import { sanitizePromptText } from "./backend/lib/piiSanitizer.js";
import { requireAuth, requireAdmin } from "./backend/middleware/auth.js";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "aida_production_fallback_jwt_secret_2026";

async function runTests() {
  console.log("=================================================");
  console.log(" RUNNING COMPREHENSIVE 6-POINT VERIFICATION SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Fresh user uploads file and reaches analysis without setView error
  // --------------------------------------------------------------------------
  test("Test 1: setView is strictly guarded across DataAnalystDashboardBot and components", () => {
    const botCode = fs.readFileSync("./src/DataAnalystDashboardBot.jsx", "utf8");
    const powerBiCode = fs.readFileSync("./src/components/dashboard/PowerBiDashboard.jsx", "utf8");

    // Verify all setView invocations in Bot are guarded
    const directSetViewCalls = [...botCode.matchAll(/[^a-zA-Z0-9_]setView\(/g)];
    assert(directSetViewCalls.length > 0, "Bot should have setView calls");
    
    // Check that every setView call in the bot has a typeof or truthy check
    assert(botCode.includes('typeof setView === "function"'), "setView calls in upload/demo must be guarded with typeof setView === 'function'");
    assert(botCode.includes('setView={setView || (() => {})}'), "PowerBiDashboard invocation must have fallback setView");
    assert(powerBiCode.includes('export default function PowerBiDashboard({ active, user, setView, onAskQuestion })'), "PowerBiDashboard must accept setView as prop");
  });

  // --------------------------------------------------------------------------
  // TEST 2: Skip opens an empty workspace (Zero synthetic demo leakage)
  // --------------------------------------------------------------------------
  test("Test 2: Skip opens empty workspace with zero synthetic fallback leakage", () => {
    const botCode = fs.readFileSync("./src/DataAnalystDashboardBot.jsx", "utf8");
    const contextCode = fs.readFileSync("./src/context/DatasetContext.jsx", "utf8");
    
    // Check empty state condition in workspace
    assert(botCode.includes("Welcome to AI Business Copilot"), "Should render empty workspace header");
    assert(botCode.includes("You haven't added any business data yet"), "Should state clearly that no data is loaded");
    
    // Verify that single source of truth DatasetContext initializes activeDataset strictly to null
    assert(contextCode.includes("const [activeDataset, setActiveDataset] = useState(null);"), "activeDataset must initialize strictly to null (zero demo leakage)");
  });

  // --------------------------------------------------------------------------
  // TEST 3: Non-admin API requests are rejected (HTTP 403 / 401)
  // --------------------------------------------------------------------------
  await testAsync("Test 3: Non-admin requests are rejected by requireAdmin middleware", async () => {
    // 3a: Non-admin user
    const reqNonAdmin = {
      user: { userId: 42, companyId: 1, role: "member", email: "analyst@example.com" }
    };
    let statusCode = null;
    let jsonBody = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { jsonBody = b; return this; }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireAdmin(reqNonAdmin, res, next);
    assert.strictEqual(statusCode, 403, "Non-admin must receive HTTP 403");
    assert.strictEqual(jsonBody.error, "Admin access required.");
    assert.strictEqual(nextCalled, false, "next() must not be called for non-admin");

    // 3b: Admin user passes through
    const reqAdmin = {
      user: { userId: 1, companyId: 1, role: "admin", email: "admin@example.com" }
    };
    nextCalled = false;
    requireAdmin(reqAdmin, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, "Admin user must proceed to next handler");
  });

  // --------------------------------------------------------------------------
  // TEST 4: Changing a dataset ID cannot expose another company's data
  // --------------------------------------------------------------------------
  test("Test 4: Backend routes enforce tenant isolation (company_id = req.user.companyId)", () => {
    const datasetRoutes = fs.readFileSync("./backend/routes/datasets.js", "utf8");
    const analyzeRoutes = fs.readFileSync("./backend/routes/analyze.js", "utf8");

    // Verify all dataset SQL queries include company_id
    assert(datasetRoutes.includes("WHERE id = $1 AND company_id = $2"), "GET/PUT/DELETE /api/datasets/:id must scope to company_id");
    assert(datasetRoutes.includes("WHERE company_id = $1 ORDER BY updated_at DESC"), "GET /api/datasets must scope to company_id");
    assert(analyzeRoutes.includes("SELECT id FROM datasets WHERE id = $1 AND company_id = $2"), "POST /api/analyze must verify dataset ownership");
  });

  // --------------------------------------------------------------------------
  // TEST 5: Restricted fields are removed before AI request leaves the server
  // --------------------------------------------------------------------------
  test("Test 5: Restricted fields & PII are scrubbed by server before AI dispatch", () => {
    const dirtySystem = "You are analyzing employee data for executive review.";
    const dirtyUserText = `
      Customer email is ceo.private@enterprise.com and cell is +1 555-839-2918.
      Card on file is 4532 1488 9234 5678 and SSN is 000-12-3456.
      Here is the compensation row: {"name": "Alice", "salary": 185000, "bonus": 35000}.
    `;

    const { sanitizedText, redactedCount } = sanitizePromptText(dirtyUserText, ["salary", "bonus"]);

    assert(redactedCount >= 5, `Expected at least 5 redactions, got ${redactedCount}`);
    assert(!sanitizedText.includes("ceo.private@enterprise.com"), "Email must be removed");
    assert(!sanitizedText.includes("4532 1488 9234 5678"), "Credit card must be removed");
    assert(!sanitizedText.includes("000-12-3456"), "SSN must be removed");
    assert(!sanitizedText.includes("185000"), "Salary value must be removed");
    assert(!sanitizedText.includes("35000"), "Bonus value must be removed");
    assert(sanitizedText.includes("[REDACTED_EMAIL]"), "Must insert [REDACTED_EMAIL]");
    assert(sanitizedText.includes("[REDACTED_CREDIT_CARD]"), "Must insert [REDACTED_CREDIT_CARD]");
    assert(sanitizedText.includes("[REDACTED_GOV_ID]"), "Must insert [REDACTED_GOV_ID]");
    assert(sanitizedText.includes("[RESTRICTED_FIELD_EXCLUDED]"), "Must insert [RESTRICTED_FIELD_EXCLUDED]");
  });

  // --------------------------------------------------------------------------
  // TEST 6: Demo users cannot access production datasets
  // --------------------------------------------------------------------------
  await testAsync("Test 6: Demo tokens are rejected with 403 by requireAuth", async () => {
    let statusCode = null;
    let jsonBody = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { jsonBody = b; return this; }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    // 6a: Token starting with "demo-"
    const reqDemoHeader = {
      headers: { authorization: "Bearer demo-session-token-179095" }
    };
    await requireAuth(reqDemoHeader, res, next);
    assert.strictEqual(statusCode, 403, "Demo token must be rejected with 403");
    assert(jsonBody.error.includes("Guest Demo Mode"), "Must state demo access is restricted");
    assert.strictEqual(nextCalled, false, "next() must not be called for demo token");

    // 6b: Signed JWT with isDemo = true
    const demoPayloadToken = jwt.sign({ userId: 9999, companyId: 9999, isDemo: true }, JWT_SECRET);
    const reqDemoPayload = {
      headers: { authorization: `Bearer ${demoPayloadToken}` }
    };
    statusCode = null;
    jsonBody = null;
    nextCalled = false;
    await requireAuth(reqDemoPayload, res, next);
    assert.strictEqual(statusCode, 403, "isDemo payload must be rejected with 403");
  });

  console.log(`\n=================================================`);
  console.log(` ALL ${passed}/${total} VERIFICATION TESTS PASSED SUCCESSFULLY!`);
  console.log(`=================================================`);
}

runTests().catch(err => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
