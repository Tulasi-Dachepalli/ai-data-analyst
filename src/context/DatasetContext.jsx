// src/context/DatasetContext.jsx
import React, { createContext, useContext, useState, useMemo } from "react";
import { WORKFLOW_STAGES } from "../config/workflowStages";
import { createInitialVersionStack, applyTransactionalOperation, compareVersions, restoreVersion as restoreVersionInStack } from "../utils/dataLineage";

const DatasetContext = createContext(null);

function computeAuthoritativeQuality(rows, cols) {
  if (!rows || rows.length === 0 || !cols || cols.length === 0) {
    return { score: null, status: "not_assessed", missingCells: 0, missingRate: 0, duplicateRows: 0 };
  }
  const evalRows = rows.length > 2500 ? rows.slice(0, 2500) : rows;
  const sampleCells = evalRows.length * cols.length;
  let missingCells = 0;
  evalRows.forEach(row => {
    cols.forEach(col => {
      const v = row[col];
      if (v === null || v === undefined || String(v).trim() === "" || String(v).trim() === "null" || String(v).trim() === "NaN") {
        missingCells++;
      }
    });
  });
  const missingRate = sampleCells > 0 ? missingCells / sampleCells : 0;
  const score = Math.max(0, Math.round((1 - missingRate) * 100));
  return {
    score,
    status: "assessed",
    missingCells,
    missingRate: +(missingRate * 100).toFixed(2),
    duplicateRows: 0
  };
}

