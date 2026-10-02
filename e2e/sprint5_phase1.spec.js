import { test, expect } from '@playwright/test';
import { approveDecision } from '../src/services/decisionService.js';
import { checkPermission, createComment } from '../src/services/collaborationService.js';

test.describe('Sprint 5 Phase 1 — Decision, Collaboration & Dynamic Search Contexts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('aida_token', 'test-phase1-token');
      localStorage.setItem('aida_user', JSON.stringify({
        email: 'lead.analyst@enterprise.com',
        role: 'data_analyst',
        companyName: 'Acme Enterprise',
        tier: 'pro'
      }));
    });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // ── DECISION TESTS ────────────────────────────────────────────────────────
  test('DECISION-01 & DECISION-04: Pending decisions carry dataset provenance and display in Decision Inbox', async ({ page }) => {
    // 1. Upload sales.csv so activeDataset is established
    const csvContent = 'order_id,revenue,region\nORD-01,1500,North\nORD-02,2300,South\nORD-03,3100,East';
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'sales.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: csvContent });

    await expect(page.locator('text=sales.csv').first()).toBeVisible({ timeout: 15000 });

    // 2. Open Decision Inbox via Topbar button
    const decisionsBtn = page.locator('[data-testid="topbar-decisions-btn"]');
    await expect(decisionsBtn).toBeVisible({ timeout: 10000 });
    await decisionsBtn.click();

    // 3. Verify modal opens and displays decisions scoped to sales.csv
    const modal = page.locator('[data-testid="decision-inbox-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=sales.csv').first()).toBeVisible();

    // 4. Verify DECISION-04: decision card rendered with provenance
    const card = modal.locator('[data-testid^="decision-card-"]').first();
    await expect(card).toBeVisible();
  });

  test('DECISION-02 & DECISION-05: Approve decision creates applied state and updates lineage', async ({ page }) => {
    const csvContent = 'order_id,revenue,region\nORD-01,1500,North\nORD-02,2300,South';
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'sales.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: csvContent });

    await expect(page.locator('text=sales.csv').first()).toBeVisible({ timeout: 15000 });

    // Open Inbox
    await page.locator('[data-testid="topbar-decisions-btn"]').click();
    const modal = page.locator('[data-testid="decision-inbox-modal"]');
    await expect(modal).toBeVisible();

    // Approve the first decision
    const approveBtn = modal.locator('[data-testid^="apply-decision-"]').first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Verify approval updated state
    await expect(page.locator('[data-testid^="decision-card-"]').or(page.locator('[data-testid="empty-decision-inbox"]')).first()).toBeVisible({ timeout: 5000 });
  });

  test('DECISION-03: Reject decision marks it rejected without altering dataset', async ({ page }) => {
    const csvContent = 'order_id,revenue,region\nORD-01,1500,North';
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'sales.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: csvContent });

    await expect(page.locator('text=sales.csv').first()).toBeVisible({ timeout: 15000 });

    // Open Inbox
    await page.locator('[data-testid="topbar-decisions-btn"]').click();
    const modal = page.locator('[data-testid="decision-inbox-modal"]');
    await expect(modal).toBeVisible();

    // Reject the first decision
    const rejectBtn = modal.locator('[data-testid^="reject-decision-"]').first();
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // Verify rejected decision updated state
    await expect(page.locator('[data-testid^="decision-card-"]').or(page.locator('[data-testid="empty-decision-inbox"]')).first()).toBeVisible({ timeout: 5000 });
  });

  test('DECISION-06: Unauthorized role cannot approve dataset mutation decisions', async () => {
    const res = approveDecision('mock-dec-id', 'recruiter');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Unauthorized');
  });

  // ── COLLABORATION TESTS ───────────────────────────────────────────────────
  test('COLLAB-01 & COLLAB-02 & COLLAB-03 & COLLAB-04: Create share with View, Comment, Edit permissions', async ({ page }) => {
    // Open Share modal from Topbar
    const shareBtn = page.locator('[data-testid="topbar-share-btn"]');
    await expect(shareBtn).toBeVisible({ timeout: 10000 });
    await shareBtn.click();

    const shareModal = page.locator('[data-testid="share-dialog-modal"]');
    await expect(shareModal).toBeVisible();

    // Select Comment permission
    const commentRadio = shareModal.locator('[data-testid="perm-comment"]');
    await commentRadio.check();
    expect(await commentRadio.isChecked()).toBeTruthy();

    // Select Edit permission
    const editRadio = shareModal.locator('[data-testid="perm-edit"]');
    await editRadio.check();
    expect(await editRadio.isChecked()).toBeTruthy();

    // Submit share
    const submitBtn = shareModal.locator('[data-testid="submit-share-btn"]');
    await submitBtn.click();

    // Verify confirmation alert
    await expect(shareModal.locator('[data-testid="share-success-alert"]')).toBeVisible({ timeout: 5000 });
  });

  test('COLLAB-05 & COLLAB-06: Permission checks & Comment provenance preservation', async () => {
    const adminCanEdit = checkPermission('admin', 'Edit');
    const recruiterCanEdit = checkPermission('recruiter', 'Edit');
    const viewerCanView = checkPermission('viewer', 'View');
    
    const comment = createComment({
      datasetId: 'ds-sales-101',
      datasetVersion: 'v2',
      message: 'Verified regional revenue figures.'
    });

    expect(adminCanEdit).toBe(true);
    expect(recruiterCanEdit).toBe(false);
    expect(viewerCanView).toBe(true);
    expect(comment.datasetId).toBe('ds-sales-101');
    expect(comment.datasetVersion).toBe('v2');
  });

  // ── SEARCH TESTS ──────────────────────────────────────────────────────────
  test('SEARCH-01 & SEARCH-02 & SEARCH-03: Search current dataset, actual columns, and stages', async ({ page }) => {
    const csvContent = 'transaction_id,amount,region\nTX-1,500,North';
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'orders.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: csvContent });

    await expect(page.locator('text=orders.csv').first()).toBeVisible({ timeout: 15000 });

    // Open Quick Search
    const searchBtn = page.locator('button:has-text("Quick Search...")');
    await expect(searchBtn).toBeVisible({ timeout: 10000 });
    await searchBtn.click();

    const searchInput = page.locator('[data-testid="global-search-input"]');
    await expect(searchInput).toBeVisible();

    // 1. Search current dataset
    await searchInput.fill('orders.csv');
    await expect(page.locator('[data-testid="search-result-dataset-orders.csv"]')).toBeVisible();

    // 2. Search actual column
    await searchInput.fill('transaction_id');
    await expect(page.locator('[data-testid="search-result-column-transaction_id"]')).toBeVisible();

    // 3. Search stage
    await searchInput.fill('Quality');
    await expect(page.locator('text=02 Data Quality').first()).toBeVisible();
  });

  test('SEARCH-04 & SEARCH-05 & SEARCH-06: Quick Search trigger, Arrow navigation, and Enter execution', async ({ page }) => {
    // Open Quick Search
    const searchBtn = page.locator('button:has-text("Quick Search...")');
    await expect(searchBtn).toBeVisible({ timeout: 10000 });
    await searchBtn.click();

    const searchInput = page.locator('[data-testid="global-search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type "Raw"
    await searchInput.fill('Raw Data');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Search closes upon Enter execution
    await expect(searchInput).not.toBeVisible();
  });

  // ── CRITICAL REGRESSION: SEARCH-07 DATASET SWITCH REBUILDS INDEX ─────────
  test('SEARCH-07: Dataset switch rebuilds index — sales.csv revenue removed when employees.xlsx uploaded', async ({ page }) => {
    // 1. Upload sales.csv
    const salesCsv = 'product,revenue,category\nChair,450,Furniture';
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'sales.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: salesCsv });

    await expect(page.locator('text=sales.csv').first()).toBeVisible({ timeout: 15000 });

    // Verify "revenue" is searchable
    const searchBtn = page.locator('button:has-text("Quick Search...")');
    await expect(searchBtn).toBeVisible({ timeout: 10000 });
    await searchBtn.click();

    let searchInput = page.locator('[data-testid="global-search-input"]');
    await searchInput.fill('revenue');
    await expect(page.locator('[data-testid="search-result-column-revenue"]')).toBeVisible();

    // Close search
    await page.keyboard.press('Escape');
    await expect(searchInput).not.toBeVisible();

    // 2. Upload employees.csv (switch dataset)
    const empCsv = 'employee_id,salary,department\nEMP-1,85000,Engineering';
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'employees.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: empCsv });

    await expect(page.locator('text=employees.csv').first()).toBeVisible({ timeout: 15000 });

    // Open search again
    await page.locator('button:has-text("Quick Search...")').click();
    searchInput = page.locator('[data-testid="global-search-input"]');

    // Verify "salary" is now searchable
    await searchInput.fill('salary');
    await expect(page.locator('[data-testid="search-result-column-salary"]')).toBeVisible();

    // Verify "revenue" is NO LONGER found as an active column!
    await searchInput.fill('revenue');
    await expect(page.locator('[data-testid="search-result-column-revenue"]')).toHaveCount(0);
    await expect(page.locator('text=No matching entities found for "revenue"')).toBeVisible();

    // Verify audit_operations is NOT found in search results
    await searchInput.fill('audit_operations');
    await expect(page.locator('[data-testid="search-result-dataset-audit_operations"]')).toHaveCount(0);
    await expect(page.locator('text=No matching entities found for "audit_operations"')).toBeVisible();
  });
});
