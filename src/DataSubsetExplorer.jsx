import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";

export default function DataSubsetExplorer({ data = [], columns = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCol, setSortCol] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Filtered Rows
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase().trim();
    return data.filter(row => {
      return columns.some(col => {
        const val = row[col];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
      });
    });
  }, [data, columns, searchTerm]);

  // 2. Sorted Rows
  const sortedRows = useMemo(() => {
    if (!sortCol) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      const numA = Number(valA);
      const numB = Number(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }
      const strA = String(valA ?? "").toLowerCase();
      const strB = String(valB ?? "").toLowerCase();
      return sortDir === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredRows, sortCol, sortDir]);

  // 3. Paginated Rows
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const toggleSelectRow = (idx) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    const allSelected = paginatedRows.every((_, i) => selectedIndices.has((currentPage - 1) * pageSize + i));
    setSelectedIndices(prev => {
      const next = new Set(prev);
      paginatedRows.forEach((_, i) => {
        const globalIdx = (currentPage - 1) * pageSize + i;
        if (allSelected) next.delete(globalIdx);
        else next.add(globalIdx);
      });
      return next;
    });
  };

  const getTargetRowsForExport = () => {
    if (selectedIndices.size > 0) {
      return Array.from(selectedIndices).map(idx => sortedRows[idx]).filter(Boolean);
    }
    return sortedRows;
  };

  const handleExportCsv = () => {
    const exportRows = getTargetRowsForExport();
    if (exportRows.length === 0) return;

    const csvRows = [columns.map(c => `"${c}"`).join(",")];
    exportRows.forEach(r => {
      csvRows.push(columns.map(c => `"${r[c] ?? ""}"`).join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data_subset_export_${exportRows.length}_rows.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const exportRows = getTargetRowsForExport();
    if (exportRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Subset");
    XLSX.writeFile(workbook, `data_subset_export_${exportRows.length}_rows.xlsx`);
  };

  return (
    <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
            🔍 Advanced Data Search & Subset Exporter Studio
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Live multi-column search, column sorting, pagination, and 1-click subset exports to CSV or Excel.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#3E6F8E", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
          >
            📥 Export CSV ({selectedIndices.size > 0 ? `${selectedIndices.size} selected` : `${sortedRows.length} filtered`})
          </button>
          <button
            onClick={handleExportExcel}
            style={{ backgroundColor: "#10B981", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
          >
            📊 Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Search & Pagination Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB", padding: 14, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <input
            type="text"
            placeholder="🔍 Search across all dataset columns & rows..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>
            Showing <strong>{sortedRows.length.toLocaleString()}</strong> of {data.length.toLocaleString()} rows
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#4B5563" }}>Per Page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12, backgroundColor: "#FFF" }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Grid */}
      <div style={{ overflowX: "auto", marginBottom: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
              <th style={{ padding: "10px 12px", width: 36, textAlign: "center" }}>
                <input
                  type="checkbox"
                  onChange={toggleSelectAllPage}
                  checked={paginatedRows.length > 0 && paginatedRows.every((_, i) => selectedIndices.has((currentPage - 1) * pageSize + i))}
                />
              </th>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  style={{ padding: "10px 12px", fontWeight: 700, color: "#374151", cursor: "pointer", userSelect: "none" }}
                >
                  {col} {sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => {
              const globalIdx = (currentPage - 1) * pageSize + idx;
              const isSelected = selectedIndices.has(globalIdx);
              return (
                <tr key={idx} style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: isSelected ? "#EFF6FF" : "transparent" }}>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(globalIdx)}
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col} style={{ padding: "10px 12px", color: "#1F2937" }}>
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 12, color: "#6B7280" }}>
          Page {currentPage} of {totalPages}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12, backgroundColor: currentPage === 1 ? "#F3F4F6" : "#FFF", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
          >
            ◀ Previous
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12, backgroundColor: currentPage >= totalPages ? "#F3F4F6" : "#FFF", cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}
