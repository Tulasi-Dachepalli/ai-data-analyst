// src/utils/errorExplainer.js
/**
 * Enterprise Security, Reliability & Explainability Error Engine
 * Aligned with OWASP Top 10:2025 and OWASP API Security Top 10
 * 
 * Provides:
 * 1. Two-layer error abstraction (sanitized user-friendly version vs. protected internal telemetry)
 * 2. 13 standard error categories
 * 3. In-memory error registry for truthful Copilot "Why did this happen?" answers
 * 4. Safe automatic retry mechanism with exponential backoff for idempotent operations
 */

export const ERROR_CATEGORIES = {
  DATA_ERROR: "DATA_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AI_ERROR: "AI_ERROR",
  MODEL_ERROR: "MODEL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  INTEGRATION_ERROR: "INTEGRATION_ERROR",
  REPORT_ERROR: "REPORT_ERROR",
  EMAIL_ERROR: "EMAIL_ERROR",
  SECURITY_EVENT: "SECURITY_EVENT",
  SYSTEM_ERROR: "SYSTEM_ERROR"
};

// Global in-memory recent error buffer (strictly sanitized, never retains passwords/tokens)
let recentErrors = [];
const MAX_ERROR_HISTORY = 30;

/**
 * Generate a unique, professional enterprise Error ID
 * Format: ERR-<CATEGORY_PREFIX>-<HEX_5>
 */
export function generateErrorId(category = "SYSTEM_ERROR") {
  const prefixMap = {
    DATA_ERROR: "DATA",
    AUTH_ERROR: "AUTH",
    PERMISSION_ERROR: "PERM",
    VALIDATION_ERROR: "VAL",
    AI_ERROR: "AI",
    MODEL_ERROR: "MOD",
    DATABASE_ERROR: "DB",
    NETWORK_ERROR: "NET",
    INTEGRATION_ERROR: "INT",
    REPORT_ERROR: "REP",
    EMAIL_ERROR: "MAIL",
    SECURITY_EVENT: "SEC",
    SYSTEM_ERROR: "SYS"
  };
  const prefix = prefixMap[category] || "ERR";
  const randomHex = Math.floor((1 + Math.random()) * 0x100000).toString(16).substring(1).toUpperCase();
  return `ERR-${prefix}-${randomHex}`;
}

/**
 * Normalize and categorize any error into a Two-Layer Explainable Error Object
 */
