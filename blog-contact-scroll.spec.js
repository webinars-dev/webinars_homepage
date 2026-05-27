const { test, expect } = require('@playwright/test');

const BLOG_POST_BASE_URL = process.env.BLOG_POST_BASE_URL || 'http://127.0.0.1:4173/blog';
const BLOG_POST_SLUGS = [
  'webinar-accident-prevention-checklist',
  'webinar-platform-selection-criteria-8-livee',
  'hybrid-event-agency-selection',
];

test.describe('Blog contact CTA navigation', () => {
  for (const slug of BLOG_POST_SLUGS) {
    test(`opens the contact page at the top from the blog CTA: ${slug}`, async ({ page }) => {
      await page.goto(`${BLOG_POST_BASE_URL}/${slug}`, { waitUntil: 'domcontentloaded' });

      const cta = page.locator('.post-content a[href*="contact"]').first();
      await expect(cta).toBeVisible({ timeout: 30_000 });
      await cta.scrollIntoViewIfNeeded();

      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

      await cta.click();

      await expect(page).toHaveURL(/\/contact\/?$/);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(5);
    });
  }
});
