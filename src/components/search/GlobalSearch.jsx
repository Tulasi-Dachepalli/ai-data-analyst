// src/components/search/GlobalSearch.jsx
import React from "react";
import { useSearch } from "../../context/SearchContext";
import { useDataset } from "../../context/DatasetContext";

export default function GlobalSearch() {
  const {
    searchOpen,
    closeSearch,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    navigateResults
  } = useSearch();
  const { setCurrentStage } = useDataset();

  if (!searchOpen) return null;

  const handleSelect = (item) => {
    if (item.link) setCurrentStage(item.link);
    closeSearch();
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateResults("down");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateResults("up");
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      closeSearch();
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.5)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      paddingTop: 80
    }}>
      <div style={{
        width: 600,
        maxWidth: "95vw",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        boxShadow: "0 25px 50px rgba(15, 23, 42, 0.25)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Input Bar */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#F8FAFC"
        }}>
          <span style={{ fontSize: 18, color: "#64748B" }}>🔍</span>
          <input
            type="text"
            data-testid="global-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search datasets, columns, insights, reports, stages..."
            autoFocus
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontSize: 15,
              fontWeight: 600,
              color: "#0F172A",
              outline: "none"
            }}
          />
          <button
            onClick={closeSearch}
            style={{ background: "none", border: "none", color: "#64748B", fontSize: 16, cursor: "pointer", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        {/* Search Results List */}
        <div data-testid="global-search-results" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, maxHeight: "60vh", overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "#64748B", fontSize: 13 }}>
              No matching entities found for "{query}"
            </div>
          ) : (
            results.map((r, i) => (
              <div
                key={i}
                data-testid={`search-result-${r.type.toLowerCase()}-${r.name}`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: selectedIndex === i ? "1px solid #3B82F6" : "1px solid #E2E8F0",
                  background: selectedIndex === i ? "#EFF6FF" : "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.15s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      background: r.type === "Dataset" ? "#2563EB" : r.type === "Column" ? "#0F766E" : "#0F172A",
                      color: "#FFF",
                      padding: "2px 6px",
                      borderRadius: 4
                    }}>
                      {r.type}
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>{r.name}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>{r.detail}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: selectedIndex === i ? "#2563EB" : "#94A3B8" }}>Open →</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
