const { test, expect } = require('@playwright/test');

test.describe('Blog Post Page', () => {
  test('작성자/조회수 메타 숨김', async ({ page }) => {
    await page.goto('/blog');

    await expect(page.getByRole('link', { name: '글 작성' })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: '블로그 카테고리' })).toBeVisible();

    const firstPostLink = page.locator('.blog-list-link').first();
    await expect(firstPostLink).toBeVisible({ timeout: 30_000 });
    await firstPostLink.click();

    await expect(page.locator('.post-author')).toHaveCount(0);
    await expect(page.locator('.post-views')).toHaveCount(0);
    await expect(page.locator('.post-author-box')).toHaveCount(0);
  });
});
