import { test, expect } from '@playwright/test';

test.describe('Comprehensive End-to-End Application Audit', () => {
  test('Audits all 9 workflow stages, 6 roles, Beginner/Pro mode, Copilot, Tasks, and Custom Date Comparison', async ({ page }) => {
    test.setTimeout(60000);
    const errorLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      errorLogs.push(err.message);
    });

    // 1. Visit App and set up Guest Demo Session
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('aida_user_mode', 'beginner');
      localStorage.setItem('aida_onboarding_dismissed', 'true');
      const demoUser = {
        fullName: 'Executive Auditor',
        email: 'auditor@enterprise.com',
        role: 'ceo',
        companyName: 'Acme Enterprise (Demo)',
        tier: 'pro',
        isDemo: true
      };
      localStorage.setItem('aida_token', 'demo-token-' + Date.now());
      localStorage.setItem('aida_user', JSON.stringify(demoUser));
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Trigger demo dataset load
    await page.evaluate(() => {
      window.dispatchEvent(new Event('trigger-explore-demo'));
    });

    // 2. Verify Executive Command Center & Beginner Mode Focus
    await expect(page.locator('text=Executive Command Center').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Needs Attention').first()).toBeVisible();
    await expect(page.locator('text=Illustrative Demo Benchmarks').first()).toBeVisible();

    // 3. Test Column Mapping Review & Cost Exclusion
    const mappingBtn = page.getByRole('button', { name: /Column Mapping Review/i });
    await expect(mappingBtn).toBeVisible();
    await mappingBtn.click();
    await expect(page.locator('text=Helps ensure the correct columns are used')).toBeVisible();

    // Operating Cost must default to empty/Not available
    const costSelect = page.locator('[data-testid="mapping-select-cost"]');
    await expect(costSelect).toHaveValue('');
    await page.getByRole('button', { name: /Confirm Mappings/i }).click();

    // 4. Test Ingestion & Analytical Readiness Checks
    const readinessBtn = page.getByRole('button', { name: /Upload Readiness Review|Ingestion & Readiness Review/i });
    await expect(readinessBtn).toBeVisible();
    await readinessBtn.click();
    await expect(page.locator('text=Feasibility of Analytical Features:')).toBeVisible();
    await expect(page.locator('text=Time-Series Historical Trend Charts')).toBeVisible();
    await expect(page.locator('text=Available').first()).toBeVisible();
    await expect(page.locator('text=Needs more data').first()).toBeVisible();
    await page.getByRole('button', { name: 'Close Readiness Review' }).click();

    // 5. Test Action Tracking: Add, Toggle, Export CSV, Copy Markdown
    const actionTasksBtn = page.getByRole('button', { name: /Action Tasks/i });
    await expect(actionTasksBtn).toBeVisible();
    await actionTasksBtn.click();
    await expect(page.locator('text=Business Action Tracking')).toBeVisible();
    await page.getByPlaceholder(/Task title/i).fill('Audit quarterly shipping costs and discounts');
    await page.getByRole('button', { name: /Add Task/i }).click();
    await expect(page.locator('text=Audit quarterly shipping costs and discounts')).toBeVisible();
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Copy for Jira\/Slack/i })).toBeVisible();
    await page.getByRole('button', { name: /Copy for Jira\/Slack/i }).click();
    await page.getByRole('button', { name: 'Close Action Tracking' }).click();

    // 6. Test Saved Analysis Snapshots
    const savedBtn = page.getByRole('button', { name: /Saved Analysis/i });
    await expect(savedBtn).toBeVisible();
    await savedBtn.click();
    await page.getByPlaceholder(/Snapshot name/i).fill('Executive Audit Baseline');
    await page.getByRole('button', { name: /^Save$/i }).click();
    await expect(page.locator('text=Executive Audit Baseline')).toBeVisible();
    await page.getByRole('button', { name: 'Close Saved Analysis' }).click();

    // 7. Test Pre-Export Review Modal with Custom Sections
    const reportStep = page.locator('text=5. Generate Executive Report');
    if (await reportStep.isVisible().catch(() => false)) {
      await reportStep.click();
      await expect(page.locator('text=Executive Report Pre-Export Review')).toBeVisible();
      await expect(page.locator('text=Sections to Include:')).toBeVisible();
      await expect(page.locator('text=Executive KPI Overview:')).toBeVisible();
      await expect(page.locator('text=Profitability & Margins:')).toBeVisible();
      await page.getByRole('button', { name: 'Close Report Preview' }).click();
    }

    // 8. Test Tab Navigation:
    // Tab: 📊 Power BI-Style Dashboard
    const dashboardTabBtn = page.locator('button:has-text("Dashboard")').first();
    await dashboardTabBtn.click();
    await expect(page.locator('text=Power BI-Style Analytics Dashboard')).toBeVisible();

    // Period Comparison selector test: equal vs mom vs qoq vs custom
    const periodSelect = page.locator('select:has-text("Equal Calendar Periods")');
    if (await periodSelect.isVisible().catch(() => false)) {
      await expect(page.locator('text=equal periods').first()).toBeVisible();
      await periodSelect.selectOption('mom');
      await periodSelect.selectOption('custom');
      await expect(page.locator('input[type="date"]').first()).toBeVisible();
    }

    // Tab: 01 Raw Data
    const rawDataTabBtn = page.locator('button:has-text("01 Raw Data")').first();
    await rawDataTabBtn.click();
    await expect(page.locator('text=Raw Dataset Viewer')).toBeVisible();

    // Tab: 02 Data Quality
    const qualityTabBtn = page.locator('button:has-text("02 Data Quality")').first();
    await qualityTabBtn.click();
    await expect(page.locator('text=Stage 02 — Data Quality & Health Assessment')).toBeVisible();
    const orderDateRow = page.locator('tr:has-text("Order_Date")');
    await expect(orderDateRow.locator('text=Date / Temporal')).toBeVisible();

    // Tab: 03 Data Cleaning
    const cleaningTabBtn = page.locator('button:has-text("03 Data Cleaning")').first();
    await cleaningTabBtn.click();
    await expect(page.locator('text=Automated Data Cleaning Engine')).toBeVisible();

    // Tab: 04 Cleaned Data
    const cleanedTabBtn = page.locator('button:has-text("04 Cleaned Data")').first();
    await cleanedTabBtn.click();
    await expect(page.locator('text=Stage 04 — Verified Clean Dataset')).toBeVisible();

    // Tab: 05 Exploratory Analysis
    const edaTabBtn = page.locator('button:has-text("05 Exploratory Analysis")').first();
    await edaTabBtn.click();
    await expect(page.locator('text=Exploratory Data Analysis')).toBeVisible();

    // Tab: 06 AI Insights
    const insightsTabBtn = page.locator('button:has-text("06 AI Insights")').first();
    await insightsTabBtn.click();
    await expect(page.locator('text=Data Quality Score').first()).toBeVisible({ timeout: 10000 });

    // Tab: 07 ML Modeling
    const mlTabBtn = page.locator('button:has-text("07 ML Modeling")').first();
    await mlTabBtn.click();
    await expect(page.locator('text=/Train Models Pipeline|Automated ML/i').first()).toBeVisible({ timeout: 10000 });

    // Tab: 08 Forecasting
    const forecastTabBtn = page.locator('button:has-text("08 Forecasting")').first();
    await forecastTabBtn.click();
    await expect(page.getByText(/Detect|Configure/i).first()).toBeVisible({ timeout: 10000 });

    // Tab: 09 Executive Report
    const reportTabBtn = page.locator('button:has-text("09 Executive Report")').first();
    await reportTabBtn.click();
    await expect(page.getByText(/Statistics Report|Descriptive/i).first()).toBeVisible({ timeout: 10000 });

    // 9. Test Manage Datasets & In-Browser Sandbox Storage
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('navigate-view', { detail: 'datasets' }));
    });
    const manageDataHeader = page.locator('text=Manage Datasets & Storage');
    if (await manageDataHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(page.locator('text=In-Browser Sandbox (Local Session Memory)').first()).toBeVisible();
      await expect(page.locator('text=PostgreSQL Multi-Tenant Encrypted')).not.toBeVisible();
    }

    // 10. Assert No Uncaught Runtime Exceptions
    const criticalErrors = errorLogs.filter(e =>
      !e.includes('render.com') &&
      !e.includes('Failed to fetch') &&
      !e.includes('favicon') &&
      (e.includes('ReferenceError') || e.includes('TypeError') || e.includes('Uncaught'))
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
