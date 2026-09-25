// src/context/RoleContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { ROLE_CONFIGS, getRoleConfig } from "../config/roleConfigs";

const RoleContext = createContext(null);

const DEFAULT_USER = {
  email: "demo.executive@enterprise.com",
  role: "ceo",
  companyName: "Acme Enterprise",
  tier: "pro"
};

export function RoleProvider({ children, initialUser = DEFAULT_USER }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("aida_user");
      if (raw && raw !== "undefined" && raw !== "null") {
        const u = JSON.parse(raw);
        if (u && u.role) return u;
      }
    } catch (e) {
      console.warn("RoleContext parse error:", e);
    }
    return initialUser;
  });

  const activeRole = user?.role || "ceo";
  const roleConfig = getRoleConfig(activeRole);

  const setRole = (newRole) => {
    if (!ROLE_CONFIGS[newRole]) return;
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem("aida_user", JSON.stringify(updatedUser));
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("aida_user", JSON.stringify(updatedUser));
  };

  return (
    <RoleContext.Provider value={{
      user,
      activeRole,
      roleConfig,
      setRole,
      updateUser
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
