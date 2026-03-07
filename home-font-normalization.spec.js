const { test, expect } = require('@playwright/test');

const HOME_PAGE_URL = process.env.HOME_PAGE_URL || 'http://127.0.0.1:4173/';

test.describe('홈 페이지 폰트 URL 정규화', () => {
  test('Hyphen-Sans 폰트가 유효한 로컬 자산 경로만 사용한다', async ({ page }) => {
    await page.goto(HOME_PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const { hyphenRules, dynamicStyleText } = await page.evaluate(() => {
      const matches = [];

      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }

        if (!rules) continue;

        for (const rule of Array.from(rules)) {
          const text = rule.cssText || '';
          if (text.includes('Hyphen-Sans')) {
            matches.push({
              href: sheet.href || 'inline',
              text,
            });
          }
        }
      }

      return {
        hyphenRules: matches,
        dynamicStyleText: document.getElementById('dynamic-css-inline-css')?.textContent || '',
      };
    });

    expect(
      hyphenRules.filter(({ text }) => text.includes('webinars.co.kr/wp/font/Hyphen-Sans'))
    ).toEqual([]);

    expect(
      hyphenRules.filter(({ text }) => text.includes('/wp/font/Hyphen-Sans'))
    ).toEqual([]);

    expect(dynamicStyleText).toContain('/fonts/Hyphen-Sans.woff2');
    expect(dynamicStyleText).not.toContain('webinars.co.kr/wp/font/Hyphen-Sans');
    expect(dynamicStyleText).not.toContain('/wp/font/Hyphen-Sans');
  });
});
