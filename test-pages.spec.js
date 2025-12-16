const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.resolve(__dirname, 'temp');
const LIVE_URL = 'https://www.webinars.co.kr';

test.beforeAll(() => {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
});

test.describe('WEBINARS 디자인 검증', () => {
  test('홈 화면 로딩 및 실서버 비교', async ({ page, context }) => {
    test.setTimeout(90 * 1000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#header-outer', { timeout: 15000 });
    await expect(page).toHaveTitle(/WEBINARS/);

    const heroBg = await page.evaluate(() => {
      const el = document.querySelector('#main1 .row-bg');
      return el ? window.getComputedStyle(el).backgroundImage : '';
    });

    await page.screenshot({ path: path.join(TEMP_DIR, 'home-local.png'), fullPage: true });

    const livePage = await context.newPage();
    await livePage.setViewportSize({ width: 1440, height: 900 });
    await livePage.goto(LIVE_URL, { waitUntil: 'domcontentloaded' });
    await livePage.waitForSelector('#header-outer', { timeout: 15000 });
    await livePage.screenshot({ path: path.join(TEMP_DIR, 'home-live.png'), fullPage: true });

    const liveHeroBg = await livePage.evaluate(() => {
      const el = document.querySelector('#main1 .row-bg');
      return el ? window.getComputedStyle(el).backgroundImage : '';
    });

    // 로컬은 `/wp-content/...`로 정규화되고, 실서버는 도메인 포함 URL일 수 있음
    expect(heroBg).toMatch(/\/wp-content\/uploads\/2022\/11\/main\.jpg/);
    expect(liveHeroBg).toMatch(/webinars\.co\.kr\/wp-content\/uploads\/2022\/11\/main\.jpg/);

    await livePage.close();
  });

  test('서비스 섹션 배경 이미지 적용 확인', async ({ page }) => {
    await page.goto('/services2/', { waitUntil: 'networkidle' });
    const firstRowBg = page.locator('#service1 .row-bg').first();
    await firstRowBg.waitFor({ state: 'attached', timeout: 15000 });
    await firstRowBg.scrollIntoViewIfNeeded();

    const serviceIds = ['#service1', '#service2', '#service3', '#service4', '#service5'];
    const backgrounds = [];

    for (const id of serviceIds) {
      const bg = await page.$eval(
        `${id} .row-bg.viewport-desktop`,
        (node) => window.getComputedStyle(node).backgroundImage
      );
      backgrounds.push(bg);
    }

    // 로컬/프로덕션 모두 배경 URL이 존재하면 OK (로컬은 `/wp-content/...`로 정규화됨)
    backgrounds.forEach((bg) => expect(bg).toMatch(/(webinars\.co\.kr\/wp-content\/|\/wp-content\/)/));
  });

  test('레퍼런스2 페이지 로딩', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/reference2/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="reference2-grid"]', { timeout: 15000 });

    const legacyRowsCount = await page.locator('.wpb_row.reference').count();
    expect(legacyRowsCount).toBe(0);

    await page.waitForFunction(() => {
      const state = document.querySelector('.reference2-state');
      if (!state) return true;
      const text = state.textContent || '';
      return !text.includes('로딩');
    }, null, { timeout: 15000 });

    const cardCount = await page.locator('.reference2-card').count();
    if (cardCount === 0) test.skip(true, '등록된 카드가 없습니다.');

    const squareGridCount = await page.locator('.reference2-grid--square').count();
    expect(squareGridCount).toBeGreaterThan(0);

    const spanCardCount = await page.locator('.reference2-card[class*="--span-"]').count();
    expect(spanCardCount).toBe(0);
  });

  test('레퍼런스 페이지(3타입) 렌더링 확인', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/reference/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="reference2-grid"]', { timeout: 15000 });

    const legacyRowsCount = await page.locator('.wpb_row.reference').count();
    expect(legacyRowsCount).toBe(0);

    await page.waitForFunction(() => {
      const state = document.querySelector('.reference2-state');
      if (!state) return true;
      const text = state.textContent || '';
      return !text.includes('로딩');
    }, null, { timeout: 15000 });

    const cardCount = await page.locator('.reference2-card').count();
    if (cardCount === 0) test.skip(true, '등록된 카드가 없습니다.');

    const squareGridCount = await page.locator('.reference2-grid--square').count();
    expect(squareGridCount).toBe(0);

    const firstCard = page.locator('.reference2-card').first();
    await expect(firstCard).toBeVisible();

    const spans = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.reference2-card'));
      return nodes.map((node) => {
        const match = Array.from(node.classList)
          .map((className) => className.match(/reference2-card--span-(\d+)/))
          .find(Boolean);
        return match ? Number(match[1]) : 0;
      });
    });

    const hasOnlyValidTypes = spans.every((span) => [4, 8, 12].includes(span));
    expect(hasOnlyValidTypes).toBeTruthy();

    const typeSet = new Set(spans);
    expect(typeSet.size).toBeGreaterThan(0);
    expect(typeSet.size).toBeLessThanOrEqual(3);

    // 빈 칸 없이 채우기: 마지막 줄을 제외하고는 12 단위가 딱 맞아야 함
    const rowSums = [];
    let sum = 0;
    for (const span of spans) {
      sum += span;
      if (sum === 12) {
        rowSums.push(sum);
        sum = 0;
        continue;
      }
      if (sum > 12) {
        rowSums.push(sum);
        break;
      }
    }

    const hasOverflowRow = rowSums.some((rowSum) => rowSum > 12);
    expect(hasOverflowRow).toBeFalsy();
  });

  test('레퍼런스 카드 배경 이미지 로딩 확인', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/reference/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="reference2-grid"]', { timeout: 15000 });

    await page.waitForFunction(() => {
      const state = document.querySelector('.reference2-state');
      if (!state) return true;
      const text = state.textContent || '';
      return !text.includes('로딩');
    }, null, { timeout: 15000 });

    const cardCount = await page.locator('.reference2-card').count();
    if (cardCount === 0) test.skip(true, '등록된 카드가 없습니다.');

    await page.waitForFunction(() => {
      const nodes = Array.from(document.querySelectorAll('.reference2-card-bg'));
      return nodes.some((node) => {
        const bg = node.style && node.style.backgroundImage ? node.style.backgroundImage : '';
        return bg.includes('url(');
      });
    }, null, { timeout: 15000 });

    const { bgUrl, absoluteUrl, rawBg } = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.reference2-card-bg'));
      const target = nodes.find((node) => {
        const bg = node.style && node.style.backgroundImage ? node.style.backgroundImage : '';
        return bg.includes('url(');
      });

      const bg = target ? target.style.backgroundImage : '';
      const match = bg && bg.match(/url\((?:"|')?([^"')]+)(?:"|')?\)/);
      const url = match && match[1] ? match[1] : '';
      const abs = url ? new URL(url, window.location.origin).toString() : '';
      return { bgUrl: url, absoluteUrl: abs, rawBg: bg };
    });

    expect(rawBg).toMatch(/url\(/);
    expect(bgUrl, `rawBg=${rawBg}`).toBeTruthy();

    expect(bgUrl).toMatch(/\/wp-content\/uploads\//);

    const response = await page.request.get(absoluteUrl);
    expect(response.ok()).toBeTruthy();
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/^image\//);
  });
});
