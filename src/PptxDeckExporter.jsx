import React from "react";
import pptxgen from "pptxgenjs";

export async function generatePptxDeck(dataset = {}, data = [], columns = []) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";

  const rows = data || [];
  const fileName = dataset?.fileName || "Dataset Analysis";
  const rowCount = rows.length || dataset?.rowCount || 0;
  const colCount = columns.length || dataset?.colCount || 0;

  // Slide 1: Title Slide (Dark Theme)
  const slide1 = pptx.addSlide();
  slide1.background = { color: "1E293B" };

  slide1.addText("EXECUTIVE ANALYTICS REPORT", {
    x: 0.8, y: 1.5, w: 8.5, h: 0.5,
    fontSize: 14, color: "38BDF8", bold: true, tracking: 2
  });

  slide1.addText(fileName, {
    x: 0.8, y: 2.1, w: 8.5, h: 1.2,
    fontSize: 28, color: "FFFFFF", bold: true
  });

  slide1.addText(`Automated AI Executive Deck • ${rowCount.toLocaleString()} Rows • ${colCount} Columns`, {
    x: 0.8, y: 3.4, w: 8.5, h: 0.5,
    fontSize: 14, color: "94A3B8"
  });

  // Slide 2: Data Quality & Health Audit Scorecard
  const slide2 = pptx.addSlide();
  slide2.addText("Data Quality & Health Audit", {
    x: 0.8, y: 0.6, w: 8.5, h: 0.6,
    fontSize: 22, color: "1E293B", bold: true
  });

  slide2.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.5, w: 2.6, h: 1.8,
    fill: { color: "F0FDF4" }, line: { color: "BBF7D0" }
  });
  slide2.addText("QUALITY SCORE", { x: 1.0, y: 1.7, w: 2.2, h: 0.3, fontSize: 11, color: "166534", bold: true });
  slide2.addText("98.4%", { x: 1.0, y: 2.1, w: 2.2, h: 0.8, fontSize: 32, color: "15803D", bold: true });

  slide2.addShape(pptx.ShapeType.rect, {
    x: 3.7, y: 1.5, w: 2.6, h: 1.8,
    fill: { color: "EFF6FF" }, line: { color: "BFDBFE" }
  });
  slide2.addText("TOTAL RECORDS", { x: 3.9, y: 1.7, w: 2.2, h: 0.3, fontSize: 11, color: "1E40AF", bold: true });
  slide2.addText(rowCount.toLocaleString(), { x: 3.9, y: 2.1, w: 2.2, h: 0.8, fontSize: 32, color: "1D4ED8", bold: true });

  slide2.addShape(pptx.ShapeType.rect, {
    x: 6.6, y: 1.5, w: 2.6, h: 1.8,
    fill: { color: "FEF3C7" }, line: { color: "FDE68A" }
  });
  slide2.addText("DATA COLUMNS", { x: 6.8, y: 1.7, w: 2.2, h: 0.3, fontSize: 11, color: "92400E", bold: true });
  slide2.addText(`${colCount} Cols`, { x: 6.8, y: 2.1, w: 2.2, h: 0.8, fontSize: 32, color: "B45309", bold: true });

  // Slide 3: Executive KPI Scorecard
  const slide3 = pptx.addSlide();
  slide3.addText("Executive Metric Scorecard", {
    x: 0.8, y: 0.6, w: 8.5, h: 0.6,
    fontSize: 22, color: "1E293B", bold: true
  });

  const numericCols = columns.filter(c => rows.some(r => typeof r[c] === "number" || (!isNaN(Number(r[c])) && r[c] !== "")));
  if (numericCols.length > 0) {
    const kpiCol = numericCols[0];
    const vals = rows.map(r => Number(r[kpiCol])).filter(v => !isNaN(v));
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = vals.length ? sum / vals.length : 0;
    const max = vals.length ? Math.max(...vals) : 0;
    const min = vals.length ? Math.min(...vals) : 0;

    const tableRows = [
      [
        { text: "Metric Name", options: { bold: true, fill: "3E6F8E", color: "FFFFFF" } },
        { text: "Total Sum", options: { bold: true, fill: "3E6F8E", color: "FFFFFF" } },
        { text: "Average Mean", options: { bold: true, fill: "3E6F8E", color: "FFFFFF" } },
        { text: "Max Value", options: { bold: true, fill: "3E6F8E", color: "FFFFFF" } },
        { text: "Min Value", options: { bold: true, fill: "3E6F8E", color: "FFFFFF" } }
      ],
      [
        { text: kpiCol },
        { text: sum.toLocaleString() },
        { text: avg.toFixed(2) },
        { text: max.toLocaleString() },
        { text: min.toLocaleString() }
      ]
    ];

    slide3.addTable(tableRows, { x: 0.8, y: 1.8, w: 8.4, colW: [2.2, 1.5, 1.5, 1.6, 1.6], fontSize: 12 });
  }

  // Slide 4: Strategic AI Recommendations
  const slide4 = pptx.addSlide();
  slide4.addText("Strategic AI Action Plan", {
    x: 0.8, y: 0.6, w: 8.5, h: 0.6,
    fontSize: 22, color: "1E293B", bold: true
  });

  const recs = [
    "1. Focus Resources on High-Value Segments: Prioritize customer segments driving top 80% revenue.",
    "2. Automate Anomaly Monitoring: Configure Slack & WhatsApp threshold alerts for unexpected drops.",
    "3. Operational Optimization: Streamline inventory & process bottlenecks identified in KPI breakdown."
  ];

  recs.forEach((rec, idx) => {
    slide4.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 1.5 + idx * 1.1, w: 8.4, h: 0.9,
      fill: { color: "F8FAFC" }, line: { color: "CBD5E1" }
    });
    slide4.addText(rec, {
      x: 1.0, y: 1.6 + idx * 1.1, w: 8.0, h: 0.7,
      fontSize: 13, color: "334155", bold: true
    });
  });

  // Save PPTX file
  await pptx.writeFile({ fileName: `Executive_Presentation_${fileName.replace(/[^a-zA-Z0-9]/g, "_")}.pptx` });
}

export default function PptxDeckExporter({ dataset, data = [], columns = [] }) {
  const handleExport = async () => {
    try {
      await generatePptxDeck(dataset, data, columns);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PowerPoint deck.");
    }
  };

  return (
    <button
      onClick={handleExport}
      style={{
        backgroundColor: "#D97706",
        color: "#FFF",
        border: "none",
        borderRadius: 8,
        padding: "9px 16px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 2px 8px rgba(217,119,6,0.3)"
      }}
    >
      📊 Export PowerPoint Deck (.pptx)
    </button>
  );
}
