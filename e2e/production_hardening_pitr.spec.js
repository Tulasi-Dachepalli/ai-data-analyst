// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Production Hardening — Tracks 3, 4, 5: Integrity, PITR, APM & Security', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('PITR-01: Transactional rollback on simulated pipeline failure guarantees zero orphaned versions', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { mutateTransactional, verifyDatasetIntegrity, getDatasetLedger } = await import('/src/services/integrityService.js');
      const datasetId = 'dataset_tx_rollback_test';
      const rawHash = 'sha256-tx-verify-999888';

      // 1. Initial successful commit: v1 -> v2
      const step1 = await mutateTransactional(datasetId, {
        expectedDatasetVersion: 'v1',
        operation: 'clean',
        rawHash,
        userId: 'lead_analyst',
        role: 'data_analyst'
      });

      // 2. Multi-phase mutation that encounters a failure: should rollback atomically
      const step2Failed = await mutateTransactional(datasetId, {
        expectedDatasetVersion: 'v2',
        operation: 'matrix_inversion',
        rawHash,
        userId: 'lead_analyst',
        role: 'data_analyst',
        simulateFailure: true,
        failurePhase: 'matrix_calculation'
      });

      // 3. Verify integrity and ledger state
      const audit = await verifyDatasetIntegrity(datasetId);
      const ledger = await getDatasetLedger(datasetId);

      return {
        step1,
        step2Failed,
        audit,
        ledger
      };
    });

    // Verify step 1 committed
    expect(result.step1.success).toBe(true);
    expect(result.step1.newVersion).toBe('v2');

    // Verify step 2 rolled back cleanly
    expect(result.step2Failed.success).toBe(false);
    expect(result.step2Failed.rolledBack).toBe(true);
    expect(result.step2Failed.currentVersion).toBe('v2');
    expect(result.step2Failed.historyCount).toBe(2);

    // Verify cryptographic audit proves 0 orphaned records
    expect(result.audit.isValid).toBe(true);
    expect(result.audit.orphanedRecords).toBe(0);
    expect(result.audit.checks.sequenceContinuity).toBe(true);
    expect(result.audit.checks.rawHashImmutability).toBe(true);
  });

  test('PITR-02: Point-in-time recovery reconstructs state without modifying historical version nodes', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { mutateTransactional, restorePointInTime, verifyDatasetIntegrity } = await import('/src/services/integrityService.js');
      const datasetId = 'dataset_pitr_timeline_test';
      const rawHash = 'sha256-canonical-pitr-111222';

      // Advance: v1 -> v2
      const step1 = await mutateTransactional(datasetId, {
        expectedDatasetVersion: 'v1',
        operation: 'impute',
        rawHash,
        userId: 'analyst_1'
      });

      // Advance: v2 -> v3
      const step2 = await mutateTransactional(datasetId, {
        expectedDatasetVersion: 'v2',
        operation: 'encode_categoricals',
        rawHash,
        userId: 'analyst_1'
      });

      // Point-in-Time Recovery back to initial state (timestamp in the past)
      const pitrResult = await restorePointInTime(datasetId, '2020-01-01T00:00:00Z', {
        userId: 'lead_analyst',
        role: 'data_analyst'
      });

      const audit = await verifyDatasetIntegrity(datasetId);

      return {
        step1,
        step2,
        pitrResult,
        audit
      };
    });

    expect(result.step1.newVersion).toBe('v2');
    expect(result.step2.newVersion).toBe('v3');

    // PITR creates forward version v4, preserving all history and rawHash
    expect(result.pitrResult.success).toBe(true);
    expect(result.pitrResult.newVersion).toBe('v4');
    expect(result.pitrResult.rawHash).toBe('sha256-canonical-pitr-111222');
    expect(result.pitrResult.historyCount).toBe(4);

    // Deep DAG verification passes with zero orphaned records
    expect(result.audit.isValid).toBe(true);
    expect(result.audit.orphanedRecords).toBe(0);
    expect(result.audit.totalVersions).toBe(4);
  });

  test('PITR-03: Version mismatch during transactional mutation triggers HTTP 409 conflict', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { mutateTransactional } = await import('/src/services/integrityService.js');
      const datasetId = 'dataset_tx_conflict_test';
      const rawHash = 'sha256-tx-conflict-333444';

      // First user advances v1 -> v2
      await mutateTransactional(datasetId, {
        expectedDatasetVersion: 'v1',
        operation: 'outlier_removal',
        rawHash,
        userId: 'user_a'
      });

      // Second user attempts mutation with stale v1
      const conflictRes = await mutateTransactional(datasetId, {
        expectedDatasetVersion: 'v1', // Stale!
        operation: 'scale_features',
        rawHash,
        userId: 'user_b'
      });

      return conflictRes;
    });

    expect(result.success).toBe(false);
    expect(result.conflict).toBe(true);
    expect(result.currentVersion).toBe('v2');
    expect(result.expectedVersion).toBe('v1');
  });

  test('OBS-01: APM latency percentiles and system health monitoring', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { getAPMMetrics, getObservabilityHealth } = await import('/src/services/observabilityService.js');
      const metrics = await getAPMMetrics();
      const health = await getObservabilityHealth();
      return { metrics, health };
    });

    expect(result.health.status).toBe('ok');
    expect(result.health.memory_safe).toBe(true);
    expect(result.metrics.status).toBe('healthy');
    expect(result.metrics.latency_percentiles_ms).toBeDefined();
    expect(typeof result.metrics.latency_percentiles_ms.p50).toBe('number');
    expect(typeof result.metrics.latency_percentiles_ms.p95).toBe('number');
  });

  test('OBS-02: Structured ECS SIEM audit log ingestion and multi-tenant isolation export', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { reportClientTelemetry, getSIEMEvents } = await import('/src/services/observabilityService.js');

      // Report client audit event
      const ingestRes = await reportClientTelemetry({
        category: 'security',
        action: 'CLIENT_RBAC_VERIFIED',
        outcome: 'success',
        severity: 10,
        userId: 'user_e2e',
        tenantId: 'tenant_acme',
        datasetId: 'dataset_100',
        details: { browser: 'playwright-headless' }
      });

      // Fetch SIEM events filtered by tenant
      const siemEvents = await getSIEMEvents({ tenantId: 'tenant_acme' });

      return { ingestRes, siemEvents };
    });

    expect(result.ingestRes.success).toBe(true);
    expect(result.siemEvents.schema).toContain('Elastic Common Schema');
    expect(result.siemEvents.events.length).toBeGreaterThan(0);
    expect(result.siemEvents.events[0].organization.id).toBe('tenant_acme');
  });

  test('SEC-01: Cross-tenant barrier blocks cross-organization mutation attempts', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { mutateTransactional } = await import('/src/services/integrityService.js');
      const crossTenantAttempt = await mutateTransactional('dataset_tenant_isolation_test', {
        expectedDatasetVersion: 'v1',
        operation: 'unauthorized_export',
        rawHash: 'sha256-cross-tenant-hash',
        userId: 'tenant_b_intruder',
        role: 'data_analyst',
        targetTenantId: 'tenant_foreign_victim'
      });
      return crossTenantAttempt;
    });

    expect(result.success).toBe(false);
    expect(result.forbidden).toBe(true);
    expect(result.error).toContain('Cross-tenant mutation rejected');
  });

});
