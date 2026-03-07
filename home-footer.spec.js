const { test, expect } = require('@playwright/test');

const HOME_PAGE_URL = process.env.HOME_PAGE_URL || 'http://127.0.0.1:4173/';

test.describe('홈 페이지 푸터', () => {
  test('공통 Footer 컴포넌트가 홈에서 렌더링된다', async ({ page }) => {
    await page.goto(HOME_PAGE_URL, { waitUntil: 'domcontentloaded' });

    const footer = page.locator('[data-testid="shared-footer"]');
    const title = page.locator('[data-testid="shared-footer-title"]');
    const emailLink = page.locator('[data-testid="shared-footer-email"]');

    await expect(footer).toBeVisible();
    await expect(footer).toHaveAttribute('data-footer-tone', 'light');
    await expect(footer).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(title).toHaveCSS('color', 'rgb(17, 17, 17)');
    await expect(page.locator('[data-testid="shared-footer-title"]')).toContainText('© 2022년 주식회사 웨비나스');
    await expect(page.locator('[data-testid="shared-footer-partnership"]')).toHaveCount(0);
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute('href', 'mailto:sales@webinars.co.kr');
    await expect(page.locator('[data-testid="shared-footer-tel"] a[href="/contact/"]')).toBeVisible();
    await expect(page.locator('#footer-outer')).toHaveCount(0);
  });
});
