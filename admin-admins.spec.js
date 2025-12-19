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

test.describe('Admin Admins Page', () => {
  test('관리자 관리 화면 접근/렌더', async ({ page }) => {
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

    await page.goto('/admin/admins');
    await expect(page.getByRole('heading', { name: '관리자 관리' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: '관리자 목록' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel('이메일')).toBeVisible();
    const createUserCheckbox = page.getByLabel('새 계정 생성');
    const passwordInput = page.locator('#admin-password');
    await expect(createUserCheckbox).toBeChecked();
    await expect(passwordInput).toBeEnabled();

    await createUserCheckbox.click();
    await expect(createUserCheckbox).not.toBeChecked();
    await expect(passwordInput).toBeDisabled();

    await createUserCheckbox.click();
    await expect(createUserCheckbox).toBeChecked();
    await expect(passwordInput).toBeEnabled();
    await expect(page.getByRole('button', { name: '수정' }).first()).toBeVisible();

    await page.getByRole('button', { name: '수정' }).first().click();
    await expect(page.getByRole('heading', { name: '관리자 정보 수정' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel('새 비밀번호 (선택)')).toBeVisible();
    await page.getByRole('button', { name: '취소' }).click();

    await page.screenshot({ path: 'temp/playwright-admin-admins.png', fullPage: true });
  });
});
