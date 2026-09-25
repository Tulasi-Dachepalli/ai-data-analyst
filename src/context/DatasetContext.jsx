// src/context/DatasetContext.jsx
import React, { createContext, useContext, useState, useMemo } from "react";
import { WORKFLOW_STAGES } from "../config/workflowStages";
import { createInitialVersionStack, applyTransactionalOperation, compareVersions } from "../utils/dataLineage";

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [activeDataset, setActiveDataset] = useState(null);
  const [currentStage, setCurrentStage] = useState("raw"); // Stage ID
  const [versionStack, setVersionStack] = useState(null);

  // Initialize dataset & lineage version stack
  const loadDataset = (name, rows = [], cols = []) => {
    const stack = createInitialVersionStack(name, rows, cols);
    setVersionStack(stack);
    setActiveDataset({
      name,
      rawRows: rows,
      rawCols: cols
    });
    setCurrentStage("raw");
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

  const currentVersion = versionStack?.currentVersion || null;
  const rawVersion = versionStack?.rawVersion || null;
  const history = versionStack?.history || [];

  const activeRows = currentVersion ? currentVersion.rows : (activeDataset?.rawRows || []);
  const activeCols = currentVersion ? currentVersion.columns : (activeDataset?.rawCols || []);

  const versionDiff = useMemo(() => {
    if (!rawVersion || !currentVersion) return null;
    return compareVersions(rawVersion, currentVersion);
  }, [rawVersion, currentVersion]);

  return (
    <DatasetContext.Provider value={{
      activeDataset,
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
      applyTransformation
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
