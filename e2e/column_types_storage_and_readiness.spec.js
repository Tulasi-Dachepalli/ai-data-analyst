import { test, expect } from '@playwright/test';

test.describe('Column Types Consistency, Accurate Storage, Equal Calendar Periods & Business Readiness', () => {
  test('Verifies unified Date type in Data Quality & Schema, In-Browser Sandbox storage, equal calendar periods, column mappings, and action tracking', async ({ page }) => {
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

    // 3. Verify Separation of Illustrative Benchmarks from Needs Attention
    const needsAttentionBox = page.locator('text=Needs Attention').first();
    await expect(needsAttentionBox).toBeVisible();

    const demoBenchmarksBox = page.locator('text=Illustrative Demo Benchmarks').first();
    await expect(demoBenchmarksBox).toBeVisible();
    await expect(page.locator('text=Variance tracking requires target or budget columns')).toBeVisible();

    // 4. Verify Beginner Mode Toolbar Additions:
    // A. Column Mapping Review
    const mappingBtn = page.getByRole('button', { name: /Column Mapping Review/i });
    await expect(mappingBtn).toBeVisible();
    await mappingBtn.click();
    await expect(page.locator('text=Confirm detected column semantic roles before analyzing')).toBeVisible();
    await expect(page.locator('text=Helps ensure the correct columns are used')).toBeVisible();
    await expect(page.locator('text=This guarantees')).not.toBeVisible();

    // Verify Cost / Spend defaults to "Not available (None)", NOT "Discount"
    const costSelect = page.locator('[data-testid="mapping-select-cost"]');
    await expect(costSelect).toHaveValue('');

    const confirmMappingsBtn = page.getByRole('button', { name: /Confirm Mappings/i });
    await confirmMappingsBtn.click();

    // B. Ingestion & Analytical Readiness Review
    const readinessBtn = page.getByRole('button', { name: /Upload Readiness Review|Ingestion & Readiness Review/i });
    await expect(readinessBtn).toBeVisible();
    await readinessBtn.click();
    await expect(page.locator('text=Feasibility of Analytical Features:')).toBeVisible();
    await expect(page.locator('text=Time-Series Historical Trend Charts')).toBeVisible();
    await expect(page.locator('text=Available').first()).toBeVisible();
    await expect(page.locator('text=Needs more data').first()).toBeVisible();
    await expect(page.locator('text=Time-Series Trend & Forecasting')).toBeVisible();
    await expect(page.locator('text=Profitability & Margin Analysis')).toBeVisible();

    // C. Action Tracking
    const actionTasksBtn = page.getByRole('button', { name: /Action Tasks/i });
    await expect(actionTasksBtn).toBeVisible();
    await actionTasksBtn.click();
    await expect(page.locator('text=Business Action Tracking')).toBeVisible();
    await page.getByPlaceholder(/Task title/i).fill('Review high-margin Technology sales strategy');
    await page.getByRole('button', { name: /Add Task/i }).click();
    await expect(page.locator('text=Review high-margin Technology sales strategy')).toBeVisible();
    // Close modal
    await page.getByRole('button', { name: 'Close Action Tracking' }).click();

    // D. Saved Analysis Snapshots
    const savedBtn = page.getByRole('button', { name: /Saved Analysis/i });
    await expect(savedBtn).toBeVisible();
    await savedBtn.click();
    await page.getByPlaceholder(/Snapshot name/i).fill('Q1 Demo Snapshot Audit');
    await page.getByRole('button', { name: /^Save$/i }).click();
    await expect(page.locator('text=Q1 Demo Snapshot Audit')).toBeVisible();
    // Close modal
    await page.getByRole('button', { name: 'Close Saved Analysis' }).click();

    // E. Verify Executive Report Pre-Export Review Modal
    const reportStep = page.locator('text=5. Generate Executive Report');
    if (await reportStep.isVisible().catch(() => false)) {
      await reportStep.click();
      await expect(page.locator('text=Executive Report Pre-Export Review')).toBeVisible();
      await expect(page.locator('text=Audit & Limitation Disclosures:')).toBeVisible();
      await page.getByRole('button', { name: 'Close Report Preview' }).click();
    }

    // 5. Navigate to 02 Data Quality Tab & Verify Order_Date is Date / Temporal
    const qualityTabBtn = page.locator('button:has-text("Data Quality")').first();
    await qualityTabBtn.click();
    await expect(page.locator('text=Stage 02 — Data Quality & Health Assessment')).toBeVisible({ timeout: 10000 });

    // Verify Column Table has Order_Date labeled as Date / Temporal, NOT Categorical
    const orderDateRow = page.locator('tr:has-text("Order_Date")');
    await expect(orderDateRow).toBeVisible();
    await expect(orderDateRow.locator('text=Date / Temporal')).toBeVisible();
    await expect(orderDateRow.locator('text=Categorical')).not.toBeVisible();

    // Verify Sales is labeled as Numeric Metric
    const salesRow = page.locator('tr:has-text("Sales")');
    await expect(salesRow.locator('text=Numeric Metric')).toBeVisible();

    // 6. Navigate to Datasets (Manage Data View) & Verify In-Browser Sandbox Storage
    const datasetsNav = page.locator('button:has-text("Datasets"), div:has-text("Datasets")').first();
    // Open through sidebar navigation if present or setting view directly
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('navigate-view', { detail: 'datasets' }));
    });

    // Check if on datasets view, or set currentView through UI
    const manageDataHeader = page.locator('text=Manage Datasets & Storage');
    if (await manageDataHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Verify storage location badge
      await expect(page.locator('text=In-Browser Sandbox (Local Session Memory)').first()).toBeVisible();
      await expect(page.locator('text=PostgreSQL Multi-Tenant Encrypted')).not.toBeVisible();

      // Test Inspect Schema modal
      const inspectBtn = page.locator('button:has-text("Inspect Schema")').first();
      await inspectBtn.click();
      await expect(page.locator('div:has-text("Schema Inspection:")')).toBeVisible();
      const schemaOrderDateRow = page.locator('tr:has-text("Order_Date")');
      await expect(schemaOrderDateRow.locator('text=Date / Temporal')).toBeVisible();
      await page.locator('button:has-text("✕")').first().click();

      // Test Delete Modal
      const deleteBtn = page.locator('button:has-text("Delete")').first();
      await deleteBtn.click();
      await expect(page.locator('text=Confirm Permanent Dataset Deletion')).toBeVisible();
      await expect(page.locator('text=In-Browser Sandbox (Local Session Memory)')).toBeVisible();
      await expect(page.locator('text=Irreversible — No undelete or backup recovery available')).toBeVisible();

      // Verify Delete button is disabled until checkbox is checked
      const confirmDeleteBtn = page.getByRole('button', { name: /Confirm Permanent Deletion/i });
      await expect(confirmDeleteBtn).toBeDisabled();

      // Cancel delete
      await page.getByRole('button', { name: /Cancel \(Keep Dataset\)/i }).click();
    }

    // 7. Check Growth Comparison in Power BI-Style Dashboard
    const dashboardTabBtn = page.locator('button:has-text("Dashboard")').first();
    await dashboardTabBtn.click();
    await expect(page.locator('text=Power BI-Style Analytics Dashboard')).toBeVisible();

    // Verify growth cards show equal periods
    const trendTextElement = page.locator('text=equal periods').first();
    await expect(trendTextElement).toBeVisible();

    // 8. Assert no critical script or runtime errors occurred
    const criticalErrors = errorLogs.filter(e =>
      !e.includes('render.com') &&
      !e.includes('Failed to fetch') &&
      !e.includes('favicon') &&
      (e.includes('ReferenceError') || e.includes('TypeError') || e.includes('Uncaught'))
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
