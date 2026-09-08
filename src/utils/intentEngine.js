// src/utils/intentEngine.js
// Business Intent Detection & Domain Action Parser

const INTENT_PATTERNS = [
  {
    intent: "hiring_bottleneck",
    role: "recruiter",
    patterns: [/jobs? need attention/i, /longest to fill/i, /hiring delay/i, /interview bottleneck/i, /stuck in/i],
    requiredDomain: "recruitment",
    suggestedAction: "Identify candidate delays and prompt hiring manager feedback."
  },
  {
    intent: "budget_variance",
    role: "finance",
    patterns: [/overspend/i, /budget/i, /expenses? increase/i, /cost variance/i, /unusual transaction/i],
    requiredDomain: "finance",
    suggestedAction: "Audit department expense lines against target allocations."
  },
  {
    intent: "attrition_risk",
    role: "hr",
    patterns: [/attrition/i, /turnover/i, /leaving/i, /depart/i, /absenteeism/i, /headcount/i],
    requiredDomain: "attrition",
    suggestedAction: "Evaluate department turnover rates and compensation benchmark gaps."
  },
  {
    intent: "revenue_variance",
    role: "ceo",
    patterns: [/revenue/i, /profit/i, /growth/i, /south region/i, /performance/i, /quarter/i],
    requiredDomain: "finance",
    suggestedAction: "Review regional sales pipeline and customer retention drivers."
  }
];

export function detectBusinessIntent(queryText = "", activeRole = "ceo") {
  const normalizedQuery = queryText.toLowerCase();

  for (const item of INTENT_PATTERNS) {
    if (item.patterns.some(pattern => pattern.test(normalizedQuery))) {
      return {
        detected: true,
        intent: item.intent,
        domain: item.requiredDomain,
        suggestedAction: item.suggestedAction
      };
    }
  }

  return {
    detected: false,
    intent: "general_analysis",
    domain: null,
    suggestedAction: "Analyze dataset distributions and trends."
  };
}
