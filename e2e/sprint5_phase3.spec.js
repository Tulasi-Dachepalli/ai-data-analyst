import { test, expect } from '@playwright/test';

test.describe('Sprint 5 Phase 3 — Visual Data Lineage & Non-Destructive Restore', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('aida_token', 'test-token-phase3-123');
      localStorage.setItem('aida_user', JSON.stringify({
        email: 'tulasi.lead@enterprise.com',
        name: 'Tulasi',
        displayName: 'Tulasi',
        role: 'data_analyst',
        companyName: 'Enterprise AI Corp',
        tier: 'pro'
      }));
    });
    await page.goto('/');
  });

  test('LINEAGE-01 & LINEAGE-02 & LINEAGE-03: Lineage graph renders v1 node, hash, and decision provenance', async ({ page }) => {
    // 1. Upload sample dataset
    const csvContent = 'order_id,product,revenue\nORD-1,Widget A,150\nORD-2,Widget B,250\nORD-3,Widget C,350';
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'sales_lineage.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: csvContent });

    await expect(page.locator('text=sales_lineage.csv').first()).toBeVisible({ timeout: 10000 });

    // 2. Navigate to Lineage View via Command Center button
    const lineageBtn = page.locator('[data-testid="command-center-lineage-btn"]');
    await expect(lineageBtn).toBeVisible();
    await lineageBtn.click();

    // 3. Verify Lineage Graph container
    const lineageGraph = page.locator('[data-testid="lineage-graph-container"]');
    await expect(lineageGraph).toBeVisible({ timeout: 10000 });

    // 4. Verify v1 Raw Data node
    const v1Node = page.locator('[data-testid="lineage-node-v1"]');
    await expect(v1Node).toBeVisible();
    await v1Node.click();

    // 5. Verify Node Inspector details
    await expect(page.locator('[data-testid="lineage-node-inspector"]')).toBeVisible();
    await expect(page.locator('[data-testid="lineage-node-tag"]')).toContainText('v1 Raw Data');
    await expect(page.locator('[data-testid="lineage-node-hash"]')).toContainText('sha256-');
    await expect(page.locator('[data-testid="lineage-node-decision"]')).toBeVisible();
  });

  test('LINEAGE-04 & LINEAGE-05 & LINEAGE-06 & LINEAGE-07: Non-destructive restore creates v3 from v1 preserving v1 and v2', async ({ page }) => {
    // 1. Upload dataset
    const csvContent = 'id,amount\n1,100\n2,200\n3,300';
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'financials.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: csvContent });

    await expect(page.locator('text=financials.csv').first()).toBeVisible({ timeout: 10000 });

    // 2. Approve a decision to create version v2
    const decisionsTab = page.locator('[data-testid="tab-decisions"]');
    await decisionsTab.click();
    const approveBtn = page.locator('button[data-testid^="cc-approve-decision-"]').first();
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(500);

    // 3. Navigate to Lineage View
    await page.locator('[data-testid="command-center-lineage-btn"]').click();
    await expect(page.locator('[data-testid="lineage-graph-container"]')).toBeVisible({ timeout: 10000 });

    // 4. Verify v2 is visible and is current
    const v2Node = page.locator('[data-testid="lineage-node-v2"]');
    await expect(v2Node).toBeVisible();

    // 5. Select historical v1 node
    const v1Node = page.locator('[data-testid="lineage-node-v1"]');
    await v1Node.click();

    // 6. Verify "Restore to v1" button is enabled
    const restoreBtn = page.locator('[data-testid="lineage-restore-btn"]');
    await expect(restoreBtn).toBeVisible();
    await expect(restoreBtn).toContainText('Restore to v1');
    await restoreBtn.click();

    // 7. Verify VersionRestoreModal appears
    const modal = page.locator('[data-testid="version-restore-modal"]');
    await expect(modal).toBeVisible();

    // Enter audit reason
    const reasonInput = page.locator('[data-testid="restore-reason-input"]');
    await reasonInput.fill('Reverting back to clean raw snapshot');

    // Confirm restore
    await page.locator('[data-testid="confirm-restore-btn"]').click();
    await expect(modal).not.toBeVisible();

    // 8. Verify v3 node was created non-destructively
    const v3Node = page.locator('[data-testid="lineage-node-v3"]');
    await expect(v3Node).toBeVisible({ timeout: 10000 });
    await expect(v3Node).toContainText('v3');

    // Verify v1 and v2 still exist in the tree!
    await expect(page.locator('[data-testid="lineage-node-v1"]')).toBeVisible();
    await expect(page.locator('[data-testid="lineage-node-v2"]')).toBeVisible();
  });
});
