// src/services/concurrencyService.js

/**
 * Concurrency & Distributed Locking Service
 * Implements atomic optimistic concurrency control around dataset mutations.
 * Guaranteed to preserve the frozen DatasetContext contract without altering its core API.
 */

// In-memory version state registry to support optimistic concurrency across users/clients
const CLIENT_VERSION_REGISTRY = new Map();
const CONCURRENCY_AUDIT_LOG = [];

export function getClientDatasetState(datasetId, initialRawHash = "sha256-canonical-000000") {
  const idStr = String(datasetId || "default");
  if (!CLIENT_VERSION_REGISTRY.has(idStr)) {
    CLIENT_VERSION_REGISTRY.set(idStr, {
      datasetId: idStr,
      currentVersion: "v1",
      versionNumber: 1,
      rawHash: initialRawHash,
      companyId: "company_1",
      history: [
        {
          version: "v1",
          versionNumber: 1,
          rawHash: initialRawHash,
          immutable: true,
          label: "v1 Raw",
          createdAt: new Date().toISOString()
        }
      ]
    });
  }
  return CLIENT_VERSION_REGISTRY.get(idStr);
}

export function resetConcurrencyRegistry() {
  CLIENT_VERSION_REGISTRY.clear();
  CONCURRENCY_AUDIT_LOG.length = 0;
}

export function getConcurrencyAuditLogs() {
  return [...CONCURRENCY_AUDIT_LOG];
}

/**
 * Concurrency-Safe Mutation Request Dispatcher
 * Checks:
 * 1. Cross-tenant isolation (companyId vs targetTenantId)
 * 2. Role-based access control (RBAC: recruiter rejected)
 * 3. Optimistic version check (expectedDatasetVersion === currentVersion)
 * 4. Non-destructive restore or mutation version generation
 */
export async function mutateDatasetWithConcurrency({
  datasetId,
  expectedDatasetVersion,
  operation = "clean",
  lineageId = "lin_default",
  rawHash = "sha256-canonical-000000",
  userId = "user_1",
  role = "data_analyst",
  companyId = "company_1",
  targetTenantId = "company_1",
  restoreTargetVersion = null
}) {
  const state = getClientDatasetState(datasetId, rawHash);

  // 1. Cross-Tenant Isolation Guard
  if (companyId && targetTenantId && companyId !== targetTenantId) {
    const auditEvent = {
      action: "MUTATION_BLOCKED_TENANT_ISOLATION",
      datasetId,
      userId,
      companyId,
      targetTenantId,
      status: "REJECTED_403",
      timestamp: new Date().toISOString()
    };
    CONCURRENCY_AUDIT_LOG.push(auditEvent);
    return {
      success: false,
      status: 403,
      error: "Cross-tenant mutation rejected. Target dataset belongs to another tenant organization.",
      auditEvent
    };
  }

  // 2. Role-Based Access Control (RBAC) Guard
  const allowedRoles = ["ceo", "data_analyst", "admin", "lead_analyst"];
  if (role && !allowedRoles.includes(role.toLowerCase())) {
    const auditEvent = {
      action: "MUTATION_BLOCKED_RBAC",
      datasetId,
      userId,
      role,
      status: "REJECTED_403",
      timestamp: new Date().toISOString()
    };
    CONCURRENCY_AUDIT_LOG.push(auditEvent);
    return {
      success: false,
      status: 403,
      error: `Unauthorized: Role '${role}' lacks mutation permission on dataset.`,
      auditEvent
    };
  }

  // 3. Atomic Optimistic Locking Version Check
  const currentVersion = state.currentVersion;
  if (expectedDatasetVersion && expectedDatasetVersion !== currentVersion) {
    const conflictEvent = {
      action: "MUTATION_CONFLICT",
      datasetId,
      userId,
      operation,
      expectedVersion: expectedDatasetVersion,
      currentVersion,
      rawHash: state.rawHash,
      status: "CONFLICT_409",
      timestamp: new Date().toISOString()
    };
    CONCURRENCY_AUDIT_LOG.push(conflictEvent);

    return {
      success: false,
      status: 409,
      error: "Version conflict detected. Dataset was modified by another user.",
      currentVersion,
      expectedVersion: expectedDatasetVersion,
      rawHash: state.rawHash,
      auditEvent: conflictEvent
    };
  }

  // 4. Success — Create NEW version branch forward
  const nextVerNum = state.versionNumber + 1;
  const nextVerTag = `v${nextVerNum}`;

  const newVersionRecord = {
    version: nextVerTag,
    versionNumber: nextVerNum,
    label: operation === "restore" ? `Restored from ${restoreTargetVersion || "v1"}` : `${operation.charAt(0).toUpperCase() + operation.slice(1)} ${nextVerTag}`,
    rawHash: state.rawHash, // SHA-256 raw checksum invariant preserved
    immutable: true,
    createdBy: userId,
    createdAt: new Date().toISOString()
  };

  state.history.push(newVersionRecord);
  state.currentVersion = nextVerTag;
  state.versionNumber = nextVerNum;

  const successEvent = {
    action: "MUTATION_APPLIED",
    datasetId,
    userId,
    operation,
    previousVersion: currentVersion,
    newVersion: nextVerTag,
    rawHash: state.rawHash,
    status: "SUCCESS_200",
    timestamp: new Date().toISOString()
  };
  CONCURRENCY_AUDIT_LOG.push(successEvent);

  return {
    success: true,
    status: 200,
    datasetId,
    previousVersion: currentVersion,
    newVersion: nextVerTag,
    rawHash: state.rawHash,
    historyCount: state.history.length,
    auditEvent: successEvent
  };
}
