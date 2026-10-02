// src/components/import/ImportOptions.jsx
import React from "react";

export default function ImportOptions({ options, onChange }) {
  const toggleOption = (key) => {
    onChange({
      ...options,
      [key]: !options[key]
    });
  };

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
        ⚙️ Advanced Import Configurations
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5, color: "#334155" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={options.detectTypes}
            onChange={() => toggleOption("detectTypes")}
          />
          <span>Detect column data types</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={options.detectDates}
            onChange={() => toggleOption("detectDates")}
          />
          <span>Detect ISO & custom dates</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={options.detectMissing}
            onChange={() => toggleOption("detectMissing")}
          />
          <span>Detect missing value patterns</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={options.detectDuplicates}
            onChange={() => toggleOption("detectDuplicates")}
          />
          <span>Detect duplicate row hashes</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={options.profileDataset}
            onChange={() => toggleOption("profileDataset")}
          />
          <span>Generate statistical dataset profile</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={options.treatFirstRowHeader}
            onChange={() => toggleOption("treatFirstRowHeader")}
          />
          <span>Treat first row as column headers</span>
        </label>
      </div>
    </div>
  );
}
