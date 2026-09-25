// src/components/role-home/FinanceHome.jsx
import React from "react";
import FinanceCommandCenter from "../workspaces/FinanceCommandCenter";

export default function FinanceHome({ onAskQuestion }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <FinanceCommandCenter onAskQuestion={onAskQuestion} />
    </div>
  );
}
