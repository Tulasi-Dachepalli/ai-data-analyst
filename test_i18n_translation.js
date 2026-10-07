// test_i18n_translation.js
import fs from "fs";
import assert from "assert";

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

console.log("================================================================================");
console.log(" TESTING I18N LIVE TRANSLATION & LANGUAGE REACTIVITY ARCHITECTURE");
console.log("================================================================================");

test("i18n 1: src/utils/i18n.js contains complete dictionaries for all 7 languages", async () => {
  const { SUPPORTED_LANGUAGES, TRANSLATIONS } = await import("./src/utils/i18n.js");
  const codes = ["en", "te", "hi", "es", "fr", "de", "ja"];
  codes.forEach(c => {
    assert(SUPPORTED_LANGUAGES[c], `SUPPORTED_LANGUAGES must contain ${c}`);
    assert(TRANSLATIONS[c], `TRANSLATIONS must contain ${c}`);
    assert(TRANSLATIONS[c].download_report, `TRANSLATIONS[${c}] must have download_report`);
    assert(TRANSLATIONS[c].fullscreen, `TRANSLATIONS[${c}] must have fullscreen`);
  });
  // Telugu specific checks
  assert.strictEqual(TRANSLATIONS.te.download_report, "⬇ నివేదిక డౌన్‌లోడ్");
  assert.strictEqual(TRANSLATIONS.te.stage_1, "దశ 1: డేటా అప్‌లోడ్");
});

test("i18n 2: LanguageTranslator.jsx uses useLanguage hook and renders confirmation toast", () => {
  const code = fs.readFileSync("./src/LanguageTranslator.jsx", "utf8");
  assert(code.includes("useLanguage"), "Must use useLanguage hook");
  assert(code.includes("setLanguage"), "Must call setLanguage upon change");
  assert(code.includes("showToast"), "Must display feedback toast when language changed");
});

test("i18n 3: DataAnalystDashboardBot toolbar and tabs are bound to translation function", () => {
  const bot = fs.readFileSync("./src/DataAnalystDashboardBot.jsx", "utf8");
  assert(bot.includes("const { lang, t } = useLanguage()"), "Must initialize useLanguage");
  assert(bot.includes("t(\"download_report\""), "Download report button must be translated");
  assert(bot.includes("t(\"share\""), "Share button must be translated");
  assert(bot.includes("t(\"tab_dashboard\""), "Workflow tabs must be translated");
});

test("i18n 4: Sidebar and Topbar update labels dynamically with useLanguage", () => {
  const sidebar = fs.readFileSync("./src/components/layout/Sidebar.jsx", "utf8");
  const topbar = fs.readFileSync("./src/components/layout/Topbar.jsx", "utf8");
  assert(sidebar.includes("useLanguage"), "Sidebar must use useLanguage");
  assert(sidebar.includes("t(\"nav_overview\""), "Sidebar nav must be translated");
  assert(topbar.includes("useLanguage"), "Topbar must use useLanguage");
  assert(topbar.includes("t(\"decisions\""), "Topbar decisions button must be translated");
});

test("i18n 5: ExecutiveCommandCenter & FinanceCommandCenter reactively translate KPIs and headers", () => {
  const exec = fs.readFileSync("./src/components/workspaces/ExecutiveCommandCenter.jsx", "utf8");
  const fin = fs.readFileSync("./src/components/workspaces/FinanceCommandCenter.jsx", "utf8");
  assert(exec.includes("useLanguage"), "ExecutiveCommandCenter must import useLanguage");
  assert(exec.includes("hdr_executive_command_center"), "Executive header must be translated");
  assert(exec.includes("kpi_total_revenue"), "Total revenue KPI must be translated");
  assert(fin.includes("useLanguage"), "FinanceCommandCenter must import useLanguage");
  assert(fin.includes("hdr_finance_command_center"), "Finance header must be translated");
  assert(fin.includes("sec_financial_metrics"), "Financial metrics section must be translated");
});

test("i18n 6: WorkspaceCommandCenter translates action cards, lineage, and upload buttons", () => {
  const ws = fs.readFileSync("./src/components/command-center/WorkspaceCommandCenter.jsx", "utf8");
  assert(ws.includes("useLanguage"), "WorkspaceCommandCenter must import useLanguage");
  assert(ws.includes("kpi_data_health"), "Data health card must be translated");
  assert(ws.includes("btn_upload_dataset"), "Upload dataset button must be translated");
  assert(ws.includes("btn_view_lineage"), "Data Lineage button must be translated");
});

test("i18n 7: BeginnerModePanel translates guided steps, glossary button, and next action spotlight", () => {
  const beg = fs.readFileSync("./src/components/beginner/BeginnerModePanel.jsx", "utf8");
  assert(beg.includes("useLanguage"), "BeginnerModePanel must import useLanguage");
  assert(beg.includes("lbl_beginner_guided_mode"), "Beginner header must be translated");
  assert(beg.includes("lbl_recommended_next_action"), "Recommended next action must be translated");
  assert(beg.includes("step_connect_data"), "Steps must be translated");
  assert(beg.includes("glossary_btn"), "Glossary button must be translated");
});

test("i18n 8: PowerBiDashboard translates executive dashboard title, filters, and action buttons", () => {
  const pbi = fs.readFileSync("./src/components/dashboard/PowerBiDashboard.jsx", "utf8");
  assert(pbi.includes("useLanguage"), "PowerBiDashboard must import useLanguage");
  assert(pbi.includes("hdr_executive_dashboard"), "Executive dashboard header must be translated");
  assert(pbi.includes("filter_by"), "Filters label must be translated");
  assert(pbi.includes("btn_reset_filters"), "Reset filters button must be translated");
  assert(pbi.includes("btn_ask_copilot"), "Ask Copilot must be translated");
});

test("i18n 9: DataAnalystDashboardBot translates sidebar actions and recent file state", () => {
  const bot = fs.readFileSync("./src/DataAnalystDashboardBot.jsx", "utf8");
  assert(bot.includes("nav_new_analysis"), "New analysis button must be translated");
  assert(bot.includes("nav_import_sheet"), "Import sheet button must be translated");
  assert(bot.includes("nav_recent"), "Recent section header must be translated");
  assert(bot.includes("nav_no_recent"), "No recent files message must be translated");
});

console.log("\n================================================================================");
console.log(` ALL ${passed}/${total} I18N TRANSLATION TESTS PASSED!`);
console.log("================================================================================");
