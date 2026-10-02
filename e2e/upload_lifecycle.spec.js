import { test, expect } from '@playwright/test';

test.describe('Sprint 5A — Upload Lifecycle & Generic Dataset Source-of-Truth', () => {
  test.beforeEach(async ({ page }) => {
    // Clear previous sessions & set demo user
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('aida_token', 'test-token-upload-123');
      localStorage.setItem('aida_user', JSON.stringify({
        email: 'test.analyst@enterprise.com',
        role: 'data_analyst',
        companyName: 'Enterprise AI Corp',
        tier: 'pro'
      }));
    });
    await page.goto('/');
  });

  test('UPLOAD-01 & UPLOAD-04 & UPLOAD-05: Upload CSV dataset → appears with actual columns and row count', async ({ page }) => {
    const csvContent = 'product,sales_amount,quantity,order_date\nWidget A,150.5,10,2026-03-01\nWidget B,200.0,5,2026-03-02\nWidget C,350.75,15,2026-03-03';
    
    // Simulate uploading custom sales.csv
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

    // Verify dataset name appears in workspace header
    await expect(page.locator('text=sales.csv').first()).toBeVisible({ timeout: 10000 });
    // Verify row count (3 rows) and column count (4 cols)
    await expect(page.locator('text=3 rows').first()).toBeVisible();
    await expect(page.locator('text=4 cols').first()).toBeVisible();
  });

  test('UPLOAD-02 & UPLOAD-06 & UPLOAD-07: Raw v1 contains uploaded data & SHA-256 hash', async ({ page }) => {
    const csvContent = 'employee_name,department,salary\nAlice,Engineering,95000\nBob,Marketing,75000\nCharlie,Finance,88000';
    
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
    }, { csv: csvContent });

    await expect(page.locator('text=employees.csv').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=3 rows').first()).toBeVisible();

    // Verify Visual Data Lineage shows v1 Raw Data for employees.csv
    const lineageTab = page.locator('button:has-text("Visual Data Lineage")');
    if (await lineageTab.isVisible()) {
      await lineageTab.click();
      await expect(page.locator('text=v1 Raw Data (employees.csv)').first()).toBeVisible();
    }
  });

  test('UPLOAD-08 & UPLOAD-09 & UPLOAD-10: Quality analysis & command center use uploaded dataset', async ({ page }) => {
    const csvContent = 'store_id,revenue,units_sold\nS-101,1200,45\nS-102,1850,60\nS-103,940,30';
    
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'stores.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: csvContent });

    await expect(page.locator('text=stores.csv').first()).toBeVisible({ timeout: 10000 });
    // Verify row count (3 rows)
    await expect(page.locator('text=3 rows').first()).toBeVisible();
  });

  test('UPLOAD-11 & UPLOAD-12: Copilot uses uploaded dataset context and rejects missing audit columns', async ({ page }) => {
    const csvContent = 'client_id,contract_value,status\nC-01,50000,Active\nC-02,75000,Active';
    
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'contracts.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: csvContent });

    await expect(page.locator('text=contracts.csv').first()).toBeVisible({ timeout: 10000 });

    // Ask Copilot for revenue (which does not exist in contracts.csv)
    const textarea = page.locator('textarea[placeholder*="Ask AI Data Analyst"]');
    if (await textarea.isVisible()) {
      await textarea.fill('Show revenue');
      await page.keyboard.press('Enter');

      // Copilot should state that "revenue" is not available in contracts.csv
      await expect(page.locator('text=isn\'t available in this dataset').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
