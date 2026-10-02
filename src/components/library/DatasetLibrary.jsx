// src/components/library/DatasetLibrary.jsx
import React, { useState, useEffect } from "react";
import { useDataset } from "../../context/DatasetContext";

export default function DatasetLibrary({ onOpenWorkspace, onOpenImport }) {
  const { activeDataset, loadDataset } = useDataset();
  const [search, setSearch] = useState("");
  const [serverDatasets, setServerDatasets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch real datasets from backend API (if available)
  useEffect(() => {
    let isMounted = true;
    async function fetchDatasets() {
      try {
        setLoading(true);
        const res = await fetch("/api/datasets");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.datasets)) {
            setServerDatasets(data.datasets.map(d => ({
              id: String(d.id),
              name: d.name,
              version: "v1 Raw",
              rows: d.rowCount || 0,
              cols: d.columnCount || 0,
              size: "Server",
              health: d.qualityScore ? `${Math.round(d.qualityScore)}/100` : "100/100",
              updated: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : "Saved",
              color: "#2563EB",
              isServer: true
            })));
          }
        }
      } catch (err) {
        // Safe backend fetch fallback (offline / local mode)
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDatasets();
    return () => { isMounted = false; };
  }, []);

  // Compile list: activeDataset from context + any saved server datasets (deduplicated by name)
  const datasets = [];
  if (activeDataset && activeDataset.name) {
    datasets.push({
      id: activeDataset.id || "active-ds",
      name: activeDataset.name,
      version: activeDataset.currentVersion || "v1",
      rows: activeDataset.rowCount || activeDataset.rows?.length || 0,
      cols: activeDataset.columnCount || activeDataset.columns?.length || 0,
      size: `${Math.max(1, Math.round((activeDataset.size || 1024) / 1024))} KB`,
      health: "100/100",
      updated: "Active in Workspace",
      color: "#16A34A",
      isActive: true
    });
  }

  serverDatasets.forEach(sd => {
    if (!datasets.some(d => d.name === sd.name)) {
      datasets.push(sd);
    }
  });

  const filtered = datasets.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelectDataset = async (d) => {
    if (d.isActive) {
      if (onOpenWorkspace) onOpenWorkspace();
      return;
    }

    if (d.isServer) {
      try {
        const res = await fetch(`/api/datasets/${d.id}`);
        if (res.ok) {
          const full = await res.json();
          loadDataset(full.name, full.rows || [], full.columns || [], {
            id: full.id,
            rawHash: full.rawHash || `sha256-${full.id}`,
            isUserExplicit: true
          });
          if (onOpenWorkspace) onOpenWorkspace();
          return;
        }
      } catch (err) {
        console.error("Failed to load server dataset:", err);
      }
    }

    if (onOpenWorkspace) onOpenWorkspace();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
            📁 Enterprise Dataset Library
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)", marginTop: 2 }}>
            Manage workspace datasets, inspect version lineage stacks, and profile dataset health.
          </div>
        </div>
        <button
          onClick={onOpenImport}
          style={{
            background: "#2563EB",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(37,99,235,0.2)"
          }}
        >
          📤 Import Dataset File
        </button>
      </div>

      {/* Search Input */}
      {datasets.length > 0 && (
        <div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search datasets by name or version..."
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "9px 14px",
              borderRadius: 8,
              border: "1px solid var(--border-color, #CBD5E1)",
              fontSize: 13,
              background: "var(--bg-secondary, #FFFFFF)",
              color: "var(--text-primary, #0F172A)",
              outline: "none"
            }}
          />
        </div>
      )}

      {/* Dataset Cards Grid or Clean Empty State */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.length === 0 ? (
          <div style={{
            background: "var(--bg-secondary, #FFFFFF)",
            border: "1px dashed var(--border-color, #CBD5E1)",
            borderRadius: 14,
            padding: "48px 24px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)", marginBottom: 6 }}>
              {search ? "No Matching Datasets" : "No Datasets in Library"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)", maxWidth: 420, margin: "0 auto 20px" }}>
              {search 
                ? `No active or saved datasets match "${search}".`
                : "Upload a CSV, XLSX, or JSON dataset file to begin analysis with guaranteed data provenance."}
            </div>
            {!search && (
              <button
                onClick={onOpenImport}
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 22px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.2)"
                }}
              >
                📤 Import Dataset Now
              </button>
            )}
          </div>
        ) : (
          filtered.map(d => (
            <div key={d.id} style={{
              background: "var(--bg-secondary, #FFFFFF)",
              border: "1px solid var(--border-color, #E2E8F0)",
              borderRadius: 14,
              padding: 18,
              boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: d.color,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 800
                }}>
                  📄
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                      {d.name}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, background: d.color, color: "#FFF", padding: "2px 8px", borderRadius: 12 }}>
                      {d.version}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text-secondary, #64748B)", marginTop: 4, display: "flex", gap: 12 }}>
                    <span>{d.rows.toLocaleString()} Rows</span>
                    <span>•</span>
                    <span>{d.cols} Columns</span>
                    <span>•</span>
                    <span>{d.size}</span>
                    <span>•</span>
                    <span>Health <strong style={{ color: "#16A34A" }}>{d.health}</strong></span>
                    <span>•</span>
                    <span>{d.updated}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleSelectDataset(d)}
                  style={{
                    background: "#0F172A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  🚀 Open Workspace
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
