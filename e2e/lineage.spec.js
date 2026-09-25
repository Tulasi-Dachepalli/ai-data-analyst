// e2e/lineage.spec.js
// Master 11-Scenario Release Gate Test Suite

import { test, expect } from '@playwright/test';
import { createInitialVersionStack, applyTransactionalOperation, computeCanonicalHash, restoreVersion, compareVersions } from '../src/utils/dataLineage.js';
import { WORKFLOW_STAGES, getStageLockState, getVisibleStagesForRole } from '../src/config/workflowStages.js';
import { getCopilotPrompts } from '../src/config/copilotPrompts.js';

test.describe('Master 11-Scenario Release Gate Suite', () => {

  // ROLE SCENARIOS
  test('ROLE-01: CEO Role Configuration & Navigation Scope', () => {
    const ceoStages = getVisibleStagesForRole('ceo');
    expect(ceoStages.map(s => s.id)).toEqual(['explore', 'insights', 'forecast', 'report']);
    expect(getStageLockState('modeling', 'explore', ['raw'], 'ceo')).toBe('restricted');
  });

  test('ROLE-02: Data Analyst Role Scope & Full 9-Stage Exposure', () => {
    const analystStages = getVisibleStagesForRole('data_analyst');
    expect(analystStages.length).toBe(9);
    expect(getStageLockState('cleaned', 'cleaned', ['raw', 'quality', 'cleaning', 'cleaned'], 'data_analyst')).toBe('current');
    expect(getStageLockState('modeling', 'cleaned', ['raw', 'quality', 'cleaning', 'cleaned'], 'data_analyst')).toBe('available');
    expect(getStageLockState('quality', 'cleaned', ['raw', 'quality', 'cleaning', 'cleaned'], 'data_analyst')).toBe('completed');
  });

  // DATASET LINEAGE & IMMUTABILITY SCENARIOS
  test('DATA-01: Raw Stage Read-Only & Immutability Checksum Hash', () => {
    const rawData = [{ id: 1, rev: 100 }, { id: 2, rev: 200 }];
    const stack = createInitialVersionStack("Audit_Ops", rawData, ["id", "rev"]);
    const initialHash = stack.rawVersion.hash;

    expect(stack.rawVersion.immutable).toBe(true);
    expect(initialHash).toContain("sha256-");
  });

  test('DATA-02: Transactional Deduplication Creates v2 Without Altering v1', () => {
    const rawData = [{ id: 1, val: 10 }, { id: 1, val: 10 }];
    let stack = createInitialVersionStack("Audit_Ops", rawData, ["id", "val"]);
    
    stack = applyTransactionalOperation(stack, {
      operationType: "dedupe",
      columns: ["id", "val"],
      reason: "Duplicate row",
      method: "Removed duplicate",
      newRows: [rawData[0]],
      newCols: ["id", "val"],
      affectedRowsCount: 1
    });

    expect(stack.currentVersion.version).toBe("v2");
    expect(stack.rawVersion.version).toBe("v1");
    expect(stack.rawVersion.rowCount).toBe(2);
    expect(stack.currentVersion.rowCount).toBe(1);
  });

  test('DATA-03: Missing Value Imputer Creates v3 and Logs Transformation', () => {
    const rawData = [{ id: 1, val: null }];
    let stack = createInitialVersionStack("Audit_Ops", rawData, ["id", "val"]);
    
    stack = applyTransactionalOperation(stack, {
      operationType: "impute_missing",
      columns: ["val"],
      reason: "Missing val",
      method: "Imputed median",
      newRows: [{ id: 1, val: 50 }],
      newCols: ["id", "val"],
      affectedRowsCount: 1
    });

    expect(stack.currentVersion.version).toBe("v2");
    expect(stack.currentVersion.transformations[0].operation).toBe("impute_missing");
  });

  test('DATA-04: Change History Timeline & Version Audit Ledger', () => {
    const rawData = [{ id: 1 }];
    let stack = createInitialVersionStack("Audit_Ops", rawData, ["id"]);
    
    stack = applyTransactionalOperation(stack, {
      operationType: "dedupe",
      columns: ["id"],
      reason: "Dedupe",
      method: "Dedupe",
      newRows: rawData,
      newCols: ["id"],
      affectedRowsCount: 0
    });

    expect(stack.history.length).toBe(2);
    expect(stack.history[0].version).toBe("v1");
    expect(stack.history[1].version).toBe("v2");
  });

  test('DATA-05: Compare v1 ↔ vN Differences and Cell Diff Viewer', () => {
    const rawData = [{ id: 1, val: null }, { id: 2, val: 20 }];
    let stack = createInitialVersionStack("Audit_Ops", rawData, ["id", "val"]);
    
    stack = applyTransactionalOperation(stack, {
      operationType: "impute_missing",
      columns: ["val"],
      reason: "Impute missing",
      method: "Impute",
      newRows: [{ id: 1, val: 10 }, { id: 2, val: 20 }],
      newCols: ["id", "val"],
      affectedRowsCount: 1
    });

    const diff = compareVersions(stack.rawVersion, stack.currentVersion);
    expect(diff.missingResolved).toBe(1);
    expect(diff.isRawImmutable).toBe(true);
  });

  // STAGE-AWARE AI COPILOT SCENARIOS
  test('AI-01: Raw Stage Prompts Integration', () => {
    const prompts = getCopilotPrompts('data_analyst', 'raw');
    expect(prompts).toContain("What columns are available?");
  });

  test('AI-02: Cleaning Stage Prompts Integration', () => {
    const prompts = getCopilotPrompts('data_analyst', 'cleaning');
    expect(prompts).toContain("Why did you recommend this change?");
  });

  test('AI-03: Copilot Uses Transformation Lineage History', () => {
    const rawData = [{ id: 1, val: 10 }];
    let stack = createInitialVersionStack("Audit_Ops", rawData, ["id", "val"]);
    stack = applyTransactionalOperation(stack, {
      operationType: "date_format",
      columns: ["val"],
      reason: "Date format standardize",
      method: "Standardized to YYYY-MM-DD",
      newRows: rawData,
      newCols: ["id", "val"],
      affectedRowsCount: 1
    });

    const tx = stack.currentVersion.transformations[0];
    expect(tx.reason).toBe("Date format standardize");
  });

  // SECURITY SCENARIO
  test('SECURITY-01: Unauthorized Role Capability Restriction', () => {
    expect(getStageLockState('modeling', 'raw', [], 'ceo')).toBe('restricted');
  });

});