export function DatasetProvider({ children }) {
  const [activeDataset, setActiveDataset] = useState(null);
  const [currentStage, setCurrentStage] = useState("raw"); // Stage ID
  const [versionStack, setVersionStack] = useState(null);

  // Initialize dataset & lineage version stack with full metadata & SHA-256 hash
  const loadDataset = (name, rows = [], cols = [], meta = {}) => {
    const stack = createInitialVersionStack(name, rows, cols);
    setVersionStack(stack);
    const rawHash = meta.rawHash || (stack.rawVersion ? stack.rawVersion.hash : "sha256-v1-hash");
    const datasetId = meta.id || `ds-${Date.now()}`;

    // Diagnostic logging & dev guard (Development Only)
    if (import.meta.env?.DEV) {
      console.log("[DATASET SOURCE]", {
        id: datasetId,
        name,
        version: "v1",
        rows: rows.length,
        columns: cols.length
      });
      if (name?.toLowerCase().includes("audit_operations") && !meta?.isUserExplicit) {
        console.warn("[DATASET SOURCE WARNING] Unexpected audit_operations injection without explicit user intent:", new Error().stack);
      }
    }
    
    const computedQuality = meta.quality || computeAuthoritativeQuality(rows, cols);

    setActiveDataset({
      id: datasetId,
      name,
      fileName: name,
      fileType: meta.fileType || name.split(".").pop().toLowerCase() || "csv",
      size: meta.size || (rows.length * (cols.length || 1) * 10),
      columns: cols,
      rows: rows,
      rowCount: rows.length,
      columnCount: cols.length,
      rawRows: rows,
      rawCols: cols,
      rawHash: rawHash,
      currentVersion: "v1",
      stats: meta.stats || [],
      quality: computedQuality,
      tables: meta.tables || null,
      selectedTableIndex: meta.selectedTableIndex ?? 0,
      parsingStatus: meta.parsingStatus || (rows.length > 0 ? "parsed" : "empty"),
      profilingStatus: meta.profilingStatus || (rows.length > 0 ? "profiled" : "not_profiled"),
      qualityStatus: meta.qualityStatus || (rows.length > 0 ? "assessed" : "not_assessed"),
      analysisReady: meta.analysisReady ?? (rows.length > 0),
      versions: [
        {
          version: "v1",
          type: "raw",
          rows: rows,
          columns: cols,
          hash: rawHash,
          immutable: true
        }
      ]
    });
    setCurrentStage("raw");
  };

  const setActiveDatasetFromThread = (thread) => {
    if (!thread) return;
    const rows = thread.rows || [];
    const cols = thread.columns || (rows.length ? Object.keys(rows[0]) : []);
    const stack = createInitialVersionStack(thread.name || "Dataset", rows, cols);
    setVersionStack(stack);
    const rawHash = thread.rawHash || (stack.rawVersion ? stack.rawVersion.hash : "sha256-v1-hash");
    const threadId = thread.id || `ds-${Date.now()}`;

    if (import.meta.env?.DEV) {
      console.log("[DATASET SOURCE]", {
        id: threadId,
        name: thread.name,
        version: "v1",
        rows: rows.length,
        columns: cols.length
      });
      if (thread.name?.toLowerCase().includes("audit_operations") && !thread.isUserExplicit) {
        console.warn("[DATASET SOURCE WARNING] Unexpected audit_operations injection without explicit user intent:", new Error().stack);
      }
    }

    setActiveDataset({
      id: threadId,
      name: thread.name || "Dataset",
      fileName: thread.name || "Dataset",
      fileType: thread.name ? thread.name.split(".").pop().toLowerCase() : "csv",
      size: thread.size || (rows.length * (cols.length || 1) * 10),
      columns: cols,
      rows: rows,
      rowCount: rows.length,
      columnCount: cols.length,
      rawRows: rows,
      rawCols: cols,
      rawHash: rawHash,
      currentVersion: "v1",
      stats: thread.stats || [],
      quality: thread.quality || computeAuthoritativeQuality(rows, cols),
      tables: thread.tables || null,
      selectedTableIndex: thread.selectedTableIndex ?? 0,
      parsingStatus: thread.parsingStatus || (rows.length > 0 ? "parsed" : "empty"),
      profilingStatus: thread.profilingStatus || (rows.length > 0 ? "profiled" : "not_profiled"),
      qualityStatus: thread.qualityStatus || (rows.length > 0 ? "assessed" : "not_assessed"),
      analysisReady: thread.analysisReady ?? (rows.length > 0),
      versions: [
        {
          version: "v1",
          type: "raw",
          rows: rows,
          columns: cols,
          hash: rawHash,
          immutable: true
        }
      ]
    });
  };

  // Perform a transactional data cleaning operation
  const applyTransformation = ({ operationType, columns, reason, method, newRows, newCols, affectedRowsCount, beforeSample, afterSample }) => {
    if (!versionStack) return;
    const newStack = applyTransactionalOperation(versionStack, {
      operationType,
      columns,
      reason,
      method,
      newRows,
      newCols,
      affectedRowsCount,
      beforeSample,
      afterSample
    });
    setVersionStack(newStack);
  };

  // Non-destructive restore to historical version snapshot
  const restoreDatasetVersion = (targetVersionTag = "v1") => {
    if (!versionStack) return null;
    const newStack = restoreVersionInStack(versionStack, targetVersionTag);
    setVersionStack(newStack);
    if (activeDataset && newStack.currentVersion) {
      setActiveDataset(prev => ({
        ...prev,
        currentVersion: newStack.currentVersion.version,
        rowCount: newStack.currentVersion.rowCount,
        columnCount: newStack.currentVersion.colCount,
        rows: newStack.currentVersion.rows,
        columns: newStack.currentVersion.columns
      }));
    }
    return newStack.currentVersion;
  };

  const currentVersion = versionStack?.currentVersion || null;
  const rawVersion = versionStack?.rawVersion || null;
  const history = versionStack?.history || [];

  const activeRows = currentVersion ? currentVersion.rows : (activeDataset?.rawRows || []);
  const activeCols = currentVersion ? currentVersion.columns : (activeDataset?.rawCols || []);

  const versionDiff = useMemo(() => {
    if (!rawVersion || !currentVersion) return null;
    return compareVersions(rawVersion, currentVersion);
  }, [rawVersion, currentVersion]);

  const [investigationItem, setInvestigationItem] = useState(null);

  const openInvestigation = (item) => {
    setInvestigationItem(item);
  };

  const closeInvestigation = () => setInvestigationItem(null);

  return (
    <DatasetContext.Provider value={{
      activeDataset,
      currentDataset: activeDataset,
      currentStage,
      setCurrentStage,
      versionStack,
      currentVersion,
      rawVersion,
      history,
      activeRows,
      activeCols,
      versionDiff,
      loadDataset,
      setActiveDatasetFromThread,
      applyTransformation,
      restoreVersion: restoreDatasetVersion,
      investigationItem,
      openInvestigation,
      closeInvestigation
    }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }
  return context;
}
