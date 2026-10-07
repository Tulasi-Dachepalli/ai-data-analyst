import { test, expect } from '@playwright/test';

test.describe('Beginner Mode Runtime Stability & Overview Tab Navigation', () => {
  test('Launches guest demo in Beginner Mode, verifies calculated quality, and navigates overview tabs without crash', async ({ page }) => {
    const errorLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      errorLogs.push(err.message);
    });

    // 1. Visit landing page and trigger live guest demo
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('aida_user_mode', 'beginner');
      localStorage.setItem('aida_onboarding_dismissed', 'true');
    });

    // Directly initialize demo session to simulate guest landing click
    await page.evaluate(() => {
      const demoUser = {
        fullName: 'Guest Executive',
        email: 'demo.executive@enterprise.com',
        role: 'ceo',
        companyName: 'Acme Enterprise (Demo)',
        tier: 'pro',
        isDemo: true
      };
      const demoToken = 'demo-session-token-' + Date.now();
      localStorage.setItem('aida_token', demoToken);
      localStorage.setItem('aida_user', JSON.stringify(demoUser));
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Trigger demo data load if not auto-triggered
    await page.evaluate(() => {
      window.dispatchEvent(new Event('trigger-explore-demo'));
    });

    // 2. Critical Stability Assertion: Safe Recovery Mode must NEVER appear
    const recoveryBanner = page.locator('text=Safe Recovery Mode');
    await expect(recoveryBanner).not.toBeVisible();

    // 3. Verify Executive Command Center is visible
    const execHeader = page.locator('text=Executive Command Center').first();
    await expect(execHeader).toBeVisible({ timeout: 15000 });

    // 4. Verify Beginner Mode is active
    const beginnerBadge = page.locator('text=Beginner Mode: ON').first();
    await expect(beginnerBadge).toBeVisible();

    // 5. Verify Data Quality Health is calculated (not missing or unhandled)
    const qualityKpi = page.locator('text=Data Health').first();
    await expect(qualityKpi).toBeVisible();
    await expect(page.locator('text=Calculated').first()).toBeVisible();

    // 6. Verify KPI "How calculated" transparency tooltip/pill is present
    const howCalcPill = page.locator('text=Formula:').first();
    await expect(howCalcPill).toBeVisible();

    // 7. Test Tab Switch: Switch to "4-Area Decision Hub"
    const decisionHubTabBtn = page.getByRole('button', { name: /4-Area Decision Hub/i });
    await expect(decisionHubTabBtn).toBeVisible();
    await decisionHubTabBtn.click();

    // Assert that all 4 business areas render cleanly
    await expect(page.locator('text=A. What AI Understands').first()).toBeVisible();
    await expect(page.locator('text=B. What AI Recommends').first()).toBeVisible();
    await expect(page.locator('text=C. Business Risks & Anomalies').first()).toBeVisible();
    await expect(page.locator('text=D. Strategic Decisions & Approvals').first()).toBeVisible();

    // Verify demo benchmark copy is clearly distinguished in demo mode
    await expect(page.locator('text=[Demo Benchmark]').first()).toBeVisible();

    // 8. Test Tab Switch: Switch back to "Executive KPIs"
    const kpisTabBtn = page.getByRole('button', { name: /Executive KPIs/i });
    await expect(kpisTabBtn).toBeVisible();
    await kpisTabBtn.click();

    // Assert that Key Business Performance Metrics returns cleanly
    await expect(page.locator('text=Key Business Performance Metrics').first()).toBeVisible();

    // 9. Verify Workspace Footer Links (Privacy, Terms, Help, Contact)
    const privacyBtn = page.locator('[data-testid="footer-privacy-btn"]');
    await expect(privacyBtn).toBeVisible();
    await privacyBtn.click();

    // Verify LegalHelpModal opens with Privacy content
    await expect(page.locator('text=Privacy Policy & Data Security').first()).toBeVisible();
    const closeBtn = page.locator('[data-testid="legal-modal-close-btn"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // 10. Verify no reference error or unhandled exceptions occurred
    const refErrors = errorLogs.filter(log => log.includes('isBeginnerMode is not defined') || log.includes('ReferenceError'));
    expect(refErrors).toEqual([]);
  });

  test('Uploads active custom dataset without budget/target columns → displays exact required copy', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('aida_user_mode', 'beginner');
      localStorage.setItem('aida_onboarding_dismissed', 'true');
      localStorage.setItem('aida_token', 'test-custom-token-999');
      localStorage.setItem('aida_user', JSON.stringify({
        email: 'ceo.user@corp.com',
        role: 'ceo',
        companyName: 'Custom Corp',
        tier: 'pro',
        isDemo: false
      }));
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Upload custom CSV without target or budget columns, with 1 missing cell
    const customCsv = 'product,sales,quantity\nAlpha,1000,5\nBeta,,3\nGamma,2000,8';
    await page.evaluate(({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], 'custom_sales.csv', { type: 'text/csv' });
      const container = new DataTransfer();
      container.items.add(file);
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.files = container.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { csv: customCsv });

    // Ensure dataset loads
    await expect(page.locator('text=custom_sales.csv').first()).toBeVisible({ timeout: 15000 });

    // Switch to 4-Area Decision Hub to check risk alerts
    const decisionHubTabBtn = page.getByRole('button', { name: /4-Area Decision Hub/i });
    await expect(decisionHubTabBtn).toBeVisible();
    await decisionHubTabBtn.click();

    // Must show exact copy: “Not available—target/budget data required.”
    const requiredCopy = page.locator('text=Not available—target/budget data required.').first();
    await expect(requiredCopy).toBeVisible();

    // Safe recovery mode should not be visible
    await expect(page.locator('text=Safe Recovery Mode')).not.toBeVisible();
  });
});
