// src/utils/rbacEngine.js
// Role-Based Access Control (RBAC), Anti-Prompt-Injection & Tenant Security Engine

import { getRoleConfig } from "../config/roleConfigs";

export function authorizeRoleAction(roleId, actionKey) {
  const config = getRoleConfig(roleId);
  const allowedTools = config.allowedTools || [];

  if (roleId === "admin" || roleId === "data_analyst") {
    return { authorized: true };
  }

  const isAllowed = allowedTools.includes(actionKey);

  if (!isAllowed) {
    return {
      authorized: false,
      reason: `Action '${actionKey}' is restricted for the ${config.title || roleId} role under enterprise security policy.`
    };
  }

  return { authorized: true };
}

export function authorizeDataQuery(roleId, queryText = "") {
  const normalized = (queryText || "").toLowerCase().trim();

  // 1. Anti-Prompt Injection & Jailbreak Override Defense
  const injectionPatterns = [
    /(ignore|bypass|override|forget)\s+(my|all|role|system|security)\s+(restrictions|rules|instructions|permissions|policy)/i,
    /(act as|pretend to be|impersonate)\s+(admin|ceo|executive|root|system)/i,
    /(i'm|i am)\s+the\s+(ceo|executive|admin|boss|owner)/i,
    /(system\s+instruction\s+override|jailbreak|developer\s+mode)/i,
    /(earlier\s+you\s+showed|previously\s+granted|allow\s+me\s+to\s+see)/i
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(normalized)) {
      return {
        authorized: false,
        reason: "🔴 Security Block: Prompt injection or unauthorized privilege escalation attempt detected and blocked under enterprise security policy."
      };
    }
  }

  // 2. Confidential Payroll / Salary Access Rules
  if (/(salary|payroll|compensation|wage|remuneration|paycheck|highest-paid|earning)/i.test(normalized)) {
    const isAuthorized = ["hr", "ceo", "admin"].includes(roleId);
    if (!isAuthorized) {
      return {
        authorized: false,
        reason: "🔴 Unauthorized: You do not have permission to access restricted confidential payroll and compensation data under your active enterprise role permission policy."
      };
    }
  }

  // 3. Private Employee Details / PII Access Rules
  if (/(ssn|social_security|bank_account|routing_number|home_address|medical_record|performance_review)/i.test(normalized)) {
    const isAuthorized = ["hr", "admin"].includes(roleId);
    if (!isAuthorized) {
      return {
        authorized: false,
        reason: "🔴 Unauthorized: Access to private employee PII and confidential HR records is restricted for your active enterprise role."
      };
    }
  }

  // 4. Financial Confidential Records Access Rules
  if (/(bank_statement|tax_filing|audit_unreleased|merger_acquisition|m&a_deals)/i.test(normalized)) {
    const isAuthorized = ["finance", "ceo", "admin"].includes(roleId);
    if (!isAuthorized) {
      return {
        authorized: false,
        reason: "🔴 Unauthorized: Access to private corporate financial filings and M&A data is restricted for your active enterprise role."
      };
    }
  }

  // 5. System Audit Logs & Credentials Access Rules
  if (/(system_log|security_audit|admin_credentials|api_key|secret_token)/i.test(normalized)) {
    const isAuthorized = ["admin", "it"].includes(roleId);
    if (!isAuthorized) {
      return {
        authorized: false,
        reason: "🔴 Unauthorized: Access to system audit logs and infrastructure secrets is restricted under enterprise security policy."
      };
    }
  }

  return { authorized: true };
}

export function authorizeTenantAccess(userCompanyId, datasetCompanyId) {
  if (!userCompanyId || !datasetCompanyId) {
    return { authorized: true };
  }
  const normUserCo = String(userCompanyId).trim().toLowerCase();
  const normDataCo = String(datasetCompanyId).trim().toLowerCase();

  if (normUserCo !== normDataCo) {
    return {
      authorized: false,
      reason: "🔴 Tenant Security Block: Cross-company dataset access denied. Data isolation policy enforced."
    };
  }
  return { authorized: true };
}

export function filterAllowedNavigation(roleId, fullNavigationList = []) {
  const config = getRoleConfig(roleId);
  const allowedTools = new Set(config.allowedTools || []);

  if (roleId === "admin" || roleId === "data_analyst") {
    return fullNavigationList;
  }

  return fullNavigationList.filter(item => allowedTools.has(item.id));
}
