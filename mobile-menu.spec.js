const { test, expect } = require('@playwright/test');

const HOME_PAGE_URL = process.env.HOME_PAGE_URL || 'http://127.0.0.1:4173/';

test.describe('모바일 햄버거 메뉴', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('BLOG 메뉴가 보이고 스크롤 후에도 닫기 버튼이 화면에 남는다', async ({ page }) => {
    await page.goto(HOME_PAGE_URL, { waitUntil: 'domcontentloaded' });

    await page.locator('.slide-out-widget-area-toggle.mobile-icon a').first().click();

    const menu = page.locator('#slide-out-widget-area');
    await expect(menu).toBeVisible();

    const blogLink = menu.locator('.off-canvas-menu-container a[href$="/blog/"]');
    await expect(blogLink).toBeVisible();
    await expect(blogLink).toHaveText(/blog/i);
    await expect(blogLink.locator('xpath=ancestor::li[1]')).toHaveCSS('opacity', '1');

    const itemLayout = await menu.locator('.off-canvas-menu-container .menu:not(.secondary-header-items) li').evaluateAll((items) => (
      items.map((item) => {
        const rect = item.getBoundingClientRect();
        return {
          text: item.textContent.trim(),
          top: rect.top,
          bottom: rect.bottom,
        };
      })
    ));
    const contactItem = itemLayout.find((item) => item.text === 'Contact');
    const blogItem = itemLayout.find((item) => item.text === 'Blog');
    expect(blogItem.top).toBeGreaterThanOrEqual(contactItem.bottom - 1);

    await menu.evaluate((node) => {
      node.scrollTop = 260;
    });

    const closeButton = page.locator('#slide-out-widget-area .slide_out_area_close');
    await expect(closeButton).toBeVisible();

    const box = await closeButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(844);

    await closeButton.click();
    await expect(menu).toBeHidden();
  });
});
