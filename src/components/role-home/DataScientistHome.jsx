// src/components/role-home/DataScientistHome.jsx
import React from "react";
import DataScientistStudio from "../workspaces/DataScientistStudio";

export default function DataScientistHome({ active, activeData = [], activeCols = [], onAskQuestion }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <DataScientistStudio active={active} activeData={activeData} activeCols={activeCols} onAskQuestion={onAskQuestion} />
    </div>
  );
}
