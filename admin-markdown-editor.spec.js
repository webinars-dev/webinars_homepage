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

test.describe('Admin Markdown Editor', () => {
  test('본문(Markdown) 입력 텍스트 색상 확인', async ({ page }) => {
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
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();

    await page.goto('/admin/blog/new');
    await expect(page.getByText('본문 (Markdown)')).toBeVisible({ timeout: 15_000 });

    const textarea = page.locator('.rc-md-editor textarea').first();
    await expect(textarea).toBeVisible();

    const color = await textarea.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(255, 255, 255)');

    await textarea.fill('텍스트 색상 테스트');
    await page.screenshot({ path: 'temp/playwright-admin-markdown-color.png', fullPage: true });
  });
});

