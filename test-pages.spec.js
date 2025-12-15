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
});
