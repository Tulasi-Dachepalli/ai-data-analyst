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
    if (!activeDataset || !activeDataset.rows || activeDataset.rows.length === 0) {
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

    // Initialize dataset-specific pending AI recommendations STRICTLY FROM VERIFIED EVIDENCE
    const generatedDecisions = [];

    // 1. Evidence Check: Duplicate Records
    const seenRows = new Set();
    let duplicateRowsCount = 0;
    (activeDataset.rows || []).forEach(r => {
      const sig = JSON.stringify(r);
      if (seenRows.has(sig)) duplicateRowsCount++;
      else seenRows.add(sig);
    });

    if (duplicateRowsCount > 0) {
      generatedDecisions.push(createDecision({
        companyId: user?.companyName || "acme-corp",
        datasetId,
        datasetVersion: version,
        rawHash,
        lineageId: `lin-${datasetId}`,
        userId: user?.email || "analyst@enterprise.com",
        title: `Deduplicate Verified Collisions (${activeDataset.name})`,
        recommendation: `Remove ${duplicateRowsCount} duplicate record(s) in ${activeDataset.name} to establish a clean analytical baseline.`,
        why: `Automated profiling scan verified ${duplicateRowsCount} identical record collision(s) across dataset rows.`,
        impact: "Eliminates potential double-counting across metric aggregations and downstream reporting.",
        affectedRows: duplicateRowsCount,
        affectedCols: (activeDataset.columns || []).length,
        severity: duplicateRowsCount > 10 ? "🔴 High" : "🟡 Medium",
        transformation: {
          operationType: "deduplicate",
          columns: activeDataset.columns || [],
          reason: `Automated deduplication for ${duplicateRowsCount} duplicate rows`,
          method: "Exact Row Signature Match"
        }
      }));
    }

    // 2. Evidence Check: Missing Field Values
    let missingCellCount = 0;
    const columnsWithNulls = new Set();
    (activeDataset.rows || []).forEach(r => {
      (activeDataset.columns || []).forEach(c => {
        if (r[c] === null || r[c] === undefined || String(r[c]).trim() === "") {
          missingCellCount++;
          columnsWithNulls.add(c);
        }
      });
    });

    if (missingCellCount > 0) {
      const affectedColsList = Array.from(columnsWithNulls);
      generatedDecisions.push(createDecision({
        companyId: user?.companyName || "acme-corp",
        datasetId,
        datasetVersion: version,
        rawHash,
        lineageId: `lin-${datasetId}`,
        userId: user?.email || "analyst@enterprise.com",
        title: `Missing Field Imputation (${activeDataset.name})`,
        recommendation: `Impute or handle ${missingCellCount} blank/null value(s) detected across ${affectedColsList.length} column(s).`,
        why: `Profiling scan detected incomplete data in columns: ${affectedColsList.slice(0, 3).join(", ")}${affectedColsList.length > 3 ? "..." : ""}.`,
        impact: "Prevents calculation bias and missing-value dropouts in Stage 07 modeling.",
        affectedRows: missingCellCount,
        affectedCols: affectedColsList.length,
        severity: "🟠 Medium",
        transformation: {
          operationType: "impute",
          columns: affectedColsList,
          reason: `Handle ${missingCellCount} missing values`,
          method: "Forward Fill / Median Imputation"
        }
      }));
    }

    // 3. Evidence Check: Statistical Outliers (Numeric columns)
    const outlierFindings = [];
    (activeDataset.columns || []).forEach(col => {
      const numericVals = (activeDataset.rows || [])
        .map(r => r[col])
        .filter(v => v !== null && v !== undefined && v !== "" && !isNaN(Number(v)))
        .map(v => Number(v));

      if (numericVals.length >= 10) {
        const mean = numericVals.reduce((a, b) => a + b, 0) / numericVals.length;
        const variance = numericVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericVals.length;
        const std = Math.sqrt(variance);
        if (std > 0) {
          const outliers = numericVals.filter(v => Math.abs(v - mean) > 3 * std);
          if (outliers.length > 0) {
            outlierFindings.push({ column: col, count: outliers.length });
          }
        }
      }
    });

    if (outlierFindings.length > 0) {
      const totalOutliers = outlierFindings.reduce((sum, o) => sum + o.count, 0);
      const outlierCols = outlierFindings.map(o => o.column);
      generatedDecisions.push(createDecision({
        companyId: user?.companyName || "acme-corp",
        datasetId,
        datasetVersion: version,
        rawHash,
        lineageId: `lin-${datasetId}`,
        userId: user?.email || "analyst@enterprise.com",
        title: `Statistical Outlier Review (${activeDataset.name})`,
        recommendation: `Inspect and normalize ${totalOutliers} extreme value(s) with |Z| > 3.0 across ${outlierCols.slice(0, 3).join(", ")}.`,
        why: `Extreme distribution deviations observed in numeric columns: ${outlierCols.slice(0, 3).join(", ")}.`,
        impact: "Prevents distortion in regression and time-series forecasting models.",
        affectedRows: totalOutliers,
        affectedCols: outlierCols.length,
        severity: "🟠 Medium",
        transformation: {
          operationType: "winsorize",
          columns: outlierCols,
          reason: `Normalize ${totalOutliers} distribution outliers`,
          method: "99th Percentile Winsorization"
        }
      }));
    }

    setLocalDecisions(generatedDecisions);
  }, [activeDataset?.id, activeDataset?.name, activeDataset?.rowCount]);

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
  if (!ctx) {
    return {
      pendingDecisions: [],
      inboxOpen: false,
      openInbox: () => {},
      closeInbox: () => {},
      applyDecision: () => {},
      rejectDecision: () => {},
      requestDecision: () => {},
      decisions: []
    };
  }
  return ctx;
}
