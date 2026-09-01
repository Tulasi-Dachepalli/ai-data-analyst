import React, { useState } from "react";

export const ANNOTATION_ICONS = ["🚀 Launch", "⚠️ Outage", "💡 Campaign", "📌 Note", "🔥 Spike", "🏆 Milestone"];

export default function ChartAnnotationPin({ annotations = [], onAddAnnotation, onDeleteAnnotation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dataPoint, setDataPoint] = useState("");
  const [icon, setIcon] = useState("🚀 Launch");
  const [label, setLabel] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!dataPoint.trim() || !label.trim()) {
      alert("Please enter target data point and callout text.");
      return;
    }

    const newAnno = {
      id: `anno_${Date.now()}`,
      dataPoint: dataPoint.trim(),
      icon: icon.split(" ")[0],
      label: label.trim()
    };

    if (onAddAnnotation) onAddAnnotation(newAnno);
    setDataPoint("");
    setLabel("");
    setIsOpen(false);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ background: "var(--bg-hover, #F3F4F6)", border: "1px solid var(--border-color, #E5E7EB)", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "var(--text-secondary, #4B5563)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          📌 {isOpen ? "Cancel Pin" : "Add Chart Callout Pin"}
        </button>

        {annotations.length > 0 && (
          <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>
            {annotations.length} pin{annotations.length > 1 ? "s" : ""} on chart
          </span>
        )}
      </div>

      {isOpen && (
        <form onSubmit={handleAdd} style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 8, padding: 10, marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Target point (e.g. 2024-03 or East)..."
              value={dataPoint}
              onChange={e => setDataPoint(e.target.value)}
              style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 11.5 }}
            />
            <select
              value={icon}
              onChange={e => setIcon(e.target.value)}
              style={{ padding: "5px 8px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 11.5, background: "#FFF" }}
            >
              {ANNOTATION_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Callout text (e.g. Black Friday Sales Spike +140%)..."
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 11.5 }}
            />
            <button type="submit" style={{ background: "#8B5CF6", color: "#FFF", border: "none", borderRadius: 4, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
              Pin Callout
            </button>
          </div>
        </form>
      )}

      {/* Render Active Annotations Badges */}
      {annotations.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {annotations.map(anno => (
            <div key={anno.id} style={{ background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#92400E", display: "flex", alignItems: "center", gap: 4 }}>
              <span>{anno.icon}</span>
              <strong>{anno.dataPoint}:</strong>
              <span>{anno.label}</span>
              {onDeleteAnnotation && (
                <button
                  onClick={() => onDeleteAnnotation(anno.id)}
                  style={{ background: "none", border: "none", color: "#92400E", cursor: "pointer", fontWeight: 700, marginLeft: 2, padding: 0 }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
