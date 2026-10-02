// src/components/workspace/DatasetWorkspace.jsx
import React from "react";
import DatasetHeader from "./DatasetHeader";
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
import InvestigationDrawer from "./InvestigationDrawer";
import AIUnderstandingPanel from "../activity/AIUnderstandingPanel";
import ContextualIntelligenceRail from "../layout/ContextualIntelligenceRail";
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
    <div style={{ display: "flex", gap: 20, position: "relative" }}>
      {/* Primary Workspace Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0, paddingRight: 280 }}>
        {/* Dataset Header Bar */}
        <DatasetHeader />

        {/* 9-Stage Progress Stepper Header */}
        <DatasetWorkspaceStepper />

        {/* AI Understanding Panel */}
        <AIUnderstandingPanel />

        {/* Active Stage Content Slot */}
        {renderStageContent()}

        {/* Universal Investigation Drawer */}
        <InvestigationDrawer />
      </div>

      {/* Right-Side Persistent Contextual Intelligence Rail */}
      <ContextualIntelligenceRail />
    </div>
  );
}
