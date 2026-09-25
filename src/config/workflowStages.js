// src/config/workflowStages.js
// Master definitions for the 9-Stage Dataset Workspace & Role Exposure Mappings

export const WORKFLOW_STAGES = [
  {
    id: "raw",
    number: 1,
    label: "Raw Data",
    shortLabel: "Raw",
    icon: "🔒",
    description: "Immutable original dataset locked for audit integrity",
    badge: "Original v1"
  },
  {
    id: "quality",
    number: 2,
    label: "Data Quality",
    shortLabel: "Quality",
    icon: "📊",
    description: "Data health score, missing values, duplicates, and anomaly assessment",
    badge: "Health Score"
  },
  {
    id: "cleaning",
    number: 3,
    label: "Data Cleaning",
    shortLabel: "Cleaning",
    icon: "🧹",
    description: "Transactional cleaning operations with before/after previews",
    badge: "Transactional"
  },
  {
    id: "cleaned",
    number: 4,
    label: "Cleaned Data",
    shortLabel: "Cleaned",
    icon: "✨",
    description: "Verified clean dataset ready for downstream exploration and modeling",
    badge: "Verified Clean"
  },
  {
    id: "explore",
    number: 5,
    label: "Explore",
    shortLabel: "Explore",
    icon: "🔍",
    description: "Exploratory data analysis, distributions, and correlation matrices",
    badge: "EDA Studio"
  },
  {
    id: "insights",
    number: 6,
    label: "Insights",
    shortLabel: "Insights",
    icon: "💡",
    description: "AI-generated executive findings, pattern extraction, and anomalies",
    badge: "AI Brief"
  },
  {
    id: "modeling",
    number: 7,
    label: "Modeling",
    shortLabel: "Model",
    icon: "🤖",
    description: "AutoML model training, feature importance, and performance benchmarks",
    badge: "AutoML Engine"
  },
  {
    id: "forecast",
    number: 8,
    label: "Forecast",
    shortLabel: "Forecast",
    icon: "📈",
    description: "Time-series projections, confidence intervals, and scenario models",
    badge: "Projections"
  },
  {
    id: "report",
    number: 9,
    label: "Executive Report",
    shortLabel: "Report",
    icon: "📄",
    description: "Automated executive summary deck builder and PDF/Excel exporter",
    badge: "Final Deck"
  }
];

// Role-specific stage visibility mapping
// Determines which stages are prominently displayed in the navigation header per role
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
