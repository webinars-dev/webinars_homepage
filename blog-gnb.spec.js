const { test, expect } = require('@playwright/test');

const BLOG_PAGE_URL = process.env.BLOG_PAGE_URL || 'http://127.0.0.1:4173/blog/';

async function readHeaderSignature(page) {
  return page.evaluate(() => {
    const header = document.querySelector('#header-outer');
    const firstLink = document.querySelector('#header-outer nav > ul.sf-menu > li > a');
    const firstLabel = firstLink?.querySelector('.menu-title-text');

    return {
      attrs: {
        hasButtons: header?.getAttribute('data-has-buttons'),
        transparencyOption: header?.getAttribute('data-transparency-option'),
        boxShadow: header?.getAttribute('data-box-shadow'),
        padding: header?.getAttribute('data-padding'),
        fullWidth: header?.getAttribute('data-full-width'),
      },
      computed: {
        backgroundColor: header ? getComputedStyle(header).backgroundColor : null,
        boxShadow: header ? getComputedStyle(header).boxShadow : null,
        firstLabelColor: firstLabel ? getComputedStyle(firstLabel).color : null,
      },
      logoClasses: Array.from(document.querySelectorAll('#logo img')).map((img) => img.className),
      menuLabels: Array.from(
        document.querySelectorAll('#header-outer nav > ul.sf-menu > li > a .menu-title-text')
      ).map((node) => node.textContent),
    };
  });
}

async function readUnderlineState(page, itemId) {
  return page.evaluate((currentItemId) => {
    const link = document.querySelector(`#${currentItemId} > a`);
    const label = document.querySelector(`#${currentItemId} .menu-title-text`);
    const pseudo = label ? getComputedStyle(label, '::after') : null;

    return {
      hovered: link ? link.matches(':hover') : false,
      borderTopColor: pseudo ? pseudo.borderTopColor : null,
    };
  }, itemId);
}

test.describe('블로그 GNB', () => {
  test('공통 내부 페이지와 같은 GNB 구조와 핵심 스타일을 사용한다', async ({ page }) => {
    await page.goto(BLOG_PAGE_URL, { waitUntil: 'domcontentloaded' });
    const blogHeader = await readHeaderSignature(page);

    expect(blogHeader.attrs).toEqual({
      hasButtons: 'no',
      transparencyOption: '',
      boxShadow: 'none',
      padding: '36',
      fullWidth: 'true',
    });

    expect(blogHeader.computed.boxShadow).toBe('none');
    expect(blogHeader.computed.firstLabelColor).toBe('rgb(0, 0, 0)');
    expect(blogHeader.logoClasses).toEqual([
      'stnd skip-lazy default-logo',
      'starting-logo skip-lazy default-logo',
      'starting-logo dark-version skip-lazy default-logo',
    ]);
    expect(blogHeader.menuLabels).toEqual([
      'about',
      'services',
      'reference',
      'Contact',
      'Blog',
    ]);

    expect(blogHeader.computed.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(blogHeader.attrs).toMatchObject({
      hasButtons: 'no',
    });
  });

  test('hover underline이 내부 페이지와 같은 검정 색상으로 표시된다', async ({ page }) => {
    await page.goto(BLOG_PAGE_URL, { waitUntil: 'domcontentloaded' });

    const headerClass = await page.locator('#header-outer').getAttribute('class');
    expect(headerClass).toContain('detached');
    expect(headerClass).toContain('at-top');
    expect(headerClass).not.toContain('transparent');

    await page.locator('#menu-item-1689 > a').hover();
    const underline = await readUnderlineState(page, 'menu-item-1689');

    expect(underline.hovered).toBe(true);
    expect(underline.borderTopColor).toBe('rgb(0, 0, 0)');
  });

  test('아래로 스크롤하면 GNB가 숨겨지고 위로 스크롤하면 다시 보인다', async ({ page }) => {
    await page.goto(BLOG_PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#header-outer', { timeout: 15_000 });

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

    await page.evaluate(() => window.scrollTo(0, 700));
    await expect
      .poll(() =>
        page.evaluate(() => {
          const header = document.querySelector('#header-outer');
          return {
            className: header?.className || '',
            transform: header?.style.transform || '',
          };
        })
      )
      .toMatchObject({
        className: expect.stringContaining('invisible'),
        transform: expect.stringContaining('translateY(-'),
      });

    await page.evaluate(() => window.scrollTo(0, 200));
    await expect
      .poll(() =>
        page.evaluate(() => {
          const header = document.querySelector('#header-outer');
          return {
            className: header?.className || '',
            transform: header?.style.transform || '',
          };
        })
      )
      .toMatchObject({
        className: expect.not.stringContaining('invisible'),
        transform: 'translateY(0px)',
      });
  });

  test('태블릿 폭에서는 모바일 메뉴 버튼으로 GNB를 열 수 있다', async ({ page }) => {
    await page.setViewportSize({ width: 840, height: 964 });
    await page.goto(BLOG_PAGE_URL, { waitUntil: 'domcontentloaded' });

    const toggle = page.locator('.blog-mobile-menu-toggle');
    const mobileMenu = page.locator('#blog-mobile-menu');

    await expect(toggle).toBeVisible();
    await expect(page.locator('#header-outer nav[aria-label="주요 메뉴"]')).toBeHidden();
    await expect(mobileMenu).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(mobileMenu).toBeVisible();
    await expect(mobileMenu.locator('a')).toHaveText([
      'about',
      'services',
      'reference',
      'Contact',
      'Blog',
    ]);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileMenu).toBeHidden();
  });
});
