const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const readLocalEnvCredential = () => {
  try {
    const filePath = path.join(process.cwd(), '.env.local');
    const content = fs.readFileSync(filePath, 'utf8');

    const pick = (key) => {
      const match = content.match(new RegExp(`^${key}\\s*=\\s*(.+)\\s*$`, 'm'));
      if (!match) return null;
      return match[1].trim().replace(/^"|"$/g, '');
    };

    const email = pick('ADMIN_EMAIL') || pick('ID');
    const password = pick('ADMIN_PASSWORD') || pick('PW');
    return { email, password };
  } catch {
    return { email: null, password: null };
  }
};

test.describe('Admin Dashboard', () => {
  test('대시보드 기본 요소 렌더', async ({ page }) => {
    const envEmail = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;
    const fallback = readLocalEnvCredential();
    const email = envEmail || fallback.email;
    const password = envPassword || fallback.password;

    test.skip(!email || !password, 'ADMIN_EMAIL/ADMIN_PASSWORD 또는 .env.local(ID/PW) 설정이 필요합니다.');

    await page.goto('/admin/login');
    await page.getByLabel('이메일').fill(email);
    await page.getByLabel('비밀번호').fill(password);
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForURL(/\/admin\/(blog|reference)/, { timeout: 30_000 });

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'GA4 열기' })).toBeVisible();
    await expect(page.getByText('레퍼런스', { exact: true })).toBeVisible();
    await expect(page.locator('text=/is not a function/i')).toHaveCount(0);
  });
});
