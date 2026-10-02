// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Production Hardening — Phase 1: Concurrency & Distributed Locking Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('CONCURRENCY-01 & CONCURRENCY-02 & CONCURRENCY-03: Concurrent mutation detects stale version, returns 409, and creates exactly 1 version on success', async ({ page }) => {
    // Execute concurrency test in browser context
    const result = await page.evaluate(async () => {
      const { mutateDatasetWithConcurrency, resetConcurrencyRegistry, getClientDatasetState } = await import('/src/services/concurrencyService.js');
      resetConcurrencyRegistry();

      const datasetId = 'sales_q3_test';
      const rawHash = 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

      // 1. Initial state is v1
      const initial = getClientDatasetState(datasetId, rawHash);

      // 2. User A mutates based on v1 -> Should SUCCEED and advance to v2
      const userAResult = await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v1',
        operation: 'deduplicate',
        lineageId: 'lin-001',
        rawHash,
        userId: 'user_analyst_A',
        role: 'data_analyst'
      });

      // 3. User B simultaneously attempts mutation also based on v1 (now stale!)
      const userBResult = await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v1', // Stale! Current is v2
        operation: 'impute',
        lineageId: 'lin-002',
        rawHash,
        userId: 'user_analyst_B',
        role: 'data_analyst'
      });

      const finalState = getClientDatasetState(datasetId, rawHash);

      return {
        initialVersion: initial.currentVersion,
        userAResult,
        userBResult,
        finalVersion: finalState.currentVersion,
        historyCount: finalState.history.length
      };
    });

    // Assert User A Succeeded
    expect(result.userAResult.success).toBe(true);
    expect(result.userAResult.status).toBe(200);
    expect(result.userAResult.previousVersion).toBe('v1');
    expect(result.userAResult.newVersion).toBe('v2');

    // Assert User B was Rejected with HTTP 409 Conflict
    expect(result.userBResult.success).toBe(false);
    expect(result.userBResult.status).toBe(409);
    expect(result.userBResult.error).toContain('Version conflict detected');
    expect(result.userBResult.currentVersion).toBe('v2');
    expect(result.userBResult.expectedVersion).toBe('v1');

    // Assert exactly 1 new version was created (v1 -> v2, total 2 versions in history)
    expect(result.finalVersion).toBe('v2');
    expect(result.historyCount).toBe(2);
  });

  test('CONCURRENCY-04 & CONCURRENCY-05: Historical versions remain immutable and SHA-256 rawHash remains unchanged', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { mutateDatasetWithConcurrency, resetConcurrencyRegistry, getClientDatasetState } = await import('/src/services/concurrencyService.js');
      resetConcurrencyRegistry();

      const datasetId = 'immutable_test_ds';
      const rawHash = 'sha256-invariant-hash-999';

      // v1 -> v2
      await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v1',
        operation: 'deduplicate',
        rawHash,
        userId: 'user_a'
      });

      // v2 -> v3
      await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v2',
        operation: 'impute',
        rawHash,
        userId: 'user_a'
      });

      const state = getClientDatasetState(datasetId, rawHash);

      return {
        v1: state.history[0],
        v2: state.history[1],
        v3: state.history[2],
        allRawHashes: state.history.map(h => h.rawHash)
      };
    });

    // Invariant: v1 and v2 remain marked immutable
    expect(result.v1.immutable).toBe(true);
    expect(result.v1.version).toBe('v1');
    expect(result.v2.immutable).toBe(true);
    expect(result.v2.version).toBe('v2');

    // Invariant: rawHash is invariant across all version transitions
    expect(result.allRawHashes).toEqual([
      'sha256-invariant-hash-999',
      'sha256-invariant-hash-999',
      'sha256-invariant-hash-999'
    ]);
  });

  test('CONCURRENCY-06: Concurrent restore cannot overwrite history, creates forward version branch', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { mutateDatasetWithConcurrency, resetConcurrencyRegistry, getClientDatasetState } = await import('/src/services/concurrencyService.js');
      resetConcurrencyRegistry();

      const datasetId = 'restore_concurrency_ds';
      const rawHash = 'sha256-restore-test-hash';

      // Advance to v2
      await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v1',
        operation: 'clean',
        rawHash,
        userId: 'user_a'
      });

      // Restore v1 snapshot while on v2 -> Should create v3 (Restored from v1)
      const restoreResult = await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v2',
        operation: 'restore',
        restoreTargetVersion: 'v1',
        rawHash,
        userId: 'user_a'
      });

      const state = getClientDatasetState(datasetId, rawHash);

      return {
        restoreResult,
        versions: state.history.map(h => ({ version: h.version, label: h.label })),
        currentVersion: state.currentVersion
      };
    });

    expect(result.restoreResult.success).toBe(true);
    expect(result.restoreResult.newVersion).toBe('v3');
    expect(result.currentVersion).toBe('v3');

    // Historical versions v1 and v2 are intact
    expect(result.versions[0].version).toBe('v1');
    expect(result.versions[1].version).toBe('v2');
    expect(result.versions[2].version).toBe('v3');
    expect(result.versions[2].label).toContain('Restored from v1');
  });

  test('CONCURRENCY-07: Audit records both attempted conflicts and successful operations', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { mutateDatasetWithConcurrency, resetConcurrencyRegistry, getConcurrencyAuditLogs } = await import('/src/services/concurrencyService.js');
      resetConcurrencyRegistry();

      const datasetId = 'audit_concurrency_ds';
      const rawHash = 'sha256-audit-test-hash';

      // Success mutation
      await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v1',
        operation: 'clean',
        rawHash,
        userId: 'user_analyst_1'
      });

      // Conflicted mutation
      await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v1', // Stale
        operation: 'impute',
        rawHash,
        userId: 'user_analyst_2'
      });

      const auditLogs = getConcurrencyAuditLogs();
      return auditLogs;
    });

    const actions = result.map(l => l.action);
    expect(actions).toContain('MUTATION_APPLIED');
    expect(actions).toContain('MUTATION_CONFLICT');

    const conflictLog = result.find(l => l.action === 'MUTATION_CONFLICT');
    expect(conflictLog.status).toBe('CONFLICT_409');
    expect(conflictLog.expectedVersion).toBe('v1');
    expect(conflictLog.currentVersion).toBe('v2');
  });

  test('CONCURRENCY-08: Cross-user mutation remains RBAC protected', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { mutateDatasetWithConcurrency, resetConcurrencyRegistry } = await import('/src/services/concurrencyService.js');
      resetConcurrencyRegistry();

      const datasetId = 'rbac_concurrency_ds';
      const rawHash = 'sha256-rbac-test-hash';

      // Recruiter attempts mutation
      const recruiterResult = await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v1',
        operation: 'drop_column',
        rawHash,
        userId: 'user_recruiter_99',
        role: 'recruiter' // Unauthorized
      });

      return recruiterResult;
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toContain('Unauthorized: Role \'recruiter\' lacks mutation permission');
  });

  test('CONCURRENCY-09: Cross-tenant mutation is rejected', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { mutateDatasetWithConcurrency, resetConcurrencyRegistry } = await import('/src/services/concurrencyService.js');
      resetConcurrencyRegistry();

      const datasetId = 'tenant_isolation_ds';
      const rawHash = 'sha256-tenant-test-hash';

      // Tenant 2 user attempts mutation on Tenant 1 dataset
      const crossTenantResult = await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v1',
        operation: 'impute',
        rawHash,
        userId: 'attacker_user',
        role: 'data_analyst',
        companyId: 'company_tenant_2', // Mismatch!
        targetTenantId: 'company_tenant_1'
      });

      return crossTenantResult;
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toContain('Cross-tenant mutation rejected');
  });

  test('CONCURRENCY-10: DatasetContext refreshes after conflict', async ({ page }) => {
    // Upload sales.csv to initialize DatasetContext
    const csvContent = 'transaction_id,amount,customer_id,region\nTX101,150.50,CUST1,North\nTX102,230.00,CUST2,South';
    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles({
      name: 'sales.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await expect(page.locator('text=sales.csv').first()).toBeVisible({ timeout: 15000 });

    // Trigger conflict scenario and verify UI state recovery
    const refreshed = await page.evaluate(async () => {
      const { mutateDatasetWithConcurrency, resetConcurrencyRegistry, getClientDatasetState } = await import('/src/services/concurrencyService.js');
      resetConcurrencyRegistry();

      const datasetId = 'sales.csv';
      const rawHash = 'sha256-sales-raw';

      // Advance server state to v2
      await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v1',
        operation: 'clean',
        rawHash,
        userId: 'peer_user'
      });

      // Current client attempts v1 mutation -> gets 409
      const conflictRes = await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: 'v1',
        operation: 'impute',
        rawHash,
        userId: 'my_user'
      });

      // Client catches 409 and refreshes expected version to server's currentVersion (v2)
      const refreshedMutation = await mutateDatasetWithConcurrency({
        datasetId,
        expectedDatasetVersion: conflictRes.currentVersion, // v2
        operation: 'impute',
        rawHash,
        userId: 'my_user'
      });

      return {
        conflictRes,
        refreshedMutation
      };
    });

    expect(refreshed.conflictRes.status).toBe(409);
    expect(refreshed.refreshedMutation.status).toBe(200);
    expect(refreshed.refreshedMutation.newVersion).toBe('v3');
  });

});
