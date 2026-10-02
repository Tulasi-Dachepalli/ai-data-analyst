// src/services/searchService.js
// Enterprise Dynamic Search Indexing Service derived directly from active dataset

export function buildSearchIndex({ activeDataset, activeCols = [], stages = [], customItems = [] }) {
  const items = [];

  // 1. Current active dataset entity
  if (activeDataset?.name) {
    items.push({
      type: "Dataset",
      name: activeDataset.name,
      detail: `${activeDataset.currentVersion || "v1"} • ${(activeDataset.rows || []).length.toLocaleString()} rows`,
      link: "dataset",
      datasetId: activeDataset.id,
      datasetVersion: activeDataset.currentVersion || "v1"
    });
  }

  // 2. Active dataset columns (dynamically extracted)
  if (Array.isArray(activeCols) && activeCols.length > 0) {
    activeCols.forEach(col => {
      items.push({
        type: "Column",
        name: col,
        detail: `Field in ${activeDataset?.name || "current dataset"}`,
        link: "explore",
        datasetId: activeDataset?.id
      });
    });
  }

  // 3. Workflow stages
  const defaultStages = [
    { type: "Stage", name: "01 Raw Data", detail: "Immutable raw baseline", link: "raw" },
    { type: "Stage", name: "02 Data Quality", detail: "Quality score and health check", link: "quality" },
    { type: "Stage", name: "03 Data Cleaning", detail: "Transactional transformations", link: "cleaning" },
    { type: "Stage", name: "04 Cleaned Dataset", detail: "Verified clean version stack", link: "cleaned" },
    { type: "Stage", name: "05 Explore Studio", detail: "Distributions and correlation analysis", link: "explore" },
    { type: "Stage", name: "06 Automated Insights", detail: "AI executive narrative & anomaly cards", link: "insights" },
    { type: "Stage", name: "07 Predictive Modeling", detail: "AutoML models and hyperparameter tuning", link: "modeling" },
    { type: "Stage", name: "08 Forecasting", detail: "Automated predictive time-series models", link: "forecast" },
    { type: "Stage", name: "09 Executive Report", detail: "Compiled 9-stage executive report deck", link: "report" }
  ];

  items.push(...(stages.length ? stages : defaultStages));

  // 4. Custom items (reports, insights)
  if (Array.isArray(customItems) && customItems.length > 0) {
    items.push(...customItems);
  }

  return items;
}

export function searchEntities(query = "", index = []) {
  const cleanQ = (query || "").trim().toLowerCase();
  if (!cleanQ) return index;

  return index.filter(item => {
    const nameMatch = (item.name || "").toLowerCase().includes(cleanQ);
    const typeMatch = (item.type || "").toLowerCase().includes(cleanQ);
    const detailMatch = (item.detail || "").toLowerCase().includes(cleanQ);
    return nameMatch || typeMatch || detailMatch;
  });
}
