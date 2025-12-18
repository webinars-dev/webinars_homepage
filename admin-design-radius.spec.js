const { test, expect } = require('@playwright/test');

test.describe('Admin UI Design', () => {
  test('shadcn lyra(zinc/indigo) 테마가 적용된다', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.admin-ui')).toBeVisible();

    await page.waitForFunction(() => {
      const root = document.querySelector('.admin-ui');
      if (!root) return false;
      const radius = getComputedStyle(root).getPropertyValue('--radius').trim();
      return radius.length > 0;
    });

    const result = await page.evaluate(() => {
      const root = document.querySelector('.admin-ui');
      const card =
        document.querySelector('.admin-ui [data-testid="admin-login-card"]') ||
        document.querySelector('.admin-ui [class*="bg-card"]');
      if (!root || !card) return null;
      const rootStyles = getComputedStyle(root);
      const cardStyles = getComputedStyle(card);
      return {
        radiusVar: rootStyles.getPropertyValue('--radius').trim(),
        cardRadius: cardStyles.borderTopLeftRadius,
        fontFamily: rootStyles.fontFamily,
        primary: rootStyles.getPropertyValue('--primary').trim(),
      };
    });

    expect(result).not.toBeNull();
    expect(Number.parseFloat(result.radiusVar || '0')).toBeCloseTo(0.5, 3);
    expect(Number.parseFloat(result.cardRadius || '0')).toBeGreaterThan(0);
    expect(result.fontFamily).toMatch(/Inter/i);
    const primaryParts = String(result.primary || '')
      .trim()
      .split(/\s+/)
      .map((part) => Number.parseFloat(part));
    expect(primaryParts.length).toBeGreaterThanOrEqual(3);
    expect(primaryParts[0]).toBeCloseTo(0.51, 2);
    expect(primaryParts[1]).toBeCloseTo(0.23, 2);
    expect(primaryParts[2]).toBeCloseTo(277, 0);

    await page.screenshot({ path: 'temp/playwright-admin-radius.png', fullPage: true });
  });
});
