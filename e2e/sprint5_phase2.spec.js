import { test, expect } from '@playwright/test';

test.describe('Sprint 5 Phase 2 — Workspace Command Center & AI Decision Center', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('aida_token', 'test-token-phase2-123');
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

  test('CC-01: Command Center renders greeting, active dataset metadata and header actions', async ({ page }) => {
    // Command Center should be visible on default dashboard view
    const commandCenter = page.locator('[data-testid="workspace-command-center"]');
    await expect(commandCenter).toBeVisible({ timeout: 10000 });

    // Dynamic greeting should include user name "Tulasi"
    const greeting = page.locator('[data-testid="command-center-greeting"]');
    await expect(greeting).toBeVisible();
    await expect(greeting).toContainText('Tulasi');

    // Header buttons should be present
    await expect(page.locator('[data-testid="command-center-upload-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="command-center-decisions-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="command-center-lineage-btn"]')).toBeVisible();
  });

  test('CC-02: 6 Interactive Metric Cards render with metrics', async ({ page }) => {
    await expect(page.locator('[data-testid="metric-health"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="metric-records"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-findings"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-transformations"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-forecast"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-models"]')).toBeVisible();
  });

  test('CC-03: Quick Decisions button opens Decision Inbox modal', async ({ page }) => {
    const decisionsBtn = page.locator('[data-testid="command-center-decisions-btn"]');
    await expect(decisionsBtn).toBeVisible({ timeout: 10000 });
    await decisionsBtn.click();

    // Verify modal appears
    const modal = page.locator('[data-testid="decision-inbox-modal"]');
    await expect(modal).toBeVisible();

    // Close modal
    await page.locator('[data-testid="close-decision-inbox"]').click();
    await expect(modal).not.toBeVisible();
  });

  test('CC-04: Workspace Command Center tabs switch views cleanly', async ({ page }) => {
    await expect(page.locator('[data-testid="workspace-command-center"]')).toBeVisible({ timeout: 10000 });

    // Default tab is datasets
    await expect(page.locator('[data-testid="tab-content-datasets"]')).toBeVisible();

    // Switch to Pending AI Decisions tab
    await page.locator('[data-testid="tab-decisions"]').click();
    await expect(page.locator('[data-testid="tab-content-decisions"]')).toBeVisible();

    // Switch to Live Audit & Lineage tab
    await page.locator('[data-testid="tab-activity"]').click();
    await expect(page.locator('[data-testid="tab-content-activity"]')).toBeVisible();

    // Switch to 9-Stage Workflow Jump tab
    await page.locator('[data-testid="tab-stages"]').click();
    await expect(page.locator('[data-testid="tab-content-stages"]')).toBeVisible();
    await expect(page.locator('[data-testid="stage-card-raw"]')).toBeVisible();
    await expect(page.locator('[data-testid="stage-card-quality"]')).toBeVisible();
  });

  test('CC-05: Inline Decision Approval from Command Center', async ({ page }) => {
    // Switch to Pending AI Decisions tab
    await page.locator('[data-testid="tab-decisions"]').click();
    await expect(page.locator('[data-testid="tab-content-decisions"]')).toBeVisible({ timeout: 10000 });

    // Find the first approve button in the tab
    const approveBtn = page.locator('button[data-testid^="cc-approve-decision-"]').first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      // Should log an event and update decision state
      await page.waitForTimeout(500);
    }
  });

  test('DC-01: AI Decision Center renders all 4 Areas', async ({ page }) => {
    const decisionCenter = page.locator('[data-testid="ai-decision-center"]');
    await expect(decisionCenter).toBeVisible({ timeout: 10000 });

    // Check all 4 areas
    await expect(page.locator('[data-testid="dc-area-understands"]')).toBeVisible();
    await expect(page.locator('[data-testid="dc-area-recommends"]')).toBeVisible();
    await expect(page.locator('[data-testid="dc-area-changed"]')).toBeVisible();
    await expect(page.locator('[data-testid="dc-area-waiting"]')).toBeVisible();
  });

  test('DC-02 & DC-03: Area B Approve button and Area D Inbox Trigger', async ({ page }) => {
    await expect(page.locator('[data-testid="ai-decision-center"]')).toBeVisible({ timeout: 10000 });

    // Area D opens Decision Inbox
    const openInboxBtn = page.locator('[data-testid="dc-open-inbox-btn"]');
    await expect(openInboxBtn).toBeVisible();
    await openInboxBtn.click();
    await expect(page.locator('[data-testid="decision-inbox-modal"]')).toBeVisible();
    await page.locator('[data-testid="close-decision-inbox"]').click();

    // Area B inline recommendation approval
    const approveBtn = page.locator('[data-testid="dc-approve-btn"]');
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('CC-DYNAMIC: Upload new dataset dynamically reflects in Command Center & Decision Center', async ({ page }) => {
    const csvContent = 'transaction_id,customer_name,amount,region\nTX101,Acme Corp,4500,North\nTX102,Beta LLC,3200,South\nTX103,Gamma Inc,8900,East';

    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'transactions_q1.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: csvContent });

    // Verify dataset name in Command Center header
    await expect(page.locator('text=transactions_q1.csv').first()).toBeVisible({ timeout: 10000 });
    // Verify records metric displays 3 records
    await expect(page.locator('[data-testid="metric-records"]')).toContainText('3');
  });
});
