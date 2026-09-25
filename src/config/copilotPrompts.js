// src/config/copilotPrompts.js
// Stage-specific and Role-specific configuration matrix for AI Copilot prompt chips

export const STAGE_PROMPTS = {
  raw: [
    "What columns are available?",
    "What does this dataset contain?",
    "How many records are there?",
    "Show a sample of raw rows"
  ],

  quality: [
    "What problems did you find?",
    "Which columns need attention?",
    "How can I improve data quality?",
    "Show missing value percentages"
  ],

  cleaning: [
    "Why did you recommend this change?",
    "Show affected rows before applying",
    "What happens if I skip this step?",
    "Explain duplicate removal rationale"
  ],

  cleaned: [
    "What changed from the original dataset?",
    "Is this dataset ready for analysis?",
    "Show the full cleaning summary",
    "Compare version v1 with current version"
  ],

  explore: [
    "What are the strongest relationships?",
    "Show unusual patterns in numerical columns",
    "Which variables matter most?",
    "Generate correlation heatmap insights"
  ],

  insights: [
    "What are the key executive findings?",
    "What explains the revenue variance?",
    "What should management investigate?",
    "Summarize regional performance trends"
  ],

  modeling: [
    "Which model should I test?",
    "Compare model accuracy and RMSE",
    "Which features are most important?",
    "Evaluate Random Forest vs XGBoost"
  ],

  forecast: [
    "What is the expected trend for next quarter?",
    "Show the forecast confidence bounds",
    "What risk factors could affect the forecast?",
    "Project revenue growth scenario"
  ],

  report: [
    "Summarize all key findings for the board deck",
    "Generate executive narrative overview",
    "What are the top 3 strategic recommendations?",
    "Export report summary"
  ]
};

export const ROLE_PROMPTS = {
  ceo: [
    "Summarize Q3 business performance and revenue drivers",
    "What operational risks need immediate executive attention?",
    "Compare this quarter's net profit margin with budget target",
    "Where are we overspending across business units?"
  ],
  hr: [
    "What is our current attrition rate and turnover risk?",
    "Which departments show high absenteeism patterns?",
    "Analyze compensation satisfaction from exit surveys",
    "Summarize headcount expansion trajectory for Q4"
  ],
  recruiter: [
    "What are the key bottlenecks in our hiring pipeline?",
    "Which candidate sourcing channels have highest offer acceptance?",
    "Calculate average time-to-hire across technical roles",
    "Show open positions by department and priority"
  ],
  finance: [
    "Analyze operating expense variance against Q3 budget",
    "Where are the largest financial audit discrepancies?",
    "Calculate EBITDA and operating cash runway",
    "Project Q4 cash flow projections under base case scenario"
  ],
  data_analyst: [
    "Run comprehensive EDA summary on active dataset",
    "Identify missing data and recommend cleaning operations",
    "Find top 5 correlated metrics with revenue",
    "Build cohort retention matrix for enterprise clients"
  ],
  data_scientist: [
    "Run AutoML pipeline and compare model benchmarks",
    "Calculate feature importance scores using Random Forest",
    "Perform ARIMA time-series forecasting with 95% confidence intervals",
    "Segment customer base using K-Means clustering"
  ]
};

export function getCopilotPrompts(roleId = "ceo", stageId = "raw") {
  const stageChips = STAGE_PROMPTS[stageId] || STAGE_PROMPTS.raw;
  const roleChips = ROLE_PROMPTS[roleId] || ROLE_PROMPTS.ceo;
  
  // Return a balanced mix of 2 stage prompts and 2 role prompts
  return [
    stageChips[0],
    roleChips[0],
    stageChips[1],
    roleChips[1]
  ].filter(Boolean);
}
