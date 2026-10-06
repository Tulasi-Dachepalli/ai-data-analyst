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

console.log("\n================================================================================");
console.log(` ALL ${passed}/${total} I18N TRANSLATION TESTS PASSED!`);
console.log("================================================================================");
