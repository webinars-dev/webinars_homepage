/**
 * migration-data.json을 Supabase에 삽입하는 스크립트
 *
 * 사용법: node scripts/insert-to-supabase.js
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

async function main() {
  console.log('Supabase 데이터 삽입 스크립트');
  console.log('='.repeat(50));

  // migration-data.json 읽기
  const dataPath = path.join(__dirname, '../temp/migration-data.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ migration-data.json 파일이 없습니다.');
    console.error('   먼저 migrate-references.js를 실행하세요.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`\n총 ${data.length}개의 레코드를 삽입합니다.\n`);

  // 기존 데이터 확인
  const { data: existing, error: checkError } = await supabase
    .from('reference_items')
    .select('modal_path')
    .is('deleted_at', null);

  if (checkError) {
    console.error('❌ 기존 데이터 확인 실패:', checkError.message);
    process.exit(1);
  }

  const existingPaths = new Set(existing?.map(item => item.modal_path) || []);
  console.log(`기존 레코드 수: ${existingPaths.size}`);

  // 새로운 데이터만 필터링
  const newItems = data.filter(item => !existingPaths.has(item.modal_path));
  console.log(`새로 삽입할 레코드 수: ${newItems.length}`);

  if (newItems.length === 0) {
    console.log('\n✅ 모든 데이터가 이미 존재합니다.');
    return;
  }

  // 데이터 삽입
  let successCount = 0;
  let failCount = 0;

  for (const item of newItems) {
    // 제목에서 줄바꿈 제거
    const cleanTitle = item.title.replace(/\n/g, ' ').trim();
    const cleanClient = item.client?.replace(/\n/g, ' ').trim() || '';

    const { error } = await supabase.from('reference_items').insert({
      category: item.category,
      title: cleanTitle,
      client: cleanClient,
      image_url: item.image_url,
      modal_path: item.modal_path,
      modal_html: item.modal_html,
      is_published: item.is_published,
    });

    if (error) {
      console.error(`❌ 삽입 실패 (${cleanTitle}):`, error.message);
      failCount++;
    } else {
      console.log(`✅ 삽입 성공: ${cleanTitle}`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`완료: 성공 ${successCount}개, 실패 ${failCount}개`);
}

main().catch(console.error);
