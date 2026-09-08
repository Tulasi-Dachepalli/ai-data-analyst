// src/utils/dataAvailabilityEngine.js
// Data Availability Protection Engine (Anti-Hallucination Guard)

const DOMAIN_FIELD_PATTERNS = {
  payroll: [/salary/i, /payroll/i, /compensation/i, /wage/i, /pay/i, /remuneration/i],
  attrition: [/attrition/i, /turnover/i, /exit/i, /resignation/i, /churn_date/i, /separation/i],
  recruitment: [/candidate/i, /applicant/i, /job_id/i, /position/i, /hire_date/i, /stage/i, /time_to_hire/i],
  finance: [/revenue/i, /expense/i, /cost/i, /profit/i, /budget/i, /margin/i, /cash/i],
  sales: [/sales/i, /deals/i, /quota/i, /region/i, /customer/i, /order/i]
};

export function checkDataAvailability(rows = [], columns = [], requiredDomain = null) {
  if (!rows || rows.length === 0 || !columns || columns.length === 0) {
    return {
      isAvailable: false,
      missingReason: "No active dataset is currently loaded. Please upload or select a business dataset to evaluate this metric."
    };
  }

  if (!requiredDomain || !DOMAIN_FIELD_PATTERNS[requiredDomain]) {
    return { isAvailable: true };
  }

  const patterns = DOMAIN_FIELD_PATTERNS[requiredDomain];
  const matchingCol = columns.find(col => patterns.some(p => p.test(col)));

  if (!matchingCol) {
    const domainNames = {
      payroll: "payroll or salary",
      attrition: "employee attrition or turnover history",
      recruitment: "candidate pipeline or job tracking",
      finance: "financial revenue, expense, or budget",
      sales: "sales performance or deal pipeline"
    };

    return {
      isAvailable: false,
      missingReason: `I cannot answer that from the current data. The dataset does not contain a ${domainNames[requiredDomain] || requiredDomain} field. Please connect or upload a dataset containing these fields.`
    };
  }

  return { isAvailable: true, matchingColumn: matchingCol };
}
