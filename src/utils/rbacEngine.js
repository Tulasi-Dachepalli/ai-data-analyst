// src/utils/rbacEngine.js
// Role-Based Access Control (RBAC) Security & Authorization Engine

import { getRoleConfig } from "../config/roleConfigs";

export function authorizeRoleAction(roleId, actionKey) {
  const config = getRoleConfig(roleId);
  const allowedTools = config.allowedTools || [];

  // Admin and Data Analyst have full action access
  if (roleId === "admin" || roleId === "data_analyst") {
    return { authorized: true };
  }

  // Check if actionKey is within allowed tools
  const isAllowed = allowedTools.includes(actionKey);

  if (!isAllowed) {
    return {
      authorized: false,
      reason: `Action '${actionKey}' is restricted for the ${config.title || roleId} role under enterprise security policy.`
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

export function canAccessSensitiveData(roleId, dataType) {
  // Sensitive payroll, compensation, and raw security logs require explicit role authorization
  if (dataType === "payroll" || dataType === "compensation") {
    return ["hr", "ceo", "admin"].includes(roleId);
  }
  if (dataType === "security_audit") {
    return ["admin", "it"].includes(roleId);
  }
  return true;
}
