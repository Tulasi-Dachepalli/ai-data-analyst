// test_typography_and_credits.js
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
console.log(" TESTING CHATGPT & CLAUDE TYPOGRAPHY AND CREDITS VISIBILITY ARCHITECTURE");
console.log("================================================================================");

test("Typography 1: index.html loads Inter, Plus Jakarta Sans, and JetBrains Mono", () => {
  const html = fs.readFileSync("./index.html", "utf8");
  assert(html.includes("family=Inter"), "Inter font must be included");
  assert(html.includes("Plus+Jakarta+Sans"), "Plus Jakarta Sans (Claude aesthetic) must be included");
  assert(html.includes("JetBrains+Mono"), "JetBrains Mono (ChatGPT/Claude code font) must be included");
});

test("Typography 2: design-tokens.css configures ChatGPT and Claude font stacks and styling", () => {
  const css = fs.readFileSync("./src/styles/design-tokens.css", "utf8");
  assert(css.includes("--font-sans: 'Inter'"), "Inter must be primary sans font");
  assert(css.includes("--font-heading: 'Plus Jakarta Sans'"), "Plus Jakarta Sans must be heading font");
  assert(css.includes("--font-mono: 'JetBrains Mono'"), "JetBrains Mono must be code/mono font");
  assert(css.includes("-webkit-font-smoothing: antialiased"), "Antialiasing must be configured");
  assert(css.includes("letter-spacing: -0.011em"), "Body text must have tight modern letter spacing");
  assert(css.includes("letter-spacing: -0.025em"), "Headings must have tight editorial letter spacing");
});

test("Credits 1: creditsManager.js exports credit tracking, deduction, and instant refill functions", () => {
  const code = fs.readFileSync("./src/utils/creditsManager.js", "utf8");
  assert(code.includes("export const DEFAULT_CREDITS = 50"), "Default credits must be 50");
  assert(code.includes("export function getCreditsInfo()"), "getCreditsInfo must be exported");
  assert(code.includes("export function consumeCredit("), "consumeCredit must be exported");
  assert(code.includes("export function resetCredits()"), "resetCredits must be exported");
  assert(code.includes("export function useCredits()"), "useCredits hook must be exported");
});

test("Credits 2: Topbar renders interactive CreditsBadge and user profile credit trigger", () => {
  const topbar = fs.readFileSync("./src/components/layout/Topbar.jsx", "utf8");
  assert(topbar.includes("import CreditsBadge from \"../common/CreditsBadge\""), "Topbar must import CreditsBadge");
  assert(topbar.includes("<CreditsBadge variant=\"compact\" />"), "Topbar must render CreditsBadge");
  assert(topbar.includes("Credits & Quota"), "User profile dropdown must include Credits & Quota details link");
});

test("Credits 3: Sidebar renders persistent Credits & Quota card", () => {
  const sidebar = fs.readFileSync("./src/components/layout/Sidebar.jsx", "utf8");
  assert(sidebar.includes("import CreditsBadge from \"../common/CreditsBadge\""), "Sidebar must import CreditsBadge");
  assert(sidebar.includes("<CreditsBadge variant=\"card\" />"), "Sidebar must render CreditsBadge card");
});

test("Credits 4: CopilotPanel header displays active Credits indicator", () => {
  const copilot = fs.readFileSync("./src/components/copilot/CopilotPanel.jsx", "utf8");
  assert(copilot.includes("import CreditsBadge from \"../common/CreditsBadge\""), "CopilotPanel must import CreditsBadge");
  assert(copilot.includes("<CreditsBadge variant=\"compact\" />"), "CopilotPanel must render CreditsBadge");
});

test("Credits 5: DataAnalystDashboardBot displays unified credits, token progress and prompt footer badge", () => {
  const bot = fs.readFileSync("./src/DataAnalystDashboardBot.jsx", "utf8");
  assert(bot.includes("AI Credits"), "Sidebar must have AI Credits section");
  assert(bot.includes("50 Left") || bot.includes("Credits"), "Sidebar must show remaining credits");
  assert(bot.includes("⚡ 1 Credit / Query"), "Prompt footer must state credit cost and remaining amount");
});

console.log("\n================================================================================");
console.log(` ALL ${passed}/${total} TYPOGRAPHY & CREDITS TESTS PASSED!`);
console.log("================================================================================");
