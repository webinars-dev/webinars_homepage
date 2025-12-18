/**
 * WordPress 아카이브 레퍼런스를 Supabase DB로 마이그레이션하는 스크립트
 *
 * 사용법: node scripts/migrate-references.js
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// 아카이브 페이지 디렉토리
const ARCHIVE_DIR = path.join(__dirname, '../archive/pages');

/**
 * reference.html에서 모든 카드 정보 추출
 */
function extractCardsFromReference() {
  const referencePath = path.join(ARCHIVE_DIR, 'reference.html');
  const html = fs.readFileSync(referencePath, 'utf-8');
  const $ = cheerio.load(html);

  const cards = [];

  // modal-link 클래스를 가진 모든 컬럼에서 카드 정보 추출
  $('.modal-link').each((i, element) => {
    const $el = $(element);
    const $link = $el.find('a.column-link');
    const href = $link.attr('href') || '';

    // modal_path 추출 (/wp/2024_offline_1028 -> 2024_offline_1028)
    const modalPathMatch = href.match(/\/wp\/(?:WEBINAR\/)?(.+)$/);
    const modalPath = modalPathMatch ? modalPathMatch[1] : '';

    if (!modalPath) return;

    // 카테고리 추출 (h1 태그에서)
    const categoryRaw = $el.find('.nectar-split-heading h1 span .inner').first().text().trim();
    const category = categoryRaw.toUpperCase();

    // 제목 추출 (두 번째 텍스트 블록에서)
    const $titleBlock = $el.find('.wpb_text_column .wpb_wrapper h5.line16').first();
    let title = $titleBlock.html() || '';
    title = title.replace(/<br\s*\/?>/g, ' ').trim();

    // 클라이언트 추출 (divider 다음 텍스트 블록에서)
    const $clientBlock = $el
      .find('.divider-small-border')
      .closest('.divider-wrap')
      .next('.wpb_text_column')
      .find('h5');
    let client = $clientBlock.html() || '';
    client = client.replace(/<br\s*\/?>/g, ' ').trim();

    // 썸네일 URL 추출
    const $bgImage = $el.find('.column-image-bg');
    const thumbnailUrl = $bgImage.attr('data-nectar-img-src') || '';

    if (title && category) {
      cards.push({
        category,
        title,
        client,
        thumbnailUrl,
        modalPath,
      });
    }
  });

  return cards;
}

/**
 * WordPress 아카이브 페이지에서 모달 HTML 추출
 */
function extractModalHtml(modalPath) {
  // modal_path를 파일명으로 변환
  // 2024_offline_1028 -> wp_2024_offline_1028.html
  // 2024_design_publication_1 -> 파일이 없을 수 있음
  const possibleFileNames = [
    `wp_${modalPath}.html`,
    `wp_${modalPath.replace(/\//g, '_')}.html`,
  ];

  for (const fileName of possibleFileNames) {
    const filePath = path.join(ARCHIVE_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf-8');
      const $ = cheerio.load(html);

      // modal-ready 섹션 추출
      const $modalReady = $('#modal-ready');
      if ($modalReady.length > 0) {
        // 스타일 정리: 불필요한 클래스 제거 및 이미지 URL 정리
        let modalHtml = $modalReady.html();

        // 이미지 URL을 절대경로로 변환
        modalHtml = modalHtml.replace(
          /src="http:\/\/webinars\.co\.kr/g,
          'src="https://webinars.co.kr'
        );

        return modalHtml.trim();
      }
    }
  }

  return null;
}

/**
 * 연도 추출 (제목이나 modal_path에서)
 */
function extractYear(title, modalPath) {
  // 제목에서 연도 추출
  const titleYearMatch = title.match(/(\d{4})/);
  if (titleYearMatch) {
    return parseInt(titleYearMatch[1]);
  }

  // modal_path에서 연도 추출
  const pathYearMatch = modalPath.match(/(\d{4})/);
  if (pathYearMatch) {
    return parseInt(pathYearMatch[1]);
  }

  return new Date().getFullYear();
}

/**
 * SQL INSERT 문 생성
 */
function generateInsertSQL(cards) {
  const values = cards
    .map((card) => {
      const year = extractYear(card.title, card.modalPath);
      const modalHtml = extractModalHtml(card.modalPath);

      // SQL 이스케이프
      const escape = (str) => {
        if (str === null || str === undefined) return 'NULL';
        return `'${str.replace(/'/g, "''")}'`;
      };

      return `(
    ${escape(card.category)},
    ${escape(card.title)},
    ${escape(card.client)},
    ${escape(card.thumbnailUrl)},
    ${escape('/wp/' + card.modalPath)},
    ${modalHtml ? escape(modalHtml) : 'NULL'},
    ${year},
    1,
    true,
    NOW(),
    NOW()
  )`;
    })
    .join(',\n');

  return `-- WordPress 아카이브 레퍼런스 마이그레이션
-- 생성일: ${new Date().toISOString()}

-- 기존 데이터 백업 권장: SELECT * INTO reference_items_backup FROM reference_items;

INSERT INTO reference_items (
  category,
  title,
  client,
  image_url,
  modal_path,
  modal_html,
  year,
  col_span,
  is_published,
  created_at,
  updated_at
) VALUES
${values};
`;
}

/**
 * JSON 데이터 생성 (미리보기용)
 */
function generateJSON(cards) {
  return cards.map((card) => {
    const year = extractYear(card.title, card.modalPath);
    const modalHtml = extractModalHtml(card.modalPath);

    return {
      category: card.category,
      title: card.title,
      client: card.client,
      image_url: card.thumbnailUrl,
      modal_path: '/wp/' + card.modalPath,
      modal_html: modalHtml,
      year,
      col_span: 1,
      is_published: true,
    };
  });
}

// 메인 실행
function main() {
  console.log('WordPress 아카이브 레퍼런스 마이그레이션 스크립트');
  console.log('='.repeat(50));

  // 카드 정보 추출
  console.log('\n1. reference.html에서 카드 정보 추출 중...');
  const cards = extractCardsFromReference();
  console.log(`   추출된 카드 수: ${cards.length}`);

  // 모달 HTML 추출 및 JSON 생성
  console.log('\n2. WordPress 아카이브에서 모달 HTML 추출 중...');
  const jsonData = generateJSON(cards);
  const withModalHtml = jsonData.filter((item) => item.modal_html);
  console.log(`   모달 HTML 추출 성공: ${withModalHtml.length}/${cards.length}`);

  // JSON 파일 저장
  const jsonPath = path.join(__dirname, '../temp/migration-data.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`\n3. JSON 데이터 저장됨: ${jsonPath}`);

  // SQL 파일 저장
  const sqlPath = path.join(__dirname, '../temp/migration.sql');
  const sql = generateInsertSQL(cards);
  fs.writeFileSync(sqlPath, sql, 'utf-8');
  console.log(`   SQL 파일 저장됨: ${sqlPath}`);

  // 요약 출력
  console.log('\n' + '='.repeat(50));
  console.log('마이그레이션 준비 완료!');
  console.log('\n다음 단계:');
  console.log('1. temp/migration-data.json 파일을 확인하세요.');
  console.log('2. Supabase SQL Editor에서 temp/migration.sql을 실행하세요.');
  console.log(
    '   또는 Admin 페이지에서 각 항목을 수동으로 추가할 수 있습니다.'
  );
}

main();
