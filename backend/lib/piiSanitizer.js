// backend/lib/piiSanitizer.js
// Server-side PII and restricted field scrubbing engine
// Guarantees restricted patterns and sensitive fields are scrubbed BEFORE requests leave for external AI providers.

const PATTERNS = {
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  PHONE: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
};

/**
 * Sanitizes prompt text by stripping high-risk PII patterns and user-specified restricted fields.
 * @param {string} text - Raw input prompt or system prompt
 * @param {string[]} restrictedFields - Optional list of column or field names to purge
 * @returns {{ sanitizedText: string, redactedCount: number }}
 */
export function sanitizePromptText(text, restrictedFields = []) {
  if (typeof text !== "string" || !text) {
    return { sanitizedText: text || "", redactedCount: 0 };
  }

  let sanitized = text;
  let count = 0;

  // 1. Scrub Credit Cards
  sanitized = sanitized.replace(PATTERNS.CREDIT_CARD, (match) => {
    // Only redact if string contains at least 13 digits
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 13 && digits.length <= 16) {
      count++;
      return "[REDACTED_CREDIT_CARD]";
    }
    return match;
  });

  // 2. Scrub SSNs / National IDs
  sanitized = sanitized.replace(PATTERNS.SSN, () => {
    count++;
    return "[REDACTED_GOV_ID]";
  });

  // 3. Scrub Emails
  sanitized = sanitized.replace(PATTERNS.EMAIL, () => {
    count++;
    return "[REDACTED_EMAIL]";
  });

  // 4. Scrub Phone Numbers
  sanitized = sanitized.replace(PATTERNS.PHONE, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) {
      count++;
      return "[REDACTED_PHONE]";
    }
    return match;
  });

  // 5. Purge any explicitly restricted fields (e.g. salary, compensation, confidential columns)
  if (Array.isArray(restrictedFields) && restrictedFields.length > 0) {
    for (const field of restrictedFields) {
      if (!field || typeof field !== "string") continue;
      const escaped = field.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!escaped) continue;

      // Match field: "value" or field = value or "field": value in JSON / prompt strings
      const jsonFieldRegex = new RegExp(`(["']?${escaped}["']?\\s*:\\s*)(["'][^"']*["']|[0-9.]+|true|false|null)`, "gi");
      sanitized = sanitized.replace(jsonFieldRegex, () => {
        count++;
        return `"${field}": "[RESTRICTED_FIELD_EXCLUDED]"`;
      });

      // Match tabular header/column occurrences
      const colRegex = new RegExp(`\\b${escaped}\\b`, "gi");
      sanitized = sanitized.replace(colRegex, () => {
        count++;
        return `[RESTRICTED_${escaped.toUpperCase()}]`;
      });
    }
  }

  return { sanitizedText: sanitized, redactedCount: count };
}
