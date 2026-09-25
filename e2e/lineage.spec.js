// e2e/lineage.spec.js
import { test, expect } from '@playwright/test';
import { createInitialVersionStack, applyTransactionalOperation, computeCanonicalHash, restoreVersion, compareVersions } from '../src/utils/dataLineage.js';

test.describe('Transactional Data Lineage, Canonical Hashing & Non-Destructive Restore Suite', () => {

  test('TEST-06: Raw Data Integrity & Canonical Checksum Hash', () => {
    const rawData = [
      { id: 1, revenue: 45000, region: "North", date: "2026-09-01" },
      { id: 2, revenue: 32000, region: "South", date: "2026-09-02" },
      { id: 3, revenue: null, region: "East", date: "2026-09-03" },
      { id: 4, revenue: 45000, region: "North", date: "2026-09-01" }
    ];
    const columns = ["id", "revenue", "region", "date"];

    // 1. Initialize Version Stack
    const stack = createInitialVersionStack("Audit_Ops", rawData, columns);
    const initialHash = stack.rawVersion.hash;

    expect(stack.rawVersion.version).toBe("v1");
    expect(stack.rawVersion.immutable).toBe(true);
    expect(stack.rawVersion.rowCount).toBe(4);
    expect(initialHash).toContain("sha256-");

    // 2. Perform Transactional Deduplication
    const cleanRows = rawData.slice(0, 3);
    const updatedStack = applyTransactionalOperation(stack, {
      operationType: "dedupe",
      columns,
      reason: "1 duplicate row detected",
      method: "Removed exact duplicate row",
      newRows: cleanRows,
      newCols: columns,
      affectedRowsCount: 1,
      status: "applied"
    });

    expect(updatedStack.currentVersion.version).toBe("v2");
    expect(updatedStack.currentVersion.rowCount).toBe(3);

    // 3. Verify Raw Data v1 Canonical Hash Remains 100% Unchanged (Immutable)
    const currentRawHash = computeCanonicalHash(updatedStack.rawVersion.rows, columns);
    expect(currentRawHash).toBe(initialHash);
  });

  test('TEST-07: Non-Destructive Restore Creates Auditable New Snapshot', () => {
    const rawData = [
      { id: 1, val: 100 },
      { id: 2, val: 200 },
      { id: 3, val: 300 }
    ];
    const cols = ["id", "val"];

    // v1
    let stack = createInitialVersionStack("Audit_Ops", rawData, cols);

    // v2: apply transformation
    stack = applyTransactionalOperation(stack, {
      operationType: "impute_missing",
      columns: cols,
      reason: "Filter test",
      method: "Filtered row 3",
      newRows: rawData.slice(0, 2),
      newCols: cols,
      affectedRowsCount: 1
    });

    expect(stack.currentVersion.version).toBe("v2");
    expect(stack.currentVersion.rowCount).toBe(2);

    // Non-destructive restore from v1 -> creates v3 (restored from v1)
    const restoredStack = restoreVersion(stack, "v1");

    expect(restoredStack.currentVersion.version).toBe("v3");
    expect(restoredStack.currentVersion.label).toBe("Restored from v1");
    expect(restoredStack.currentVersion.rowCount).toBe(3);
    expect(restoredStack.history.length).toBe(3);
    expect(restoredStack.history[0].version).toBe("v1");
    expect(restoredStack.history[1].version).toBe("v2");
    expect(restoredStack.history[2].version).toBe("v3");
  });

});
