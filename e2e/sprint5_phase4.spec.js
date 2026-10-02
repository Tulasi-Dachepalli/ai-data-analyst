// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Sprint 5 Phase 4 — Enterprise Analysis Notebook & Visualization Studio', () => {

  test('VIZ-01 & VIZ-02: Visualization Studio renders and dynamically populates axes from active dataset', async ({ page }) => {
    await page.goto('/');

    // Upload sales.csv dataset
    const csvContent = 'transaction_id,amount,customer_id,region\nTX101,150.50,CUST1,North\nTX102,230.00,CUST2,South';
    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles({
      name: 'sales.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Wait for dataset to be loaded
    await expect(page.locator('text=sales.csv').first()).toBeVisible({ timeout: 15000 });

    // Open Visualization Studio via sidebar or URL/state
    const studioNav = page.locator('button, a, span').filter({ hasText: /Studio|Visual/i }).first();
    if (await studioNav.isVisible()) {
      await studioNav.click();
    } else {
      // Direct evaluate to switch view
      await page.evaluate(() => {
        window.__TEST_SET_VIEW__ && window.__TEST_SET_VIEW__('studio');
      });
    }

    // Visualization studio container should be visible
    const vizStudio = page.locator('[data-testid="viz-studio"]');
    await expect(vizStudio).toBeVisible({ timeout: 10000 });

    // Check provenance badge
    await expect(page.locator('[data-testid="viz-provenance-badge"]')).toContainText('sales.csv');

    // Select X Axis and Y Axis options should contain uploaded columns
    const xAxis = page.locator('[data-testid="viz-select-xaxis"]');
    await expect(xAxis).toBeVisible();
    const xOptions = await xAxis.locator('option').allTextContents();
    expect(xOptions).toContain('region');

    const yAxis = page.locator('[data-testid="viz-select-yaxis"]');
    const yOptions = await yAxis.locator('option').allTextContents();
    expect(yOptions).toContain('amount');

    // Change axes and click render
    await xAxis.selectOption('region');
    await yAxis.selectOption('amount');
    await page.locator('[data-testid="viz-select-type"]').selectOption('Line');
    await page.locator('[data-testid="viz-btn-generate"]').click();

    // Verify chart title updated
    const chartTitle = page.locator('[data-testid="viz-chart-title"]');
    await expect(chartTitle).toBeVisible();
    await expect(chartTitle).toContainText('Line Chart: amount vs region');
  });

  test('NOTEBOOK-01 & NOTEBOOK-02: Analysis Notebook renders dynamic dataset code blocks and folder tabs', async ({ page }) => {
    await page.goto('/');

    // Upload sales.csv dataset
    const csvContent = 'transaction_id,amount,customer_id,region\nTX101,150.50,CUST1,North\nTX102,230.00,CUST2,South';
    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles({
      name: 'sales.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await expect(page.locator('text=sales.csv').first()).toBeVisible({ timeout: 15000 });

    // Open Notebook
    const nbNav = page.locator('button, a, span').filter({ hasText: /Notebook/i }).first();
    if (await nbNav.isVisible()) {
      await nbNav.click();
    } else {
      await page.evaluate(() => {
        window.__TEST_SET_VIEW__ && window.__TEST_SET_VIEW__('notebook');
      });
    }

    const notebook = page.locator('[data-testid="analysis-notebook"]');
    await expect(notebook).toBeVisible({ timeout: 10000 });

    // Verify provenance badge mentions sales.csv
    await expect(page.locator('[data-testid="notebook-provenance-badge"]')).toContainText('sales.csv');

    // Verify SQL query contains sales table, NOT hardcoded audit_ops
    const sqlBlock = page.locator('[data-testid="notebook-sql-block"]').first();
    await expect(sqlBlock).toBeVisible();
    const sqlText = await sqlBlock.textContent();
    expect(sqlText).toContain('sales_csv');
    expect(sqlText).not.toContain('audit_ops');

    // Test folder filter
    await page.locator('[data-testid="notebook-folder-charts"]').click();
    await expect(page.locator('[data-testid="notebook-folder-charts"]')).toBeVisible();

    // Add a custom analysis entry
    await page.locator('[data-testid="notebook-btn-add"]').click();
    await page.locator('[data-testid="notebook-input-title"]').fill('Verify Q3 Regional Performance');
    await page.locator('[data-testid="notebook-btn-save"]').click();

    // Check custom entry appeared
    await expect(page.locator('text=Verify Q3 Regional Performance')).toBeVisible();
  });

});
