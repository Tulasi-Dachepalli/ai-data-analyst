// e2e/lineage.spec.js
import { test, expect } from '@playwright/test';
import { createInitialVersionStack, applyTransactionalOperation, computeDatasetHash, compareVersions } from '../src/utils/dataLineage.js';

test.describe('Transactional Data Lineage & Immutability Verification', () => {

  test('TEST-06: Raw Data Integrity & Immutability Checksum', () => {
    const rawData = [
      { id: 1, revenue: 45000, region: "North", date: "2026-09-01" },
      { id: 2, revenue: 32000, region: "South", date: "2026-09-02" },
      { id: 3, revenue: null, region: "East", date: "2026-09-03" },
      { id: 4, revenue: 45000, region: "North", date: "2026-09-01" } // Duplicate row
    ];
    const columns = ["id", "revenue", "region", "date"];

    // 1. Initialize Version Stack
    const stack = createInitialVersionStack("Audit_Ops", rawData, columns);
    const initialHash = stack.rawVersion.hash;

    expect(stack.rawVersion.version).toBe("v1");
    expect(stack.rawVersion.immutable).toBe(true);
    expect(stack.rawVersion.rowCount).toBe(4);

    // 2. Perform Transactional Deduplication
    const cleanRows = rawData.slice(0, 3); // Removed 1 duplicate
    const updatedStack = applyTransactionalOperation(stack, {
      operationType: "dedupe",
      columns,
      reason: "1 duplicate row detected",
      method: "Removed exact duplicate row",
      newRows: cleanRows,
      newCols: columns,
      affectedRowsCount: 1
    });

    // 3. Verify Version Stack Updated
    expect(updatedStack.currentVersion.version).toBe("v2");
    expect(updatedStack.currentVersion.rowCount).toBe(3);
    expect(updatedStack.history.length).toBe(2);

    // 4. CRITICAL: Verify Raw Data v1 Hash Remains 100% Unchanged (Immutable)
    const currentRawHash = computeDatasetHash(updatedStack.rawVersion.rows);
    expect(currentRawHash).toBe(initialHash);

    // 5. Verify Version Diff
    const diff = compareVersions(updatedStack.rawVersion, updatedStack.currentVersion);
    expect(diff.rowDiff).toBe(-1);
    expect(diff.isRawImmutable).toBe(true);
    expect(diff.transformationsApplied).toBe(1);
  });

});
