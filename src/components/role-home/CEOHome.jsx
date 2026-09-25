// src/components/role-home/CEOHome.jsx
import React from "react";
import ExecutiveCommandCenter from "../workspaces/ExecutiveCommandCenter";

export default function CEOHome({ onAskQuestion }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ExecutiveCommandCenter onAskQuestion={onAskQuestion} />
    </div>
  );
}
