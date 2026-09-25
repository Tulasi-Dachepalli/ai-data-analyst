// src/config/workflowStages.js
// Master definitions for the 9-Stage Dataset Workspace & Role Exposure Mappings

export const WORKFLOW_STAGES = [
  {
    id: "raw",
    number: 1,
    label: "Raw Data",
    shortLabel: "Raw",
    icon: "🔒",
    requires: [],
    produces: "rawDataset",
    description: "Immutable original dataset locked for audit integrity"
  },
  {
    id: "quality",
    number: 2,
    label: "Data Quality",
    shortLabel: "Quality",
    icon: "📊",
    requires: ["raw"],
    produces: "qualityReport",
    description: "Data health score, missing values, duplicates, and anomaly assessment"
  },
  {
    id: "cleaning",
    number: 3,
    label: "Data Cleaning",
    shortLabel: "Cleaning",
    icon: "🧹",
    requires: ["quality"],
    produces: "transformation",
    description: "Transactional cleaning operations with before/after previews"
  },
  {
    id: "cleaned",
    number: 4,
    label: "Cleaned Data",
    shortLabel: "Cleaned",
    icon: "✨",
    requires: ["cleaning"],
    produces: "cleanedDataset",
    description: "Verified clean dataset ready for downstream exploration and modeling"
  },
  {
    id: "explore",
    number: 5,
    label: "Explore",
    shortLabel: "Explore",
    icon: "🔍",
    requires: ["cleaned"],
    produces: "edaResults",
    description: "Exploratory data analysis, distributions, and correlation matrices"
  },
  {
    id: "insights",
    number: 6,
    label: "Insights",
    shortLabel: "Insights",
    icon: "💡",
    requires: ["explore"],
    produces: "insightResults",
    description: "AI-generated executive findings, pattern extraction, and anomalies"
  },
  {
    id: "modeling",
    number: 7,
    label: "Modeling",
    shortLabel: "Model",
    icon: "🤖",
    requires: ["cleaned"],
    produces: "modelResults",
    description: "AutoML model training, feature importance, and performance benchmarks"
  },
  {
    id: "forecast",
    number: 8,
    label: "Forecast",
    shortLabel: "Forecast",
    icon: "📈",
    requires: ["modeling"],
    produces: "forecastResults",
    description: "Time-series projections, confidence intervals, and scenario models"
  },
  {
    id: "report",
    number: 9,
    label: "Executive Report",
    shortLabel: "Report",
    icon: "📄",
    requires: ["insights"],
    produces: "report",
    description: "Automated executive summary deck builder and PDF/Excel exporter"
  }
];

export const ROLE_STAGE_VISIBILITY = {
  ceo: ["explore", "insights", "forecast", "report"],
  hr: ["quality", "cleaning", "explore", "insights", "report"],
  recruiter: ["quality", "cleaning", "explore", "insights", "report"],
  finance: ["quality", "cleaning", "explore", "insights", "forecast", "report"],
  data_analyst: ["raw", "quality", "cleaning", "cleaned", "explore", "insights", "modeling", "forecast", "report"],
  data_scientist: ["raw", "quality", "cleaning", "cleaned", "explore", "insights", "modeling", "forecast", "report"]
};

export function getVisibleStagesForRole(roleId = "ceo") {
  const allowed = ROLE_STAGE_VISIBILITY[roleId] || ROLE_STAGE_VISIBILITY.ceo;
  return WORKFLOW_STAGES.filter(stage => allowed.includes(stage.id));
}

/**
 * Computes explicit stage lock state:
 * - "completed" (✓)
 * - "current" (●)
 * - "available" (○)
 * - "locked" (🔒)
 */
export function getStageLockState(stageId, currentStageId, completedStages = ["raw", "quality"]) {
  if (stageId === currentStageId) return "current";
  if (completedStages.includes(stageId)) return "completed";
  
  const stage = WORKFLOW_STAGES.find(s => s.id === stageId);
  if (!stage) return "available";

  const allReqsMet = stage.requires.every(req => completedStages.includes(req) || req === currentStageId);
  return allReqsMet ? "available" : "locked";
}
