// src/components/workspace/DatasetWorkspace.jsx
import React from "react";
import DatasetWorkspaceStepper from "./DatasetWorkspaceStepper";
import StageRawData from "../stages/StageRawData";
import StageDataQuality from "../stages/StageDataQuality";
import StageDataCleaning from "../stages/StageDataCleaning";
import StageCleanedData from "../stages/StageCleanedData";
import StageExplore from "../stages/StageExplore";
import StageInsights from "../stages/StageInsights";
import StageModeling from "../stages/StageModeling";
import StageForecast from "../stages/StageForecast";
import StageReport from "../stages/StageReport";
import { useDataset } from "../../context/DatasetContext";

export default function DatasetWorkspace() {
  const { currentStage } = useDataset();

  const renderStageContent = () => {
    switch (currentStage) {
      case "raw": return <StageRawData />;
      case "quality": return <StageDataQuality />;
      case "cleaning": return <StageDataCleaning />;
      case "cleaned": return <StageCleanedData />;
      case "explore": return <StageExplore />;
      case "insights": return <StageInsights />;
      case "modeling": return <StageModeling />;
      case "forecast": return <StageForecast />;
      case "report": return <StageReport />;
      default: return <StageRawData />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 9-Stage Progress Stepper Header */}
      <DatasetWorkspaceStepper />

      {/* Active Stage Content Slot */}
      {renderStageContent()}
    </div>
  );
}
