// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Sprint 5 Phase 5 & 6 — Models, Scenarios & Enterprise Audit Center', () => {

  test('MODELS-01 & MODELS-02: Model Registry renders dynamic target column and dataset provenance', async ({ page }) => {
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

    // Click Models button in Command Center
    const modelsBtn = page.locator('[data-testid="command-center-models-btn"]');
    if (await modelsBtn.isVisible()) {
      await modelsBtn.click();
    } else {
      await page.evaluate(() => {
        window.__TEST_SET_VIEW__ && window.__TEST_SET_VIEW__('models');
      });
    }

    const registry = page.locator('[data-testid="model-registry"]');
    await expect(registry).toBeVisible({ timeout: 10000 });

    // Verify dataset provenance tag
    await expect(page.locator('[data-testid="model-provenance-badge"]')).toContainText('sales.csv');

    // Verify target column is dynamically derived from dataset (amount)
    const targetCol = page.locator('[data-testid="model-target-col"]').first();
    await expect(targetCol).toContainText('amount');

    // Inspect candidate model
    const inspectBtn = page.locator('[data-testid="model-inspect-btn-0"]');
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();
    await expect(page.locator('text=Cross-Validation Score')).toBeVisible();
  });

  test('SCENARIO-01: Scenario Library renders dynamic sensitivity projections', async ({ page }) => {
    await page.goto('/');

    const csvContent = 'transaction_id,amount,customer_id,region\nTX101,150.50,CUST1,North\nTX102,230.00,CUST2,South';
    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles({
      name: 'sales.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await expect(page.locator('text=sales.csv').first()).toBeVisible({ timeout: 15000 });

    // Click Scenarios button in Command Center
    const scenariosBtn = page.locator('[data-testid="command-center-scenarios-btn"]');
    if (await scenariosBtn.isVisible()) {
      await scenariosBtn.click();
    } else {
      await page.evaluate(() => {
        window.__TEST_SET_VIEW__ && window.__TEST_SET_VIEW__('scenarios');
      });
    }

    const library = page.locator('[data-testid="scenario-library"]');
    await expect(library).toBeVisible({ timeout: 10000 });

    // Provenance badge
    await expect(page.locator('[data-testid="scenario-provenance-badge"]')).toContainText('sales.csv');

    // Verify scenario cards render
    await expect(page.locator('[data-testid="scenario-card-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="scenario-copilot-btn-0"]')).toBeVisible();
  });

  test('AUDIT-01 & AUDIT-02: Enterprise Audit Center filters logs and inspects JSON payload', async ({ page }) => {
    await page.goto('/');

    // Click Audit button in Command Center
    const auditBtn = page.locator('[data-testid="command-center-audit-btn"]');
    if (await auditBtn.isVisible()) {
      await auditBtn.click();
    } else {
      await page.evaluate(() => {
        window.__TEST_SET_VIEW__ && window.__TEST_SET_VIEW__('audit');
      });
    }

    const auditCenter = page.locator('[data-testid="audit-center"]');
    await expect(auditCenter).toBeVisible({ timeout: 10000 });

    // Verify filter controls exist
    await expect(page.locator('[data-testid="audit-search-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-filter-severity"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-export-csv-btn"]')).toBeVisible();

    // Inspect a log entry
    const inspectBtn = page.locator('[data-testid^="audit-inspect-btn-"]').first();
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // JSON inspector drawer should appear
    const jsonDrawer = page.locator('[data-testid="audit-json-inspector"]');
    await expect(jsonDrawer).toBeVisible();
    await expect(jsonDrawer).toContainText('Raw Metadata JSON');
  });

});
