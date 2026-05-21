const { test, expect } = require('@playwright/test');

test('reference list query keeps modal html out of the initial payload', async ({ page }) => {
  let referenceRequestUrl = null;
  const referencePageUrl = process.env.REFERENCE_PAGE_URL || '/reference/';

  await page.route('**/rest/v1/reference_items**', async (route) => {
    const request = route.request();
    if (request.method() !== 'GET') {
      await route.continue();
      return;
    }

    referenceRequestUrl = request.url();

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'reference-test-item',
          category: 'TEST',
          title: 'Fast reference item',
          client: 'Webinars',
          image_url: '',
          modal_path: '/WEBINAR/2024_offline_7/',
          col_span: 4,
          order: 1,
          created_at: '2026-05-21T00:00:00.000Z',
          updated_at: '2026-05-21T00:00:00.000Z',
        },
      ]),
    });
  });

  await page.goto(referencePageUrl);

  await expect(page.getByText('Fast reference item')).toBeVisible();
  expect(referenceRequestUrl).toContain('/rest/v1/reference_items');
  expect(referenceRequestUrl).not.toContain('modal_html');
});

test('reference page exits loading state when the list query fails', async ({ page }) => {
  const referencePageUrl = process.env.REFERENCE_PAGE_URL || '/reference/';

  await page.route('**/rest/v1/reference_items**', async (route) => {
    await route.abort('timedout');
  });

  await page.goto(referencePageUrl);

  await expect(page.getByText('레퍼런스 데이터를 불러오지 못했습니다.')).toBeVisible({ timeout: 3000 });
});
