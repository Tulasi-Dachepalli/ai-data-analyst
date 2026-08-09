import React, { useState, useMemo } from "react";

export default function Table({
  headers,
  data = [],
  loading = false,
  density = "comfortable",
  onRowClick,
  emptyMessage = "No data available",
  sortKey: controlledSortKey,
  sortOrder: controlledSortOrder,
  onSort
}) {
  const [internalSortKey, setInternalSortKey] = useState(null);
  const [internalSortOrder, setInternalSortOrder] = useState("asc"); // "asc" | "desc"

  const isControlled = onSort !== undefined;
  const sortKey = isControlled ? controlledSortKey : internalSortKey;
  const sortOrder = isControlled ? controlledSortOrder : internalSortOrder;

  const handleSort = (key) => {
    if (isControlled) {
      onSort(key);
    } else {
      if (internalSortKey === key) {
        if (internalSortOrder === "asc") {
          setInternalSortOrder("desc");
        } else {
          setInternalSortKey(null);
        }
      } else {
        setInternalSortKey(key);
        setInternalSortOrder("asc");
      }
    }
  };

  // Sort local copy of data safely without mutation (only if uncontrolled)
  const sortedData = useMemo(() => {
    if (isControlled || !sortKey) return data;
    const sorted = [...data];
    sorted.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [data, sortKey, sortOrder]);

  const paddingY = density === "compact" ? "6px" : "12px";
  const paddingX = "16px";

  const thStyle = (align = "left", sortable = false) => ({
    padding: `10px ${paddingX}`,
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-secondary, #475569)",
    backgroundColor: "var(--bg-hover, #F1F5F9)",
    borderBottom: "1px solid var(--border-color, #E2E8F0)",
    textAlign: align,
    cursor: sortable ? "pointer" : "default",
    userSelect: "none",
    whiteSpace: "nowrap"
  });

  const tdStyle = (align = "left") => ({
    padding: `${paddingY} ${paddingX}`,
    fontSize: "13px",
    color: "var(--text-primary, #0F172A)",
    borderBottom: "1px solid var(--border-color, #E2E8F0)",
    textAlign: align,
    whiteSpace: "nowrap"
  });

  return (
    <div style={{
      width: "100%",
      overflowX: "auto",
      borderRadius: "var(--radius-md, 8px)",
      border: "1px solid var(--border-color, #E2E8F0)",
      backgroundColor: "var(--bg-secondary, #FFFFFF)",
      boxShadow: "var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05))"
    }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        borderSpacing: 0,
        fontFamily: "var(--font-sans, inherit)"
      }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                style={thStyle(header.align, header.sortable)}
                onClick={() => header.sortable && handleSort(header.key)}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {header.label}
                  {header.sortable && (
                    <span style={{ fontSize: "10px", opacity: sortKey === header.key ? 1 : 0.4 }}>
                      {sortKey === header.key ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            // Premium pulsating skeleton rows
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx}>
                {headers.map((h) => (
                  <td key={h.key} style={tdStyle(h.align)}>
                    <div style={{
                      height: "16px",
                      backgroundColor: "var(--bg-hover, #F1F5F9)",
                      borderRadius: "4px",
                      animation: "pulse 1.5s infinite ease-in-out",
                      width: h.key === "name" || h.key === "title" ? "70%" : "40%"
                    }} />
                  </td>
                ))}
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{
                ...tdStyle("center"),
                padding: "32px 16px",
                color: "var(--text-muted, #94A3B8)",
                fontSize: "13.5px"
              }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rIdx) => (
              <tr
                key={rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background-color 0.1s ease",
                  backgroundColor: "transparent"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-hover, #F8FAFC)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {headers.map((header) => (
                  <td key={header.key} style={tdStyle(header.align)}>
                    {row[header.key] !== null && row[header.key] !== undefined
                      ? String(row[header.key])
                      : "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
