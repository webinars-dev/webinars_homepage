const { test, expect } = require('@playwright/test');

const PAGE_URLS = {
  home: process.env.HOME_PAGE_URL || 'http://127.0.0.1:4173/',
  about: process.env.ABOUT_PAGE_URL || 'http://127.0.0.1:4173/about/',
  services: process.env.SERVICES_PAGE_URL || 'http://127.0.0.1:4173/services2/',
  contact: process.env.CONTACT_PAGE_URL || 'http://127.0.0.1:4173/contact/',
  reference: process.env.REFERENCE_PAGE_URL || 'http://127.0.0.1:4173/reference/',
  blog: process.env.BLOG_PAGE_URL || 'http://127.0.0.1:4173/blog/',
  modal: process.env.MODAL_PAGE_URL || 'http://127.0.0.1:4173/2024_hybrid_4/',
};

const FOOTER_TEXT_SELECTORS = {
  about: '[data-testid="shared-footer-title"]',
  services: '[data-testid="shared-footer-title"]',
  contact: '[data-testid="shared-footer-title"]',
  reference: '[data-testid="shared-footer-title"]',
  blog: '[data-testid="shared-footer-title"]',
};

async function getBoundingX(page, selector) {
  const box = await page.locator(selector).first().boundingBox();
  return box?.x ?? null;
}

test.describe('푸터 정렬', () => {
  test('공개 페이지에는 공통 Footer가 1개만 렌더링되고 모달에는 렌더링되지 않는다', async ({ page }) => {
    await page.setViewportSize({ width: 1840, height: 1200 });

    for (const url of [PAGE_URLS.home, PAGE_URLS.about, PAGE_URLS.services, PAGE_URLS.contact, PAGE_URLS.reference, PAGE_URLS.blog]) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-testid="shared-footer"]')).toHaveCount(1);
      await expect(page.locator('#footer-outer')).toHaveCount(0);
    }

    await page.goto(PAGE_URLS.modal, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="shared-footer"]')).toHaveCount(0);
    await expect(page.locator('#footer-outer')).toHaveCount(0);
    await expect(page.locator('.footer_partner')).toHaveCount(0);
    await expect(page.locator('.teldiv')).toHaveCount(0);
  });

  test('푸터 텍스트 시작점이 모든 페이지에서 동일하다', async ({ page }) => {
    await page.setViewportSize({ width: 1840, height: 1200 });

    const xPositions = {};

    for (const key of ['about', 'services', 'contact', 'reference', 'blog']) {
      const url = PAGE_URLS[key];
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      xPositions[key] = await getBoundingX(page, FOOTER_TEXT_SELECTORS[key]);
    }

    expect(xPositions.about).not.toBeNull();
    expect(xPositions.services).not.toBeNull();
    expect(xPositions.contact).not.toBeNull();
    expect(xPositions.reference).not.toBeNull();
    expect(xPositions.blog).not.toBeNull();

    expect(Math.abs(xPositions.about - xPositions.services)).toBeLessThanOrEqual(1);
    expect(Math.abs(xPositions.about - xPositions.contact)).toBeLessThanOrEqual(1);
    expect(Math.abs(xPositions.about - xPositions.reference)).toBeLessThanOrEqual(1);
    expect(Math.abs(xPositions.about - xPositions.blog)).toBeLessThanOrEqual(1);
  });

  test('페이지 컨텍스트에 맞춰 Footer 테마가 자동 전환된다', async ({ page }) => {
    await page.goto(PAGE_URLS.about, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="shared-footer"]')).toHaveAttribute('data-footer-tone', 'light');
    await expect(page.locator('[data-testid="shared-footer-title"]')).toHaveCSS('color', 'rgb(17, 17, 17)');

    await page.goto(PAGE_URLS.contact, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="shared-footer"]')).toHaveAttribute('data-footer-tone', 'dark');
    await expect(page.locator('[data-testid="shared-footer"]')).not.toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('[data-testid="shared-footer"]')).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('[data-testid="shared-footer-title"]')).toHaveCSS('color', 'rgb(255, 255, 255)');
  });

  test('contact 페이지 main 영역에는 레거시 푸터 정보가 남지 않는다', async ({ page }) => {
    await page.goto(PAGE_URLS.contact, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.InnerRow_Footer')).toHaveCount(0);
    await expect(page.getByText('PARTNERSHIP', { exact: true })).toHaveCount(0);
  });
});
