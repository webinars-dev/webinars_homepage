const { test, expect } = require('@playwright/test');

const REFERENCE_PAGE_URL = process.env.REFERENCE_PAGE_URL || '/reference/';

test('reference GNB is restored when stale hide transform remains at page top', async ({ page }) => {
  await page.goto(REFERENCE_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.reference2-card', { timeout: 15_000 });

  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const header = document.querySelector('#header-outer');
    header.classList.remove('at-top');
    header.classList.add('scrolling', 'invisible');
    header.style.transform = 'translateY(-96px)';
    window.dispatchEvent(new Event('wheel'));
  });

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const header = document.querySelector('#header-outer');
        const rect = header.getBoundingClientRect();
        const style = window.getComputedStyle(header);

        return {
          className: header.className,
          transform: style.transform,
          top: rect.top,
          opacity: style.opacity,
          visibility: style.visibility,
        };
      });
    })
    .toMatchObject({
      transform: 'none',
      top: 0,
      opacity: '1',
      visibility: 'visible',
    });
});
