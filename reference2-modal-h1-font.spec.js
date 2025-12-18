const { test, expect } = require('@playwright/test');

test.describe('Reference2 Modal HTML', () => {
  test('H1(txt36)에 hyphen 폰트가 적용된다', async ({ page }) => {
    await page.goto('/reference2/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="reference2-grid"]', { timeout: 15000 });

    const fontResponse = await page.request.get('/images/fonts/Hyphen-Sans.woff2');
    expect(fontResponse.ok()).toBeTruthy();

    const result = await page.evaluate(() => {
      const wrapper = document.createElement('div');
      wrapper.className = 'reference2-modal-body';
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.innerHTML = '<h2 class=\"txt36\">HYBRID</h2><h2 class=\"modal-title\">HYBRID</h2>';
      document.body.appendChild(wrapper);

      const txtEl = wrapper.querySelector('h2.txt36');
      const legacyEl = wrapper.querySelector('h2.modal-title');

      const computedTxt = txtEl ? window.getComputedStyle(txtEl).fontFamily : '';
      const computedLegacy = legacyEl ? window.getComputedStyle(legacyEl).fontFamily : '';

      wrapper.remove();
      return { computedTxt, computedLegacy };
    });

    expect(result.computedTxt).toMatch(/hyphen/i);
    expect(result.computedLegacy).toMatch(/hyphen/i);
  });
});
