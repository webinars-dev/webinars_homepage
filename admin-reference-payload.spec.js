const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

test.describe('Admin Reference payload', () => {
  test('초기 목록 조회 컬럼에 modal_html을 포함하지 않는다', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/services/adminReferenceService.js'),
      'utf8'
    );

    const listColumns = source.match(/const ADMIN_REFERENCE_LIST_COLUMNS = \[([\s\S]*?)\]\.join/);
    expect(listColumns).not.toBeNull();
    expect(listColumns[1]).not.toContain('modal_html');

    const modalColumns = source.match(/const ADMIN_REFERENCE_LIST_COLUMNS_WITH_MODAL_HTML = \[([\s\S]*?)\]\.join/);
    expect(modalColumns).not.toBeNull();
    expect(modalColumns[1]).toContain('modal_html');
  });
});
