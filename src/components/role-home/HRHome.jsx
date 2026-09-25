// src/components/role-home/HRHome.jsx
import React from "react";
import HrCommandCenter from "../workspaces/HrCommandCenter";

export default function HRHome({ onAskQuestion }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <HrCommandCenter onAskQuestion={onAskQuestion} />
    </div>
  );
}
