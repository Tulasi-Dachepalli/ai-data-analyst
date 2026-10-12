import { test, expect } from '@playwright/test';

test.describe('Universal Filter Synchronization, Multi-Part Copilot & Audit Verification', () => {
  test('Filters by CA-2024-1005, verifies synchronized KPIs (₹980 sales, -₹45 profit), multi-part Copilot, and Manage Data', async ({ page }) => {
    const errorLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      errorLogs.push(err.message);
    });

    // 1. Visit and setup guest demo session in Beginner Mode
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('aida_user_mode', 'beginner');
      localStorage.setItem('aida_onboarding_dismissed', 'true');
      const demoUser = {
        fullName: 'Guest Executive',
        email: 'demo.executive@enterprise.com',
        role: 'ceo',
        companyName: 'Acme Enterprise (Demo)',
        tier: 'pro',
        isDemo: true
      };
      localStorage.setItem('aida_token', 'demo-session-token-' + Date.now());
      localStorage.setItem('aida_user', JSON.stringify(demoUser));
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Trigger demo data load
    await page.evaluate(() => {
      window.dispatchEvent(new Event('trigger-explore-demo'));
    });

    // 2. Verify Executive Command Center loads with demo baseline
    const execHeader = page.locator('text=Executive Command Center').first();
    await expect(execHeader).toBeVisible({ timeout: 15000 });

    // 3. Verify Universal Filter Bar is visible
    const filterBar = page.locator('[data-testid="global-filter-bar"]');
    await expect(filterBar).toBeVisible();

    // 4. Verify Date Column Detection: Date Range inputs exist for Order_Date
    await expect(page.locator('text=Date Range (Order_Date):').first()).toBeVisible();

    // 5. Verify Business-Goal Selector exists in Beginner Mode
    await expect(page.locator('text=Choose Your Business Goal:').first()).toBeVisible();
    await expect(page.locator('text=Understand Sales & Growth').first()).toBeVisible();
    await expect(page.locator('text=Review Spending & Margin').first()).toBeVisible();

    // 6. Verify Upload Readiness Review can be toggled
    const readinessBtn = page.getByRole('button', { name: /Upload Readiness Review/i });
    await expect(readinessBtn).toBeVisible();
    await readinessBtn.click();
    await expect(page.locator('text=Dataset Upload Readiness Review').first()).toBeVisible();

    // 7. Critical Test: Apply Search Filter "CA-2024-1005"
    const searchInput = filterBar.locator('input[placeholder*="Search dataset"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('CA-2024-1005');

    // 8. Assert Filter Bar visible count updates to (1 / 10 rows visible)
    const visibleCount = page.locator('[data-testid="filter-visible-count"]');
    await expect(visibleCount).toContainText('1 / 10 rows visible');

    // 9. Assert Executive Command Center KPIs Synchronized with Filter:
    // Sales: ₹980, Profit: -₹45, Margin: -4.6%, Orders: 1
    await expect(page.locator('text=₹980').first()).toBeVisible();
    await expect(page.locator('text=-₹45').first()).toBeVisible();
    await expect(page.locator('text=-4.6%').first()).toBeVisible();

    // 10. Test Multi-Part Copilot Query: "total sales and profit, with calculations"
    await page.evaluate(() => {
      if (window.aidaAskQuestion) {
        window.aidaAskQuestion('total sales and profit, with calculations');
      }
    });

    // 11. Assert Copilot Evidence Answer Card appears with both metrics, formulas, and filter context
    const answerToast = page.locator('text=Financial & Metric Aggregation Analysis:').first();
    await expect(answerToast).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Total Sales').first()).toBeVisible();
    await expect(page.locator('text=Net Profit').first()).toBeVisible();
    await expect(page.locator('text=Operating Margin').first()).toBeVisible();
    await expect(page.locator('text=Active Filters:').first()).toBeVisible();

    // 12. Verify Privacy Modal contains coherent policy (Browser Sandbox, Tenant Isolation, User Deletion)
    const privacyBtn = page.locator('[data-testid="footer-privacy-btn"]');
    await expect(privacyBtn).toBeVisible();
    await privacyBtn.click();
    await expect(page.locator('text=In-Browser Local Processing').first()).toBeVisible();
    await expect(page.locator('text=Enterprise Cloud Storage & Tenant Isolation').first()).toBeVisible();
    await expect(page.locator('text=User-Initiated Permanent Deletion').first()).toBeVisible();
    const closeBtn = page.locator('[data-testid="legal-modal-close-btn"]');
    await closeBtn.click();

    // 13. Ensure zero unhandled runtime crash errors (ReferenceError, TypeError)
    const fatalErrors = errorLogs.filter(e => e.includes('ReferenceError') || e.includes('TypeError') || e.includes('Uncaught'));
    expect(fatalErrors).toHaveLength(0);
  });
});
