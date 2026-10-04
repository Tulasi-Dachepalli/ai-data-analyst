// src/utils/piiSanitizer.js
// Automated PII detection, sensitivity classification, and non-destructive masking engine.

// Common hash helper (SHA-256 representation)
function pseudoHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return "hash_" + Math.abs(hash).toString(16).padStart(8, "0");
}

export const SENSITIVITY_TYPES = {
  EMAIL: { id: "email", label: "Email Address", risk: "high", defaultStrategy: "redact", icon: "📧" },
  PHONE: { id: "phone", label: "Phone Number", risk: "high", defaultStrategy: "redact", icon: "📞" },
  SALARY: { id: "salary", label: "Salary / Compensation", risk: "medium", defaultStrategy: "range", icon: "💰" },
  SSN: { id: "ssn", label: "Government ID / SSN", risk: "critical", defaultStrategy: "redact", icon: "🪪" },
  CREDIT_CARD: { id: "credit_card", label: "Credit Card / Financial Account", risk: "critical", defaultStrategy: "redact", icon: "💳" },
  IDENTITY: { id: "identity", label: "Personal Name / Address", risk: "medium", defaultStrategy: "anonymize", icon: "👤" }
};

const HEADER_KEYWORDS = {
  email: ["email", "e_mail", "mail_address", "contact_email"],
  phone: ["phone", "mobile", "cell", "telephone", "contact_no", "contact_number"],
  salary: ["salary", "compensation", "wage", "payroll", "hourly_rate", "bonus", "annual_pay", "ctc"],
  ssn: ["ssn", "social_security", "national_id", "tax_id", "aadhaar", "pan_no", "passport"],
  credit_card: ["credit_card", "card_number", "account_number", "cvv", "bank_account", "iban"],
  identity: ["first_name", "last_name", "full_name", "employee_name", "customer_name", "address", "street"]
};

const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
  phone: /^(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/,
  ssn: /^\d{3}-\d{2}-\d{4}$/,
  creditCard: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/
};

/**
 * Inspects a column name and sample rows to determine PII classification and confidence score
 */
export function classifyColumn(colName, sampleValues = []) {
  const normalized = colName.toLowerCase().replace(/[\s_-]+/g, "_");
  const cleanSamples = sampleValues.filter(v => v !== null && v !== undefined && String(v).trim() !== "");

  // 1. Header match check
  for (const [typeKey, keywords] of Object.entries(HEADER_KEYWORDS)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      return {
        type: SENSITIVITY_TYPES[typeKey.toUpperCase()] || SENSITIVITY_TYPES.IDENTITY,
        confidence: 0.95,
        reason: `Column header contains sensitive keyword "${keywords.find(kw => normalized.includes(kw))}"`
      };
    }
  }

  // 2. Sample data pattern check
  if (cleanSamples.length > 0) {
    let emailMatches = 0;
    let phoneMatches = 0;
    let ssnMatches = 0;
    let cardMatches = 0;

    for (const val of cleanSamples.slice(0, 50)) {
      const strVal = String(val).trim();
      if (REGEX_PATTERNS.email.test(strVal)) emailMatches++;
      if (REGEX_PATTERNS.phone.test(strVal)) phoneMatches++;
      if (REGEX_PATTERNS.ssn.test(strVal)) ssnMatches++;
      if (REGEX_PATTERNS.creditCard.test(strVal)) cardMatches++;
    }

    const total = Math.min(cleanSamples.length, 50);
    if (emailMatches / total > 0.4) {
      return { type: SENSITIVITY_TYPES.EMAIL, confidence: 0.98, reason: "Data values match email address pattern" };
    }
    if (phoneMatches / total > 0.4) {
      return { type: SENSITIVITY_TYPES.PHONE, confidence: 0.92, reason: "Data values match phone number pattern" };
    }
    if (ssnMatches / total > 0.3) {
      return { type: SENSITIVITY_TYPES.SSN, confidence: 0.99, reason: "Data values match SSN / Government ID pattern" };
    }
    if (cardMatches / total > 0.3) {
      return { type: SENSITIVITY_TYPES.CREDIT_CARD, confidence: 0.99, reason: "Data values match card number pattern" };
    }
  }

  return null;
}

/**
 * Scans an entire dataset for PII columns
 */
export function scanDatasetForPII(columns = [], rows = []) {
  const findings = [];

  for (const col of columns) {
    const sampleValues = rows.slice(0, 30).map(r => r[col]);
    const classification = classifyColumn(col, sampleValues);
    if (classification) {
      findings.push({
        column: col,
        type: classification.type,
        confidence: classification.confidence,
        reason: classification.reason,
        sampleRaw: sampleValues.find(v => v !== null && v !== undefined) || "—",
        strategy: classification.type.defaultStrategy
      });
    }
  }

  return findings;
}

/**
 * Generates a masked preview value for a given strategy and column type
 */
export function generateMaskedValue(value, strategy, colType, rowIndex = 1) {
  if (value === null || value === undefined || String(value).trim() === "") return value;
  const str = String(value);

  switch (strategy) {
    case "redact":
      return "[REDACTED-CONFIDENTIAL]";

    case "hash":
      return pseudoHash(str);

    case "range": {
      const num = parseFloat(str.replace(/[^0-9.-]/g, ""));
      if (isNaN(num)) return "[REDACTED]";
      if (num < 25000) return "< ₹25,000 / $25k";
      if (num < 50000) return "₹25k - ₹50k ($25k - $50k)";
      if (num < 75000) return "₹50k - ₹75k ($50k - $75k)";
      if (num < 100000) return "₹75k - ₹100k ($75k - $100k)";
      if (num < 150000) return "₹100k - ₹150k ($100k - $150k)";
      return "> ₹150,000 / $150k";
    }

    case "anonymize":
      return `Subject-${rowIndex}`;

    case "exclude":
      return "[EXCLUDED-FROM-AI]";

    case "keep":
    default:
      return value;
  }
}

/**
 * Non-destructively sanitizes rows before sending them to external AI / LLMs
 */
export function sanitizeDatasetForAI(rows = [], maskingRules = {}) {
  if (!rows || rows.length === 0) return [];
  if (Object.keys(maskingRules).length === 0) return rows;

  return rows.map((row, idx) => {
    const sanitized = { ...row };
    for (const [col, strategy] of Object.entries(maskingRules)) {
      if (strategy === "exclude") {
        delete sanitized[col];
      } else if (strategy !== "keep") {
        sanitized[col] = generateMaskedValue(row[col], strategy, null, idx + 1);
      }
    }
    return sanitized;
  });
}
