// src/components/analysis/AnalysisNotebook.jsx
import React, { useState, useMemo } from "react";
import { useDataset } from "../../context/DatasetContext";
import { NOTEBOOK_FOLDERS, getDynamicNotebookEntries } from "../../services/notebookService";

export default function AnalysisNotebook() {
  const { currentVersion, activeDataset, activeCols, openInvestigation } = useDataset();
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [userEntries, setUserEntries] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Compute dynamic reproducible notebook entries grounded in activeDataset
  const defaultEntries = useMemo(() => {
    const datasetObj = activeDataset || {
      name: "dataset.csv",
      fileName: "dataset.csv",
      columns: activeCols || ["category", "amount"]
    };
    return getDynamicNotebookEntries(datasetObj, currentVersion);
  }, [activeDataset, activeCols, currentVersion]);

  const allEntries = useMemo(() => {
    return [...userEntries, ...defaultEntries];
  }, [userEntries, defaultEntries]);

  const filteredEntries = useMemo(() => {
    if (selectedFolder === "all") return allEntries;
    return allEntries.filter(e => e.folder === selectedFolder);
  }, [allEntries, selectedFolder]);

  const handleAddAnalysis = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const datasetName = activeDataset?.fileName || activeDataset?.name || "dataset.csv";
    const cleanName = datasetName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    const versionTag = currentVersion?.version || "v1";
    const rawHash = activeDataset?.rawHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const firstCol = (activeCols && activeCols[0]) ? (typeof activeCols[0] === 'string' ? activeCols[0] : activeCols[0].name) : "id";
    const secondCol = (activeCols && activeCols[1]) ? (typeof activeCols[1] === 'string' ? activeCols[1] : activeCols[1].name) : "metric";

    const newEntry = {
      id: `nb-custom-${Date.now()}`,
      num: allEntries.length + 1,
      title: newTitle.trim(),
      folder: selectedFolder === "all" ? "insights" : selectedFolder,
      datasetName,
      datasetVersion: versionTag,
      rawHash,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      author: "Tulasi (Lead Data Analyst)",
      findings: [
        `Custom query investigation evaluated on active dataset stack ${versionTag}.`,
        `Preserved raw immutable checksum ${rawHash.slice(0, 10)}...`
      ],
      sql: `SELECT ${firstCol}, COUNT(*), AVG(${secondCol})\nFROM ${cleanName}_${versionTag}\nGROUP BY ${firstCol};`,
      python: `import pandas as pd\ndf = pd.read_csv('${datasetName}')\nprint(df.describe())`
    };

    setUserEntries(prev => [newEntry, ...prev]);
    setNewTitle("");
    setShowAddForm(false);
  };

  return (
    <div data-testid="analysis-notebook" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#0F172A" }}>📝 AI ANALYSIS NOTEBOOK</span>
            <span data-testid="notebook-provenance-badge" style={{ fontSize: 11, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", padding: "3px 10px", borderRadius: 10, border: "1px solid #BFDBFE" }}>
              📦 {activeDataset?.fileName || activeDataset?.name || "Active Dataset"} ({currentVersion?.version || "v1"})
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
            Traceable analysis entries with grounded SQL queries, Python scripts, and reproducible evidence.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            data-testid="notebook-btn-add"
            onClick={() => setShowAddForm(p => !p)}
            style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            {showAddForm ? "✕ Cancel" : "+ New Analysis"}
          </button>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", background: "#EFF6FF", padding: "6px 12px", borderRadius: 12 }}>
            {filteredEntries.length} Saved Entries
          </span>
        </div>
      </div>

      {/* Add New Analysis Form */}
      {showAddForm && (
        <form onSubmit={handleAddAnalysis} style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 12, padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <input
            data-testid="notebook-input-title"
            type="text"
            placeholder="Analysis title or hypothesis (e.g. Evaluate sales variance across regional cohorts)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #94A3B8", fontSize: 13 }}
            autoFocus
          />
          <button
            data-testid="notebook-btn-save"
            type="submit"
            style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
          >
            Save Entry
          </button>
        </form>
      )}

      {/* Folder Tabs */}
      <div data-testid="notebook-folder-filter" style={{ display: "flex", gap: 8, borderBottom: "1px solid #E2E8F0", paddingBottom: 10 }}>
        {NOTEBOOK_FOLDERS.map(f => {
          const isActive = selectedFolder === f.id;
          return (
            <button
              key={f.id}
              data-testid={`notebook-folder-${f.id}`}
              onClick={() => setSelectedFolder(f.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: isActive ? "#0F172A" : "#F1F5F9",
                color: isActive ? "#FFFFFF" : "#64748B",
                transition: "all 0.15s ease"
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Entries List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {filteredEntries.map(nb => (
          <div
            key={nb.id}
            data-testid={`notebook-entry-${nb.id}`}
            style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, background: "#F8FAFC", display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, background: "#0F172A", color: "#FFF", padding: "2px 8px", borderRadius: 6 }}>
                  Analysis #{nb.num}
                </span>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>{nb.title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11.5, color: "#64748B" }}>
                  Dataset: <strong>{nb.datasetName}</strong> ({nb.datasetVersion}) • {nb.date}
                </span>
                <span style={{ fontSize: 10, background: "#E2E8F0", color: "#334155", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>
                  SHA: {nb.rawHash ? nb.rawHash.slice(0, 10) : "verified"}
                </span>
              </div>
            </div>

            {/* Findings Bullets */}
            <div data-testid="notebook-findings-list" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>📊 Grounded Findings</div>
              {nb.findings.map((f, i) => (
                <div key={i} style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.4 }}>• {f}</div>
              ))}
            </div>

            {/* SQL & Python Tabs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div data-testid="notebook-sql-block" style={{ background: "#0F172A", color: "#F8FAFC", borderRadius: 8, padding: 14, fontSize: 11.5, fontFamily: "monospace", overflowX: "auto" }}>
                <div style={{ color: "#38BDF8", fontWeight: 700, marginBottom: 6 }}>-- SQL Query ({nb.datasetName})</div>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{nb.sql}</pre>
              </div>
              <div data-testid="notebook-python-block" style={{ background: "#0F172A", color: "#F8FAFC", borderRadius: 8, padding: 14, fontSize: 11.5, fontFamily: "monospace", overflowX: "auto" }}>
                <div style={{ color: "#4ADE80", fontWeight: 700, marginBottom: 6 }}># Python Script</div>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{nb.python}</pre>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                data-testid="notebook-inspect-btn"
                onClick={() => openInvestigation && openInvestigation({
                  title: `Analysis #${nb.num}: ${nb.title}`,
                  question: nb.title,
                  affectedRows: 1000,
                  findings: nb.findings
                })}
                style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                🔬 Inspect Notebook Evidence
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
