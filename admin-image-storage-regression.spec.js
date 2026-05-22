const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test, expect } = require('@playwright/test');

function loadValidationModule() {
  const source = fs
    .readFileSync(path.join(process.cwd(), 'src/lib/imageStorageValidation.js'), 'utf8')
    .replace(/export function /g, 'function ');
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(
    `${source}\nmodule.exports = { assertNoLegacyImageReferences, hasLegacyImageReference };`,
    sandbox
  );
  return sandbox.module.exports;
}

test.describe('Admin image storage regression', () => {
  test('legacy image references are rejected before admin saves', async () => {
    const { assertNoLegacyImageReferences, hasLegacyImageReference } = loadValidationModule();

    expect(hasLegacyImageReference('/wp-content/uploads/2024/02/example.png')).toBe(true);
    expect(hasLegacyImageReference('https://webinars.co.kr/wp-content/uploads/2024/02/example.png')).toBe(true);
    expect(hasLegacyImageReference('<img src="data:image/png;base64,AAAA" />')).toBe(true);
    expect(
      hasLegacyImageReference(
        'https://eskwngynvszukwrvhkrw.supabase.co/storage/v1/object/public/blog-images/references/id/card-hash.png'
      )
    ).toBe(false);

    expect(() =>
      assertNoLegacyImageReferences({ image_url: '/wp-content/uploads/2024/02/example.png' }, '레퍼런스')
    ).toThrow(/legacy 이미지 참조/);

    expect(() =>
      assertNoLegacyImageReferences({ content: '<img src="data:image/png;base64,AAAA" />' }, '블로그')
    ).toThrow(/legacy 이미지 참조/);
  });
});
