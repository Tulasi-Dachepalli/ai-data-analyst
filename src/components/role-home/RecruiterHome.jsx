// src/components/role-home/RecruiterHome.jsx
import React from "react";
import RecruitmentCommandCenter from "../workspaces/RecruitmentCommandCenter";

export default function RecruiterHome({ onAskQuestion }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <RecruitmentCommandCenter onAskQuestion={onAskQuestion} />
    </div>
  );
}
