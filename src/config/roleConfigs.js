// src/config/roleConfigs.js
// Config matrix for AI Business Copilot ("One AI. Every Business Role.")

export const ROLE_CONFIGS = {
  ceo: {
    id: "ceo",
    title: "👔 CEO / Executive",
    shortName: "CEO / Executive",
    commandCenterTitle: "Executive Command Center",
    tagline: "High-level business outcomes, strategic growth & risk monitoring",
    terminology: "executive",
    maxVisibleKPIs: 7,
    allowedTools: [
      "overview",
      "executive_kpis",
      "executive_brief",
      "financial_health",
      "risk_analysis",
      "reports",
      "ai_copilot"
    ],
    navigation: [
      { id: "overview", label: "Executive Overview", icon: "👔" },
      { id: "performance", label: "Business Performance", icon: "📈" },
      { id: "financial_health", label: "Financial Health", icon: "💰" },
      { id: "risks", label: "Business Risks", icon: "🔴" },
      { id: "exec-reports", label: "Executive Reports", icon: "📑" },
      { id: "ai_copilot", label: "AI Executive Assistant", icon: "🤖" }
    ],
    kpiCards: [
      { title: "Revenue", value: "₹24.6M", trend: "+12.4%", status: "positive", detail: "Quarterly Target: ₹22.0M" },
      { title: "Net Profit", value: "₹5.8M", trend: "+8.6%", status: "positive", detail: "Margin: 23.5%" },
      { title: "Growth", value: "+12.4%", trend: "YoY", status: "positive", detail: "Ahead of industry benchmark" },
      { title: "Operating Expenses", value: "₹18.8M", trend: "+4.8%", status: "warning", detail: "Budget variance: +2.1%" },
      { title: "Cash Position", value: "₹9.2M", trend: "Stable", status: "neutral", detail: "6.2 months runway" },
      { title: "Customer Growth", value: "+11.0%", trend: "MoM", status: "positive", detail: "Active enterprise clients" },
      { title: "Business Risk Score", value: "Medium", trend: "South Region", status: "warning", detail: "Regional revenue variance" }
    ],
    aiBrief: {
      greeting: "Good morning. Here is your executive summary.",
      highlights: [
        { type: "positive", text: "Business performance is healthy with overall revenue up 12.4% this quarter." },
        { type: "warning", text: "Operating expenses increased by 4.8% due to marketing expansion." },
        { type: "danger", text: "The South region revenue is 8.2% below forecast target." }
      ],
      recommendedAction: "Review South region customer retention drivers and optimize marketing expenditure."
    },
    needsAttention: [
      { area: "South Region Revenue", metric: "8.2% below target", urgency: "High", action: "Review regional pipeline" },
      { area: "Operating Cost", metric: "2.1% above budget", urgency: "Medium", action: "Audit vendor expenses" }
    ],
    sampleQuestions: [
      "Why is revenue down in the South region?",
      "What needs my attention today?",
      "Compare this quarter's growth with last quarter.",
      "Where are we overspending across operations?"
    ]
  },

  hr: {
    id: "hr",
    title: "👥 HR Manager",
    shortName: "HR Manager",
    commandCenterTitle: "HR Command Center",
    tagline: "Workforce analytics, turnover monitoring & employee insights",
    terminology: "hr",
    maxVisibleKPIs: 6,
    allowedTools: [
      "overview",
      "workforce",
      "attrition",
      "recruitment",
      "absence",
      "reports",
      "ai_copilot"
    ],
    navigation: [
      { id: "overview", label: "HR Overview", icon: "👥" },
      { id: "workforce", label: "Workforce Headcount", icon: "📊" },
      { id: "attrition", label: "Turnover & Attrition", icon: "📉" },
      { id: "absence", label: "Attendance & Absence", icon: "📅" },
      { id: "exec-reports", label: "HR Reports", icon: "📄" },
      { id: "ai_copilot", label: "AI HR Assistant", icon: "🤖" }
    ],
    kpiCards: [
      { title: "Total Employees", value: "486", trend: "+14 this month", status: "positive", detail: "Active workforce" },
      { title: "Headcount Growth", value: "+3.2%", trend: "QTD", status: "positive", detail: "On track with headcount plan" },
      { title: "Attrition Rate", value: "8.4%", trend: "+1.2%", status: "warning", detail: "Industry benchmark: 7.5%" },
      { title: "Absenteeism Rate", value: "2.8%", trend: "-0.4%", status: "positive", detail: "Monthly average" },
      { title: "Open Positions", value: "42", trend: "Active", status: "neutral", detail: "Across 8 departments" },
      { title: "Average Tenure", value: "3.4 Yrs", trend: "Stable", status: "neutral", detail: "Key retention pillar" }
    ],
    aiBrief: {
      greeting: "Good morning. Here are your key workforce highlights.",
      highlights: [
        { type: "positive", text: "Total headcount expanded to 486 with 14 new hires onboarded smoothly." },
        { type: "warning", text: "Engineering department turnover increased to 11.2% this quarter." },
        { type: "danger", text: "12 exit survey responses cited compensation gap in technical roles." }
      ],
      recommendedAction: "Conduct compensation benchmarking for senior engineering roles to curb retention risk."
    },
    needsAttention: [
      { area: "Engineering Attrition", metric: "11.2% turnover", urgency: "High", action: "Review compensation benchmark" },
      { area: "Sales Absenteeism", metric: "4.1% rate", urgency: "Medium", action: "Check regional shift allocation" }
    ],
    sampleQuestions: [
      "Which department has the highest attrition?",
      "Why did employee turnover increase this quarter?",
      "Show me headcount distribution by department.",
      "Which locations have the highest absenteeism?"
    ]
  },

  recruiter: {
    id: "recruiter",
    title: "🎯 Recruiter / Talent Acquisition",
    shortName: "Recruiter",
    commandCenterTitle: "Recruitment Command Center",
    tagline: "Candidate pipeline, interview tracking & time-to-hire optimization",
    terminology: "recruiting",
    maxVisibleKPIs: 6,
    allowedTools: [
      "overview",
      "pipeline",
      "open_jobs",
      "interviews",
      "offers",
      "reports",
      "ai_copilot"
    ],
    navigation: [
      { id: "overview", label: "Recruiting Overview", icon: "🎯" },
      { id: "open_jobs", label: "Open Positions", icon: "💼" },
      { id: "pipeline", label: "Candidate Pipeline", icon: "👥" },
      { id: "interviews", label: "Interview Schedule", icon: "🗓️" },
      { id: "offers", label: "Offers & Acceptance", icon: "🤝" },
      { id: "ai_copilot", label: "AI Recruiting Assistant", icon: "🤖" }
    ],
    kpiCards: [
      { title: "Open Positions", value: "42", trend: "Active", status: "neutral", detail: "Priority hiring plan" },
      { title: "Total Candidates", value: "1,284", trend: "+140 this wk", status: "positive", detail: "Active pipeline" },
      { title: "Interviews Conducted", value: "183", trend: "This month", status: "positive", detail: "24 hiring managers" },
      { title: "Offers Extended", value: "31", trend: "82% Accepted", status: "positive", detail: "Offer acceptance rate" },
      { title: "Offer Acceptance", value: "82%", trend: "+4%", status: "positive", detail: "Target: 80%" },
      { title: "Avg Time to Hire", value: "24 Days", trend: "-2 days", status: "positive", detail: "Target: 30 days" }
    ],
    aiBrief: {
      greeting: "Good morning. Here is your talent acquisition status.",
      highlights: [
        { type: "positive", text: "Offer acceptance rate reached 82%, exceeding target expectations." },
        { type: "warning", text: "3 senior positions have been open for more than 35 days." },
        { type: "danger", text: "12 candidates have been waiting > 5 days for interview feedback." }
      ],
      recommendedAction: "Send automated feedback reminders to hiring managers for Senior Developer & HR Manager roles."
    },
    needsAttention: [
      { position: "Data Analyst", stage: "Interview", daysOpen: 42, issue: "Low candidate volume" },
      { position: "HR Manager", stage: "Offer", daysOpen: 35, issue: "Offer pending candidate decision" },
      { position: "Senior Developer", stage: "Screening", daysOpen: 29, issue: "Hiring manager feedback delay" }
    ],
    sampleQuestions: [
      "Which positions are taking the longest to fill?",
      "Which candidates are stuck in the interview stage?",
      "Which recruitment source produces the most hires?",
      "Which jobs are at risk of missing hiring deadlines?",
      "Show me employee salaries and payroll data"
    ]
  },

  finance: {
    id: "finance",
    title: "💰 Finance",
    shortName: "Finance",
    commandCenterTitle: "Finance Command Center",
    tagline: "Financial performance, cash flow monitoring & budget variance",
    terminology: "finance",
    maxVisibleKPIs: 6,
    allowedTools: [
      "overview",
      "financial_kpis",
      "budget_variance",
      "anomalies",
      "forecast",
      "reports",
      "ai_copilot"
    ],
    navigation: [
      { id: "overview", label: "Financial Overview", icon: "💰" },
      { id: "revenue_expenses", label: "Revenue vs Expenses", icon: "📊" },
      { id: "profitability", label: "Profitability & Margins", icon: "📈" },
      { id: "budget_variance", label: "Budget Variance", icon: "📋" },
      { id: "anomalies", label: "Expense Anomalies", icon: "⚠️" },
      { id: "ai_copilot", label: "AI Finance Assistant", icon: "🤖" }
    ],
    kpiCards: [
      { title: "Total Revenue", value: "₹24.6M", trend: "+12.4%", status: "positive", detail: "QTD Actual" },
      { title: "Operating Expenses", value: "₹18.8M", trend: "+4.8%", status: "warning", detail: "Budget: ₹18.4M" },
      { title: "Gross Profit", value: "₹10.2M", trend: "41.5% Margin", status: "positive", detail: "Gross Margin %" },
      { title: "Net Profit", value: "₹5.8M", trend: "+8.6%", status: "positive", detail: "Net Margin: 23.5%" },
      { title: "Cash Balance", value: "₹9.2M", trend: "Healthy", status: "positive", detail: "Liquidity reserve" },
      { title: "Budget Variance", value: "+₹400K", trend: "2.1% Over", status: "warning", detail: "Driven by marketing" }
    ],
    aiBrief: {
      greeting: "Good morning. Here is your financial summary.",
      highlights: [
        { type: "positive", text: "Net profit margin stands strong at 23.5% with ₹5.8M net earnings." },
        { type: "warning", text: "Marketing expenses exceeded quarterly budget allocation by 14%." },
        { type: "danger", text: "Unusual vendor transaction detected: ₹185,000 unbudgeted software license." }
      ],
      recommendedAction: "Review marketing spending allocations and audit unbudgeted vendor payments."
    },
    needsAttention: [
      { category: "Marketing Spend", metric: "14% above budget", urgency: "High", action: "Review campaign ROI" },
      { category: "Software Licenses", metric: "Unusual transaction ₹185K", urgency: "High", action: "Audit invoice approval" }
    ],
    sampleQuestions: [
      "Where are we overspending this month?",
      "Why did operating expenses increase?",
      "Forecast revenue for the next 3 months.",
      "Compare actual spending vs budget by department."
    ]
  },

  data_analyst: {
    id: "data_analyst",
    title: "📊 Data Analyst",
    shortName: "Data Analyst Studio",
    commandCenterTitle: "Data Analyst Studio",
    tagline: "Full BI suite: EDA, SQL query generator, custom formulas & ML predictive modeling",
    terminology: "analytics",
    maxVisibleKPIs: 8,
    allowedTools: [
      "dashboard",
      "datasets",
      "cleaning",
      "eda",
      "stats",
      "sql",
      "dashboards",
      "health",
      "whatif",
      "forecast",
      "ml",
      "exec-reports",
      "alerts",
      "ai-analyst"
    ],
    navigation: [
      { id: "dashboard", label: "Workspace Threads", icon: "🏠" },
      { id: "datasets", label: "My Datasets", icon: "📁" },
      { id: "ai-analyst", label: "AI Copilot Chat", icon: "🤖" },
      { id: "dashboards", label: "BI Dashboards", icon: "📊" },
      { id: "health", label: "Data Health Inspector", icon: "🛡️" },
      { id: "whatif", label: "What-If Simulator", icon: "🏠" },
      { id: "exec-reports", label: "Executive Reports", icon: "📑" },
      { id: "alerts", label: "Threshold Alerts", icon: "🔔" }
    ],
    kpiCards: [
      { title: "Ingested Rows", value: "128,450", trend: "+12K this wk", status: "positive", detail: "Active dataset rows" },
      { title: "Data Quality Score", value: "98.4%", trend: "High", status: "positive", detail: "Calculated null & anomaly score" },
      { title: "BI Dashboards", value: "18", trend: "Active", status: "positive", detail: "Saved visual canvases" },
      { title: "ML Models Trained", value: "6", trend: "Auto-tuned", status: "positive", detail: "Random Forest & XGBoost" }
    ],
    aiBrief: {
      greeting: "Data Analyst Studio active. All analytical, SQL, and predictive tools enabled.",
      highlights: [
        { type: "positive", text: "Dataset health verified at 98.4% quality index." },
        { type: "positive", text: "SQL Query Engine and ARIMA forecasting ready for execution." }
      ],
      recommendedAction: "Select any dataset or run EDA to inspect distributions and statistical correlations."
    },
    needsAttention: [],
    sampleQuestions: [
      "Calculate correlation between sales and quantity.",
      "Run time-series forecast for the next 6 months.",
      "Show data quality score and missing values distribution.",
      "Generate an SQL query to group revenue by customer cohort."
    ]
  },

  // Future Extensible Roles Matrix
  data_scientist: {
    id: "data_scientist",
    title: "🤖 Data Scientist",
    shortName: "Data Scientist",
    commandCenterTitle: "Data Science Studio",
    tagline: "Feature engineering, ML modeling, clustering & time-series forecasting",
    terminology: "ml",
    allowedTools: ["overview", "datasets", "ml", "forecast", "stats", "ai_copilot"]
  },
  sales: {
    id: "sales",
    title: "📈 Sales",
    shortName: "Sales",
    commandCenterTitle: "Sales Command Center",
    tagline: "Pipeline velocity, product performance & regional sales forecasts",
    terminology: "sales",
    allowedTools: ["overview", "pipeline", "performance", "forecast", "ai_copilot"]
  },
  marketing: {
    id: "marketing",
    title: "📣 Marketing",
    shortName: "Marketing",
    commandCenterTitle: "Marketing Command Center",
    tagline: "Campaign ROI, lead acquisition channels & conversion performance",
    terminology: "marketing",
    allowedTools: ["overview", "campaigns", "roi", "leads", "ai_copilot"]
  },
  operations: {
    id: "operations",
    title: "⚙️ Operations",
    shortName: "Operations",
    commandCenterTitle: "Operations Command Center",
    tagline: "Process bottlenecks, defect tracking & inventory optimization",
    terminology: "operations",
    allowedTools: ["overview", "process", "inventory", "bottlenecks", "ai_copilot"]
  },
  it: {
    id: "it",
    title: "💻 IT / Technology",
    shortName: "IT / Tech",
    commandCenterTitle: "IT Command Center",
    tagline: "System uptime, incident resolution & infrastructure security",
    terminology: "it",
    allowedTools: ["overview", "incidents", "uptime", "security", "ai_copilot"]
  },
  supply_chain: {
    id: "supply_chain",
    title: "🚚 Supply Chain",
    shortName: "Supply Chain",
    commandCenterTitle: "Supply Chain Command Center",
    tagline: "Logistics tracking, supplier performance & delivery fulfillment",
    terminology: "supply_chain",
    allowedTools: ["overview", "logistics", "suppliers", "fulfillment", "ai_copilot"]
  },
  admin: {
    id: "admin",
    title: "🛡️ Administrator",
    shortName: "Administrator",
    commandCenterTitle: "Admin Control Center",
    tagline: "System configuration, user management & security policy audit",
    terminology: "admin",
    allowedTools: ["overview", "users", "security", "settings", "audit_logs"]
  }
};

export const DEFAULT_ROLE = "ceo";

export function getRoleConfig(roleId) {
  return ROLE_CONFIGS[roleId] || ROLE_CONFIGS[DEFAULT_ROLE];
}

export function getRolePermissions(roleId) {
  const cfg = getRoleConfig(roleId);
  return {
    role: cfg.id,
    allowedTools: cfg.allowedTools || [],
    isTechnical: ["data_analyst", "data_scientist"].includes(cfg.id),
    maxKPIs: cfg.maxVisibleKPIs || 6
  };
}
