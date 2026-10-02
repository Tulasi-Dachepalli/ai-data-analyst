// src/context/DecisionContext.jsx
// Global DecisionProvider managing pending AI decisions with full provenance and RBAC

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useDataset } from "./DatasetContext";
import { useRole } from "./RoleContext";
import { useActivity } from "./ActivityContext";
import { getDecisions, createDecision, approveDecision, rejectDecision } from "../services/decisionService";

const DecisionContext = createContext(null);

export function DecisionProvider({ children }) {
  const { activeDataset, currentVersion, rawVersion, applyTransformation } = useDataset() || {};
  const { user, activeRole } = useRole() || {};
  const { logEvent } = useActivity() || { logEvent: () => {} };

  const [inboxOpen, setInboxOpen] = useState(false);
  const [localDecisions, setLocalDecisions] = useState([]);

  // Generate / populate decisions tied directly to the active dataset
  useEffect(() => {
    if (!activeDataset) {
      setLocalDecisions([]);
      return;
    }

    const datasetId = activeDataset.id;
    const version = currentVersion?.version || "v1";
    const rawHash = activeDataset.rawHash || (rawVersion ? rawVersion.hash : "sha256-root");

    const existing = getDecisions(datasetId);
    if (existing.length > 0) {
      setLocalDecisions(existing);
      return;
    }

    // Initialize dataset-specific pending AI recommendations
    const d1 = createDecision({
      companyId: user?.companyName || "acme-corp",
      datasetId,
      datasetVersion: version,
      rawHash,
      lineageId: `lin-${datasetId}`,
      userId: user?.email || "analyst@enterprise.com",
      title: `Duplicate Record Validation (${activeDataset.name})`,
      recommendation: `Scan and deduplicate potential duplicate records in ${activeDataset.name} to establish a clean analytical baseline.`,
      why: `Initial profiling scan detected row patterns that may skew aggregation models.`,
      impact: "Eliminates potential double-counting across reporting stages.",
      affectedRows: Math.min(12, activeDataset.rowCount || 12),
      affectedCols: (activeDataset.columns || []).length,
      severity: "🔴 High",
      transformation: {
        operationType: "deduplicate",
        columns: activeDataset.columns || [],
        reason: "Automated deduplication decision approved by analyst",
        method: "Exact Row Hash Match"
      }
    });

    const d2 = createDecision({
      companyId: user?.companyName || "acme-corp",
      datasetId,
      datasetVersion: version,
      rawHash,
      lineageId: `lin-${datasetId}`,
      userId: user?.email || "analyst@enterprise.com",
      title: `Statistical Outlier Review (${activeDataset.name})`,
      recommendation: `Flag and normalize high-leverage outliers in ${activeDataset.name} prior to running forecasting models.`,
      why: "Outlier data points with Z-score > 3.0 observed in primary numeric distribution.",
      impact: "Improves regression and forecasting accuracy.",
      affectedRows: Math.min(5, activeDataset.rowCount || 5),
      affectedCols: 1,
      severity: "🟠 Medium"
    });

    setLocalDecisions([d1, d2]);
  }, [activeDataset?.id, activeDataset?.name]);

  const applyDecisionHandler = (id, role = activeRole) => {
    const res = approveDecision(id, role, (trans) => {
      if (applyTransformation) {
        applyTransformation({
          operationType: trans.operationType || "clean",
          columns: trans.columns || activeDataset?.columns || [],
          reason: trans.reason || "Approved AI recommendation",
          method: trans.method || "System Automated Rule",
          newRows: activeDataset?.rows || [],
          newCols: activeDataset?.columns || [],
          affectedRowsCount: 12
        });
      }
    });

    if (res.success) {
      setLocalDecisions(prev => prev.map(d => (d.id === id || d.decisionId === id) ? { ...d, status: "applied" } : d));
      logEvent({
        stage: "03 Data Cleaning",
        action: `Approved Decision: ${res.decision.title}`,
        datasetVersion: currentVersion?.version || "v1",
        affectedRows: res.decision.affectedRows,
        result: `Decision applied successfully by ${role}`
      });
    }

    return res;
  };

  const rejectDecisionHandler = (id, reason = "Rejected by analyst") => {
    const res = rejectDecision(id, reason);
    if (res.success) {
      setLocalDecisions(prev => prev.map(d => (d.id === id || d.decisionId === id) ? { ...d, status: "rejected" } : d));
      logEvent({
        stage: "03 Data Cleaning",
        action: `Rejected Decision: ${res.decision.title}`,
        datasetVersion: currentVersion?.version || "v1",
        affectedRows: 0,
        result: `Decision rejected: ${reason}`
      });
    }
    return res;
  };

  const addDecisionHandler = (data) => {
    const d = createDecision({
      ...data,
      datasetId: data.datasetId || activeDataset?.id,
      datasetVersion: data.datasetVersion || currentVersion?.version || "v1",
      rawHash: data.rawHash || activeDataset?.rawHash
    });
    setLocalDecisions(prev => [d, ...prev]);
    return d;
  };

  const refreshDecisions = () => {
    if (activeDataset?.id) {
      setLocalDecisions(getDecisions(activeDataset.id));
    }
  };

  const openInbox = () => setInboxOpen(true);
  const closeInbox = () => setInboxOpen(false);

  const pendingDecisions = useMemo(() => {
    return localDecisions.filter(d => d.status === "pending");
  }, [localDecisions]);

  return (
    <DecisionContext.Provider value={{
      decisions: localDecisions,
      pendingDecisions,
      inboxOpen,
      openInbox,
      closeInbox,
      applyDecision: applyDecisionHandler,
      rejectDecision: rejectDecisionHandler,
      addDecision: addDecisionHandler,
      refreshDecisions
    }}>
      {children}
    </DecisionContext.Provider>
  );
}

export function useDecision() {
  const ctx = useContext(DecisionContext);
  if (!ctx) throw new Error("useDecision must be used within a DecisionProvider");
  return ctx;
}
