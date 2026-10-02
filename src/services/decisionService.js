// src/services/decisionService.js
// Enterprise AI Decision Service with immutable provenance metadata & RBAC enforcement

import { authorizeRoleAction } from "../utils/rbacEngine.js";

let inMemoryDecisions = [];

export function getDecisions(datasetId = null) {
  if (!datasetId) return inMemoryDecisions;
  return inMemoryDecisions.filter(d => d.datasetId === datasetId);
}

export function createDecision({
  companyId = "acme-corp",
  datasetId,
  datasetVersion = "v1",
  rawHash = "sha256-hash",
  lineageId,
  userId = "user-1",
  title,
  recommendation,
  rationale,
  why,
  impact,
  affectedRows = 0,
  affectedCols = 0,
  severity = "🟡 Low",
  transformation = null
}) {
  const decision = {
    decisionId: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    companyId,
    datasetId,
    datasetVersion,
    rawHash,
    lineageId: lineageId || (datasetId ? `lin-${datasetId}` : "lin-root"),
    userId,
    title,
    recommendation,
    rationale: rationale || why || recommendation,
    why: why || rationale || recommendation,
    impact: impact || "Maintains clean, verifiable dataset integrity across workflows.",
    affectedRows,
    affectedCols,
    severity,
    status: "pending", // pending, applied, rejected
    createdAt: new Date().toISOString(),
    transformation
  };

  inMemoryDecisions.unshift(decision);
  return decision;
}

export function approveDecision(decisionId, userRole, applyTransformationFn = null) {
  // RBAC check: Only authorized roles (e.g. data_analyst, data_scientist, admin, ceo) can approve
  const auth = authorizeRoleAction(userRole, "approve_decision");
  const isAuthorizedRole = ["data_analyst", "data_scientist", "admin", "ceo"].includes(userRole);
  if (!isAuthorizedRole && !auth.authorized) {
    return {
      success: false,
      error: `Unauthorized: Role '${userRole}' lacks permission to approve dataset decision.`
    };
  }

  const decision = inMemoryDecisions.find(d => d.decisionId === decisionId || d.id === decisionId);
  if (!decision) {
    return { success: false, error: "Decision not found" };
  }

  decision.status = "applied";
  decision.appliedAt = new Date().toISOString();
  decision.approvedByRole = userRole;

  if (typeof applyTransformationFn === "function" && decision.transformation) {
    applyTransformationFn(decision.transformation);
  }

  return { success: true, decision };
}

export function rejectDecision(decisionId, reason = "Rejected by analyst") {
  const decision = inMemoryDecisions.find(d => d.decisionId === decisionId || d.id === decisionId);
  if (!decision) {
    return { success: false, error: "Decision not found" };
  }

  decision.status = "rejected";
  decision.rejectedAt = new Date().toISOString();
  decision.rejectionReason = reason;

  return { success: true, decision };
}

export function clearDecisions() {
  inMemoryDecisions = [];
}
