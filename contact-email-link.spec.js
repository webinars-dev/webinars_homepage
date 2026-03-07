const { test, expect } = require('@playwright/test');

const CONTACT_PAGE_URL = process.env.CONTACT_PAGE_URL || 'http://127.0.0.1:4173/contact/';

test.describe('Contact 페이지 이메일 링크', () => {
  test('sales 이메일 링크가 mailto 프로토콜을 사용한다', async ({ page }) => {
    await page.goto(CONTACT_PAGE_URL, { waitUntil: 'domcontentloaded' });

    const salesLink = page.locator('a[href*="sales@webinars.co.kr"]').first();
    await expect(salesLink).toHaveText('sales@webinars.co.kr');
    await expect(salesLink).toHaveAttribute('href', 'mailto:sales@webinars.co.kr');
  });
});
