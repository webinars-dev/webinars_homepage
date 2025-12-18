/**
 * DB에 modal_html을 업데이트하는 스크립트
 * migration-data.json의 modal_html을 기존 레코드에 업데이트
 *
 * 사용법: node scripts/update-modal-html.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local에서 환경 변수 로드
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    });
  }
}

loadEnv();

// 환경 변수 설정
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eskwngynvszukwrvhkrw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// modal_path 정규화 함수
function normalizeModalPath(path) {
  if (!path) return '';
  let normalized = path.trim();

  // /wp/ 접두사 제거
  if (normalized.startsWith('/wp/')) {
    normalized = '/' + normalized.slice(4);
  }

  // 끝에 / 없으면 추가
  if (!normalized.endsWith('/')) {
    normalized = normalized + '/';
  }

  return normalized;
}

async function main() {
  console.log('modal_html 업데이트 스크립트');
  console.log('='.repeat(50));

  // migration-data.json 읽기
  const dataPath = path.join(__dirname, '../temp/migration-data.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ migration-data.json 파일이 없습니다.');
    console.error('   먼저 migrate-references.js를 실행하세요.');
    process.exit(1);
  }

  const migrationData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // modal_html이 있는 항목만 필터링
  const itemsWithModalHtml = migrationData.filter(item => item.modal_html);
  console.log(`\nmodal_html이 있는 항목: ${itemsWithModalHtml.length}개`);

  // modal_path로 매핑 생성
  const modalHtmlMap = new Map();
  itemsWithModalHtml.forEach(item => {
    const normalizedPath = normalizeModalPath(item.modal_path);
    if (normalizedPath) {
      modalHtmlMap.set(normalizedPath, item.modal_html);
    }
  });

  // DB에서 기존 레코드 가져오기
  const { data: existingItems, error: fetchError } = await supabase
    .from('reference_items')
    .select('id, modal_path, modal_html')
    .is('deleted_at', null);

  if (fetchError) {
    console.error('❌ 데이터 조회 실패:', fetchError.message);
    process.exit(1);
  }

  console.log(`DB 레코드 수: ${existingItems.length}`);

  // modal_html이 없는 항목 필터링
  const itemsToUpdate = existingItems.filter(item => {
    const normalizedPath = normalizeModalPath(item.modal_path);
    return !item.modal_html && modalHtmlMap.has(normalizedPath);
  });

  console.log(`업데이트 필요한 레코드: ${itemsToUpdate.length}개\n`);

  if (itemsToUpdate.length === 0) {
    console.log('✅ 모든 레코드가 이미 modal_html을 가지고 있습니다.');
    return;
  }

  // 업데이트 실행
  let successCount = 0;
  let failCount = 0;

  for (const item of itemsToUpdate) {
    const normalizedPath = normalizeModalPath(item.modal_path);
    const modalHtml = modalHtmlMap.get(normalizedPath);

    if (!modalHtml) {
      console.log(`⚠️ modal_html 없음: ${item.modal_path}`);
      continue;
    }

    const { error } = await supabase
      .from('reference_items')
      .update({ modal_html: modalHtml })
      .eq('id', item.id);

    if (error) {
      console.error(`❌ 업데이트 실패 (ID: ${item.id}):`, error.message);
      failCount++;
    } else {
      console.log(`✅ 업데이트 성공: ${item.modal_path}`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`완료: 성공 ${successCount}개, 실패 ${failCount}개`);
}

main().catch(console.error);
