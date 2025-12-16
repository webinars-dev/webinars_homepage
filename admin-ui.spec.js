const { test, expect } = require('@playwright/test');

test.describe('Admin UI', () => {
  test('레퍼런스 편집 화면 패딩/여백 확인', async ({ page }) => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    test.skip(!email || !password, 'ADMIN_EMAIL/ADMIN_PASSWORD 환경 변수가 필요합니다.');

    await page.goto('/admin/login');
    await page.getByLabel('이메일').fill(email);
    await page.getByLabel('비밀번호').fill(password);
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForURL(/\/admin\/blog/, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();

    await page.goto('/admin/reference/new');
    await expect(page.getByRole('heading', { name: /새 레퍼런스|레퍼런스 수정/ })).toBeVisible({
      timeout: 15_000,
    });

    const cardHeader = page.getByRole('heading', { name: '기본 정보' }).locator('..');
    await page.waitForFunction(() => {
      const value = getComputedStyle(document.documentElement).getPropertyValue('--spacing').trim();
      return value.length > 0;
    });

    await expect.poll(async () => {
      const paddingLeft = await cardHeader.evaluate((el) =>
        Number.parseFloat(getComputedStyle(el).paddingLeft || '0')
      );
      return paddingLeft;
    }).toBeGreaterThanOrEqual(16);

    const categoryInput = page.locator('#category');
    await expect.poll(async () => {
      const inputPaddingLeft = await categoryInput.evaluate((el) =>
        Number.parseFloat(getComputedStyle(el).paddingLeft || '0')
      );
      return inputPaddingLeft;
    }).toBeGreaterThanOrEqual(10);

    await page.screenshot({ path: 'temp/playwright-admin-reference-new.png', fullPage: true });
  });
});