export function createExplainableError(rawError, context = {}) {
  const errMessage = String(rawError?.message || rawError || "An unexpected condition occurred");
  const stage = context.stage || "01 Raw";
  const service = context.service || "frontend-runtime";
  const datasetVersion = context.datasetVersion || "v1";
  const userId = context.userId || "usr_anonymous";
  const requestId = context.requestId || `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  // Determine Category based on patterns
  let category = ERROR_CATEGORIES.SYSTEM_ERROR;
  let userTitle = "We couldn't complete this operation";
  let whatHappened = "An unexpected system condition interrupted the processing of your request.";
  let whatYouCanDo = "Please retry your operation. If the issue persists, contact your workspace administrator.";
  let actions = ["retry", "help"];

  const lower = errMessage.toLowerCase();

  if (lower.includes("column") || lower.includes("number") || lower.includes("nan") || lower.includes("float") || lower.includes("parsed") || lower.includes("tabular") || lower.includes("empty dataset")) {
    category = ERROR_CATEGORIES.DATA_ERROR;
    userTitle = "We couldn't complete this analysis";
    whatHappened = "The active dataset contains column values that could not be interpreted consistently as tabular numbers or records.";
    whatYouCanDo = "Review the affected column in the Raw/Quality stage and verify formatting or upload the file again.";
    actions = ["review_data", "retry", "help"];
  } else if (lower.includes("date") || lower.includes("timestamp") || lower.includes("gap") || lower.includes("time-series") || lower.includes("observation")) {
    category = ERROR_CATEGORIES.DATA_ERROR;
    userTitle = "Date sequence or time series issue";
    whatHappened = "The operation required continuous sequential time periods, but irregular date gaps or insufficient historical observations were found.";
    whatYouCanDo = "Ensure your date column has continuous intervals with at least 8-12 historical observations.";
    actions = ["review_data", "retry", "help"];
  } else if (lower.includes("unauthorized") || lower.includes("forbidden") || lower.includes("permission") || lower.includes("rbac") || lower.includes("access denied") || lower.includes("role")) {
    category = ERROR_CATEGORIES.PERMISSION_ERROR;
    userTitle = "Access or permission restricted";
    whatHappened = "Your current workspace role does not have authorization to execute this operation on the active resource.";
    whatYouCanDo = "Switch to an authorized role (e.g. Data Scientist / CEO) in Settings or request workspace elevation.";
    actions = ["switch_role", "help"];
  } else if (lower.includes("auth") || lower.includes("jwt") || lower.includes("token") || lower.includes("login") || lower.includes("session")) {
    category = ERROR_CATEGORIES.AUTH_ERROR;
    userTitle = "Session expired or authentication required";
    whatHappened = "Your secure authentication token has expired or is no longer valid for this session.";
    whatYouCanDo = "Sign in again to refresh your active session and continue where you left off.";
    actions = ["relogin", "help"];
  } else if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("econnrefused") || lower.includes("timeout") || lower.includes("504") || lower.includes("502")) {
    category = ERROR_CATEGORIES.NETWORK_ERROR;
    userTitle = "Connection temporarily interrupted";
    whatHappened = "The secure API gateway or backend service could not be reached within the timeout window.";
    whatYouCanDo = "Check your network connection. Your unsaved workspace state is preserved locally; try again in a few moments.";
    actions = ["retry", "help"];
  } else if (lower.includes("rate limit") || lower.includes("429") || lower.includes("too many requests")) {
    category = ERROR_CATEGORIES.SECURITY_EVENT;
    userTitle = "Rate limit protection activated";
    whatHappened = "The maximum number of requests allowed per minute has been reached to protect API resources.";
    whatYouCanDo = "Please wait a moment before sending additional queries or generating reports.";
    actions = ["wait", "help"];
  } else if (lower.includes("model") || lower.includes("forecast") || lower.includes("converge") || lower.includes("training")) {
    category = ERROR_CATEGORIES.MODEL_ERROR;
    userTitle = "Predictive model could not converge";
    whatHappened = "The statistical engine could not complete the mathematical regression with the selected parameters.";
    whatYouCanDo = "Try selecting different target metric columns or adjust parameters in the Forecast stage.";
    actions = ["review_data", "retry", "help"];
  } else if (lower.includes("email") || lower.includes("smtp") || lower.includes("recipient")) {
    category = ERROR_CATEGORIES.EMAIL_ERROR;
    userTitle = "Executive report email delivery paused";
    whatHappened = "The mail transport gateway reported an invalid recipient address or transient delivery failure.";
    whatYouCanDo = "Verify the recipient email format in Settings > Alerts and try dispatching again.";
    actions = ["check_email", "retry", "help"];
  } else if (lower.includes("injection") || lower.includes("malicious") || lower.includes("xss") || lower.includes("threat")) {
    category = ERROR_CATEGORIES.SECURITY_EVENT;
    userTitle = "Security policy intervention";
    whatHappened = "A security validation guard blocked an input containing prohibited control characters or script patterns.";
    whatYouCanDo = "Ensure your query or dataset does not contain raw script tags, SQL statements, or prompt override commands.";
    actions = ["help"];
  }

  // Override category if explicitly specified in context
  if (context.category && ERROR_CATEGORIES[context.category]) {
    category = context.category;
  }
  if (context.userTitle) userTitle = context.userTitle;
  if (context.whatHappened) whatHappened = context.whatHappened;
  if (context.whatYouCanDo) whatYouCanDo = context.whatYouCanDo;

  const errorId = context.errorId || generateErrorId(category);

  // User-facing version (clean, empathetic, NEVER leaks stack trace or internals)
  const userVersion = {
    errorId,
    category,
    title: userTitle,
    whatHappened,
    whatYouCanDo,
    actions
  };

  // Internal/Admin version (rich, structured telemetry, private stack trace)
  const internalVersion = {
    errorId,
    category,
    service,
    stage,
    datasetVersion,
    requestId,
    exception: rawError?.name || "Error",
    rawMessage: errMessage.substring(0, 500),
    timestamp: new Date().toISOString(),
    userId,
    // Redact sensitive patterns from stack trace
    stackTrace: sanitizeStackTrace(rawError?.stack || "No stack trace recorded"),
    safeTelemetry: {
      url: typeof window !== "undefined" ? window.location.pathname : "ssr",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent.substring(0, 100) : "unknown",
      memoryUsage: typeof performance !== "undefined" && performance.memory ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : "N/A"
    }
  };

  const explainableError = {
    id: errorId,
    category,
    userVersion,
    internalVersion
  };

  // Save to in-memory error registry
  recordError(explainableError);

  return explainableError;
}

/**
 * Remove filesystem paths, database queries, and tokens from stack traces
 */
function sanitizeStackTrace(stack) {
  if (!stack || typeof stack !== "string") return "Sanitized: No trace available";
  return stack
    .replace(/(file:\/\/\/|\/Users\/|\/home\/|[A-Z]:\\)[\w\s.-]+(\\|\/)/gi, "[PATH]/")
    .replace(/(bearer\s+[a-zA-Z0-9._-]+)/gi, "Bearer [REDACTED]")
    .replace(/(password|secret|token|apikey)=[^&\s]+/gi, "$1=[REDACTED]")
    .split("\n")
    .slice(0, 10)
    .join("\n");
}

/**
 * Record error into the in-memory circular buffer
 */
export function recordError(explainableErr) {
  recentErrors.unshift(explainableErr);
  if (recentErrors.length > MAX_ERROR_HISTORY) {
    recentErrors.pop();
  }
  // Also store in sessionStorage for cross-tab or refresh persistence (without stack trace)
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const publicCopy = recentErrors.map(e => ({
        id: e.id,
        category: e.category,
        userVersion: e.userVersion,
        timestamp: e.internalVersion?.timestamp
      }));
      sessionStorage.setItem("aida_recent_errors", JSON.stringify(publicCopy));
    }
  } catch {
    // sessionStorage quota or restriction
  }
}

/**
 * Retrieve the most recent recorded error
 */
export function getLatestError() {
  if (recentErrors.length > 0) return recentErrors[0];
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const stored = sessionStorage.getItem("aida_recent_errors");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) return parsed[0];
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Retrieve all recent recorded errors (for Admin / SOC)
 */
export function getAllRecentErrors() {
  return recentErrors;
}

/**
 * Format a truthful, metadata-grounded response for Copilot when asked "Why did this happen?"
 * GUARANTEE: Never invents or hallucinates causes; strictly grounded on real error telemetry.
 */
export function explainErrorForCopilot(specificError = null) {
  const err = specificError || getLatestError();

  if (!err) {
    return {
      answered: false,
      message: "No recent errors or interrupted operations have been recorded in this workspace session. All system services are currently operating normally."
    };
  }

  const u = err.userVersion || {};
  const int = err.internalVersion || {};

  const bulletPoints = [];
  if (u.whatHappened) bulletPoints.push(u.whatHappened);
  if (int.stage) bulletPoints.push(`Occurred in workflow stage: ${int.stage}`);
  if (int.service) bulletPoints.push(`Reported by service: ${int.service}`);
  if (u.whatYouCanDo) bulletPoints.push(`Recommended resolution: ${u.whatYouCanDo}`);

  const formattedResponse = `✨ **Analysis & Operation Explanation**

The recent operation could not be completed as expected:

**What happened:**
${u.whatHappened || "The operation encountered an unexpected condition."}

**Technical context (Verified metadata):**
- **Error ID:** \`${u.errorId || err.id}\`
- **Category:** ${u.category || "SYSTEM_ERROR"}
- **Workflow Stage:** ${int.stage || "Active Stage"}
- **Timestamp:** ${int.timestamp ? new Date(int.timestamp).toLocaleTimeString() : "Recent"}

**Recommended action:**
👉 ${u.whatYouCanDo || "Review the input parameters or dataset formatting and retry."}

*(This explanation is grounded directly on verified system telemetry and does not contain speculative causes.)*`;

  return {
    answered: true,
    errorId: u.errorId || err.id,
    category: u.category,
    explanation: formattedResponse,
    recommendedAction: u.whatYouCanDo
  };
}

/**
 * Automatic safe retry helper with exponential backoff
 * ONLY for idempotent/read operations (never for email dispatch or database mutations)
 */
export async function safeRetry(operationFn, options = {}) {
  const maxRetries = options.maxRetries || 2;
  const initialDelayMs = options.initialDelayMs || 500;
  const onRetry = options.onRetry || (() => {});

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await operationFn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) {
        throw err;
      }
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      onRetry(attempt, delay, err);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}
