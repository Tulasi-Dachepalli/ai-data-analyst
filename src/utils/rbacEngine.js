// src/utils/rbacEngine.js
// Role-Based Access Control (RBAC) Security & Authorization Engine

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
  const normalized = queryText.toLowerCase();

  // Confidential payroll/salary access restricted to HR, CEO, and Admin
  if (/(salary|payroll|compensation|wage|remuneration)/i.test(normalized)) {
    const isAuthorized = ["hr", "ceo", "admin"].includes(roleId);
    if (!isAuthorized) {
      return {
        authorized: false,
        reason: "🔴 Unauthorized: You do not have permission to access restricted confidential payroll and compensation data under your active enterprise role permission policy."
      };
    }
  }

  // Security audit log access restricted to Admin and IT
  if (/(system_log|security_audit|admin_credentials)/i.test(normalized)) {
    const isAuthorized = ["admin", "it"].includes(roleId);
    if (!isAuthorized) {
      return {
        authorized: false,
        reason: "🔴 Unauthorized: You do not have permission to access restricted system audit logs under your active enterprise role permission policy."
      };
    }
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
