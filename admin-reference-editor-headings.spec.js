const { test, expect } = require('@playwright/test');

test.describe('Admin Reference Editor', () => {
  test('H1/H2/H3가 txt 클래스 HTML로 저장된다', async ({ page }) => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    test.skip(!email || !password, 'ADMIN_EMAIL/ADMIN_PASSWORD 환경 변수가 필요합니다.');

    await page.goto('/admin/login');
    await page.getByLabel('이메일').fill(email);
    await page.getByLabel('비밀번호').fill(password);
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForURL(/\/admin\/blog/, { timeout: 30_000 });

    await page.goto('/admin/reference/new');
    await expect(page.getByRole('heading', { name: /새 레퍼런스|레퍼런스 수정/ })).toBeVisible({
      timeout: 15_000,
    });

    const editor = page.locator('.ql-editor').first();
    const toolbar = page.locator('#toolbar');

    await expect(editor).toBeVisible();

    // H1
    await editor.click();
    await page.keyboard.type('Hybrid');
    await toolbar.locator('button.ql-heading1').click();

    await expect.poll(async () => editor.evaluate((el) => el.innerHTML)).toContain(
      '<h2 class="txt36">Hybrid</h2>'
    );

    // H2
    await editor.click();
    await page.keyboard.press('Enter');
    await page.keyboard.type('글로벌 제약사 M 기자간담회');
    await toolbar.locator('button.ql-heading2').click();

    await expect.poll(async () => editor.evaluate((el) => el.innerHTML)).toContain(
      '<h5 class="txt18 w700 mt20">글로벌 제약사 M 기자간담회</h5>'
    );

    // H3
    await editor.click();
    await page.keyboard.press('Enter');
    await page.keyboard.type('일자');
    await toolbar.locator('button.ql-heading3').click();

    await expect.poll(async () => editor.evaluate((el) => el.innerHTML)).toContain(
      '<h5 class="txt18 w700 re_1">일자</h5>'
    );

    await page.screenshot({ path: 'temp/playwright-admin-reference-headings.png', fullPage: true });
  });
});

