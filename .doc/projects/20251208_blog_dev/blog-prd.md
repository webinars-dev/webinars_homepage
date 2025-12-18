# 블로그 기능 PRD

## 1. 개요

### 1.1 프로젝트 정보
- **프로젝트명**: Webinars V3 블로그 기능
- **작성일**: 2024-12-08
- **상태**: 계획 단계
- **우선순위**: High

### 1.2 배경
Webinars V3 웹사이트에 블로그 기능을 추가하여 회사 소식, 이벤트 후기, 웨비나 인사이트 등의 콘텐츠를 발행하고 관리할 수 있는 시스템을 구축합니다.

### 1.3 목표
- 회사 브랜딩 강화를 위한 콘텐츠 마케팅 플랫폼 구축
- SEO 개선을 통한 유기적 트래픽 증가
- 웨비나/이벤트 관련 인사이트 공유
- 고객 engagement 향상

---

## 2. 기능 요구사항

### 2.1 사용자 기능 (Frontend)

#### 2.1.1 블로그 목록 페이지 (`/blog`)
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 포스트 목록 | 최신순 정렬된 블로그 포스트 카드 목록 | P0 |
| 썸네일 이미지 | 각 포스트의 대표 이미지 표시 | P0 |
| 제목/요약 | 포스트 제목 및 요약(excerpt) 표시 | P0 |
| 날짜 표시 | 작성일/수정일 표시 | P0 |
| 카테고리 필터 | 카테고리별 포스트 필터링 | P1 |
| 태그 필터 | 태그별 포스트 필터링 | P1 |
| 페이지네이션 | 페이지당 10-12개 포스트, 무한 스크롤 또는 번호 방식 | P1 |
| 검색 | 제목/내용 키워드 검색 | P2 |

#### 2.1.2 블로그 상세 페이지 (`/blog/:slug`)
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 본문 렌더링 | Markdown/HTML 본문 렌더링 | P0 |
| 헤더 이미지 | 상단 대표 이미지 | P0 |
| 메타 정보 | 작성자, 작성일, 카테고리, 태그 | P0 |
| 목차(TOC) | 본문 헤딩 기반 목차 자동 생성 | P1 |
| 이전/다음 포스트 | 네비게이션 링크 | P1 |
| 관련 포스트 | 같은 카테고리/태그 포스트 추천 | P2 |
| 소셜 공유 | Twitter, LinkedIn, Facebook 공유 버튼 | P2 |

#### 2.1.3 카테고리 페이지 (`/blog/category/:category`)
- 특정 카테고리의 포스트만 필터링하여 표시
- 카테고리 설명 표시

#### 2.1.4 태그 페이지 (`/blog/tag/:tag`)
- 특정 태그가 포함된 포스트만 필터링하여 표시

### 2.2 관리자 기능 (Admin)

#### 2.2.1 포스트 관리
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 포스트 작성 | 새 포스트 작성 (Markdown 에디터) | P0 |
| 포스트 수정 | 기존 포스트 수정 | P0 |
| 포스트 삭제 | 포스트 삭제 (soft delete) | P0 |
| 임시 저장 | 드래프트 저장 | P1 |
| 예약 발행 | 미래 시간에 자동 발행 | P2 |
| 이미지 업로드 | 본문 내 이미지 업로드 | P0 |

#### 2.2.2 카테고리/태그 관리
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 카테고리 CRUD | 카테고리 생성/수정/삭제 | P1 |
| 태그 CRUD | 태그 생성/수정/삭제 | P1 |

---

## 3. 데이터 모델

### 3.1 Post (포스트)

```typescript
interface Post {
  id: string;                    // UUID
  slug: string;                  // URL 슬러그 (unique)
  title: string;                 // 제목
  excerpt: string;               // 요약 (150자 내외)
  content: string;               // 본문 (Markdown)
  featured_image: string | null; // 대표 이미지 URL
  author_id: string;             // 작성자 ID (생성자)
  category_id: string;           // 카테고리 ID
  status: 'draft' | 'scheduled' | 'published' | 'archived' | 'publish_failed'; // 상태
  published_at: Date | null;     // 발행일
  published_by: string | null;   // 발행자 ID
  scheduled_at: Date | null;     // 예약 발행 시간
  created_at: Date;              // 생성일
  updated_at: Date;              // 수정일
  updated_by: string | null;     // 최종 수정자 ID
  deleted_at: Date | null;       // Soft delete 시간
  deleted_by: string | null;     // 삭제자 ID
  publish_retry_count: number;   // 예약 발행 재시도 횟수 (DB default: 0)
  last_publish_attempt_at: Date | null; // 마지막 발행 시도 시각 (DB default: null)
  last_publish_error: string | null; // 마지막 발행 오류 메시지
  meta_title: string | null;     // SEO 제목
  meta_description: string | null; // SEO 설명
  view_count: number;            // 조회수 (DB default: 0)
}
```

#### DB 기본값 명시 (마이그레이션 필수)

```sql
-- 예약 발행 관련 필드 기본값
ALTER TABLE posts
  ALTER COLUMN publish_retry_count SET DEFAULT 0,
  ALTER COLUMN last_publish_attempt_at SET DEFAULT NULL,
  ALTER COLUMN view_count SET DEFAULT 0,
  ALTER COLUMN status SET DEFAULT 'draft';
```

> **변경사항**: `tags: string[]` 제거 → `post_tags` 조인 테이블로 분리 (3.5 참조)

### 3.2 Category (카테고리)
```typescript
interface Category {
  id: string;
  name: string;                  // 카테고리명 (예: "웨비나 인사이트")
  slug: string;                  // URL 슬러그
  description: string | null;    // 설명
  order: number;                 // 정렬 순서
  created_at: Date;
  updated_at: Date;
}
```

### 3.3 Tag (태그)
```typescript
interface Tag {
  id: string;
  name: string;                  // 태그명
  slug: string;                  // URL 슬러그
  created_at: Date;
}
```

### 3.4 Author (작성자)

```typescript
interface Author {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  role: 'admin' | 'editor' | 'author';  // 역할
  created_at: Date;
}
```

### 3.5 PostTag (포스트-태그 조인 테이블)

```typescript
interface PostTag {
  post_id: string;               // Post FK
  tag_id: string;                // Tag FK
  created_at: Date;
}
```

> **인덱스**: `(post_id, tag_id)` 복합 PK, `tag_id` 단일 인덱스 (태그별 조회용)

### 3.6 AuditLog (감사 로그)

```typescript
interface AuditLog {
  id: string;
  user_id: string;               // 작업자 ID
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
  target_type: 'post' | 'category' | 'tag';
  target_id: string;
  changes: Record<string, any> | null;  // 변경 내용 (JSON)
  created_at: Date;
}
```

### 3.7 역할 및 권한 정의

> **2024-12-08 업데이트**: 관리자(Admin) 전용 정책으로 간소화됨

| 역할 | 포스트 작성 | 포스트 수정 | 발행/비발행 | 삭제 | 카테고리/태그 관리 |
|------|-------------|-------------|-------------|------|---------------------|
| **일반 사용자** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |

> **참고**: 초기 MVP에서는 Admin만 글을 작성/수정/삭제할 수 있습니다. 향후 Author/Editor 역할 확장 가능.

### 3.8 RLS (Row Level Security) 정책

#### Posts 테이블

```sql
-- 읽기: 발행된 글은 누구나, 미발행은 작성자/Editor/Admin만
CREATE POLICY "Read posts" ON posts FOR SELECT USING (
  (status = 'published' AND deleted_at IS NULL)
  OR author_id = auth.uid()
  OR auth.jwt()->>'role' IN ('editor', 'admin')
);

-- 생성: Author 이상
CREATE POLICY "Create posts" ON posts FOR INSERT WITH CHECK (
  auth.jwt()->>'role' IN ('author', 'editor', 'admin')
  AND author_id = auth.uid()
);

-- 수정 (일반): 본인 글 또는 Editor/Admin, soft delete는 불가
CREATE POLICY "Update posts" ON posts FOR UPDATE USING (
  deleted_at IS NULL  -- 삭제된 글은 수정 불가
  AND (
    author_id = auth.uid()
    OR auth.jwt()->>'role' IN ('editor', 'admin')
  )
) WITH CHECK (
  -- Author/Editor는 deleted_at을 설정할 수 없음
  CASE WHEN auth.jwt()->>'role' IN ('author', 'editor')
    THEN NEW.deleted_at IS NULL
    ELSE TRUE
  END
  -- Author는 status를 published/scheduled로 변경 불가
  AND CASE WHEN auth.jwt()->>'role' = 'author'
    THEN NEW.status NOT IN ('published', 'scheduled')
    ELSE TRUE
  END
);

-- Soft Delete: Admin만 가능
CREATE POLICY "Soft delete posts" ON posts FOR UPDATE USING (
  auth.jwt()->>'role' = 'admin'
) WITH CHECK (
  auth.jwt()->>'role' = 'admin'
  AND NEW.deleted_at IS NOT NULL
  AND NEW.deleted_by = auth.uid()
);

-- Restore (복구): Admin만 삭제된 글 복구 가능
CREATE POLICY "Restore posts" ON posts FOR UPDATE USING (
  auth.jwt()->>'role' = 'admin'
  AND deleted_at IS NOT NULL  -- 삭제된 글만 대상
) WITH CHECK (
  auth.jwt()->>'role' = 'admin'
  AND NEW.deleted_at IS NULL  -- deleted_at을 NULL로 되돌림
  AND NEW.deleted_by IS NULL  -- deleted_by도 클리어
);
```

> **주의**: UPDATE 정책이 병렬 적용됩니다. 일반 수정은 "Update posts", soft delete는 "Soft delete posts", 복구는 "Restore posts" 정책으로 분리됩니다.

#### AuditLog 자동 기록 (Trigger)

```sql
-- 포스트 변경 시 자동 감사 로그
CREATE OR REPLACE FUNCTION log_post_changes()
RETURNS TRIGGER AS $$
DECLARE
  actor_id uuid;
BEGIN
  -- 사용자 ID 결정: auth.uid() > NEW.updated_by > 시스템 UUID
  actor_id := COALESCE(
    auth.uid(),
    NEW.updated_by,
    '00000000-0000-0000-0000-000000000000'::uuid
  );

  INSERT INTO audit_logs (user_id, action, target_type, target_id, changes)
  VALUES (
    actor_id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN OLD.status != 'published' AND NEW.status = 'published' THEN 'publish'
      WHEN OLD.status = 'published' AND NEW.status != 'published' THEN 'unpublish'
      WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN 'delete'
      ELSE 'update'
    END,
    'post',
    NEW.id,
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER post_audit_trigger
  AFTER INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION log_post_changes();
```

> **참고**: 서비스 역할 키로 호출 시 `auth.uid()`가 null이므로 `NEW.updated_by` 또는 시스템 UUID로 폴백합니다. 스케줄러 Edge Function에서 `updated_by`를 설정하면 해당 값이 AuditLog에 기록됩니다.

---

## 4. 기술 스택

### 4.1 현재 프로젝트 스택 (유지)
- Frontend: React 19, Vite 7, react-router-dom 7
- 스타일: 기존 WordPress CSS 유지
- 테스트: Playwright

### 4.2 추가 기술 스택 (검토 필요)

#### Option A: Supabase (권장)
| 항목 | 선택 | 이유 |
|------|------|------|
| Database | Supabase PostgreSQL | 무료 티어, 실시간 기능, 인증 내장 |
| Storage | Supabase Storage | 이미지 업로드, CDN 지원 |
| Auth | Supabase Auth | 관리자 인증 |
| Markdown | react-markdown + rehype | 클라이언트 렌더링 |

#### Option B: Headless CMS
| 항목 | 선택 | 이유 |
|------|------|------|
| CMS | Strapi / Contentful / Sanity | 콘텐츠 관리 UI 내장 |
| Storage | 클라우드 스토리지 (S3, Cloudinary) | 이미지 최적화 |

#### Option C: File-based (정적)
| 항목 | 선택 | 이유 |
|------|------|------|
| Content | Markdown 파일 (Git 저장) | 단순함, 버전 관리 |
| Build | Vite 플러그인 | 빌드 시 HTML 생성 |

### 4.3 추가 라이브러리 (예상)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",     // Supabase 클라이언트
    "react-markdown": "^9.x",             // Markdown 렌더링
    "react-markdown-editor-lite": "^1.x", // Markdown 에디터
    "rehype-highlight": "^7.x",           // 코드 하이라이팅
    "rehype-slug": "^6.x",                // 헤딩 앵커
    "rehype-sanitize": "^6.x",            // XSS 방지
    "date-fns": "^3.x"                    // 날짜 포맷팅
  }
}
```

### 4.4 예약 발행 스케줄러 정책

| 항목 | 정책 |
|------|------|
| 구현 방식 | **Supabase Scheduled Functions** (권장) |
| 대안 | 외부 Cron (GitHub Actions scheduled) → Edge Function 호출 |
| 실행 주기 | 매 분 |
| 대상 조회 | `status = 'scheduled' AND scheduled_at <= now()` |
| 발행 처리 | `status → 'published'`, `published_at = now()` |

#### 재시도 및 실패 처리

| 항목 | 정책 |
|------|------|
| 재시도 횟수 | 최대 3회 |
| 재시도 간격 | 1분 → 5분 → 15분 (지수 백오프) |
| 시도 시각 기록 | `last_publish_attempt_at` 필드에 매 시도 시 갱신 |
| 실패 기록 | `publish_retry_count`, `last_publish_error` 필드에 기록 |
| 데드레터 | 3회 연속 실패 시 `status → 'publish_failed'`, 관리자 알림 발송 |
| 알림 채널 | Slack 웹훅 또는 이메일 (환경변수로 설정) |

#### 수동 재시도 플로우 (publish_failed 복구)

관리자가 `publish_failed` 상태의 포스트를 수동으로 재시도하는 절차:

1. **관리자 UI에서 "재시도" 버튼 클릭**
2. **상태/카운터 리셋**:

   ```typescript
   await supabase
     .from('posts')
     .update({
       status: 'scheduled',
       scheduled_at: new Date().toISOString(),  // 즉시 또는 새 예약 시간
       publish_retry_count: 0,
       last_publish_attempt_at: null,
       last_publish_error: null,
       updated_by: currentUserId
     })
     .eq('id', postId)
     .eq('status', 'publish_failed');  // 안전장치
   ```

3. **스케줄러가 다음 실행 시 자동 처리**

> **대안**: 즉시 발행이 필요하면 status를 바로 `published`로 설정하고 `published_at`, `published_by`를 채움

#### 스케줄러 Edge Function 예시

```typescript
// supabase/functions/publish-scheduled/index.ts
import { createClient } from '@supabase/supabase-js';

const MAX_RETRIES = 3;
const RETRY_INTERVALS = [1, 5, 15]; // 분 단위: 1분 → 5분 → 15분 (지수 백오프)
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'; // 시스템 유저 UUID

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();

  // 발행 대상: scheduled 상태 + scheduled_at 도래 + 재시도 횟수 미초과
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, publish_retry_count, scheduled_at, last_publish_attempt_at')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now.toISOString())
    .lt('publish_retry_count', MAX_RETRIES)
    .is('deleted_at', null);

  if (error) {
    console.error('Failed to fetch scheduled posts:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = { published: 0, retried: 0, failed: 0, skipped: 0 };

  for (const post of posts ?? []) {
    // 재시도 간격 체크: 마지막 시도 시각 + 백오프 간격 이후에만 재시도
    if (post.publish_retry_count > 0 && post.last_publish_attempt_at) {
      const retryInterval = RETRY_INTERVALS[post.publish_retry_count - 1] ?? 15;
      const lastAttempt = new Date(post.last_publish_attempt_at);
      const nextRetryTime = new Date(lastAttempt.getTime() + retryInterval * 60 * 1000);
      if (now < nextRetryTime) {
        results.skipped++;
        continue; // 아직 재시도 시간 안 됨
      }
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'published',
        published_at: now.toISOString(),
        published_by: SYSTEM_USER_ID,
        updated_at: now.toISOString(),
        updated_by: SYSTEM_USER_ID,
        last_publish_attempt_at: now.toISOString(),
        last_publish_error: null  // 성공 시 에러 클리어
      })
      .eq('id', post.id);

    if (!updateError) {
      results.published++;
      // 프리렌더 재빌드 트리거
      try {
        await fetch(Deno.env.get('GITHUB_DEPLOY_WEBHOOK_URL')!, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${Deno.env.get('GITHUB_TOKEN')}` }
        });
      } catch (webhookError) {
        console.error('Prerender webhook failed:', webhookError);
        // 웹훅 실패는 발행 성공에 영향 없음 (로깅만)
      }
    } else {
      // 발행 실패: 재시도 횟수 증가
      const newRetryCount = post.publish_retry_count + 1;

      if (newRetryCount >= MAX_RETRIES) {
        // 데드레터: 최대 재시도 초과 → publish_failed 상태로 전환
        await supabase
          .from('posts')
          .update({
            status: 'publish_failed',
            publish_retry_count: newRetryCount,
            last_publish_attempt_at: now.toISOString(),
            last_publish_error: updateError.message,
            updated_at: now.toISOString(),
            updated_by: SYSTEM_USER_ID
          })
          .eq('id', post.id);

        // 관리자 알림 발송 (Slack 웹훅)
        const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
        if (slackWebhookUrl) {
          await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚨 예약 발행 실패 (데드레터)\n포스트: ${post.title}\nID: ${post.id}\n오류: ${updateError.message}`
            })
          });
        }
        results.failed++;
      } else {
        // 재시도 예약: 다음 시도까지 대기
        await supabase
          .from('posts')
          .update({
            publish_retry_count: newRetryCount,
            last_publish_attempt_at: now.toISOString(),
            last_publish_error: updateError.message,
            updated_at: now.toISOString(),
            updated_by: SYSTEM_USER_ID
          })
          .eq('id', post.id);
        results.retried++;
      }
    }
  }

  // 참고: AuditLog는 posts 테이블의 트리거(log_post_changes)가 자동 기록함
  // 서비스 키 사용 시 auth.uid()가 null이므로 트리거에서 coalesce 처리 필요

  return new Response(JSON.stringify(results));
});
```

> **주의**: 이 Edge Function은 서비스 역할 키를 사용하므로 `auth.uid()`가 null입니다. AuditLog 트리거에서 `coalesce(auth.uid(), 'system')` 처리가 필요합니다 (3.8 참조).

#### 호스팅 플랜 고려사항

| 플랜 | Scheduled Functions | 대안 |
|------|---------------------|------|
| Free | ❌ 미지원 | GitHub Actions cron + Edge Function 호출 |
| Pro | ✅ 지원 | 네이티브 사용 권장 |

### 4.5 이미지 저장소 정책 (Supabase Storage)

| 항목 | 정책 |
|------|------|
| 버킷 | `blog-images` |
| 경로 규칙 | `/{user_id}/{post_id}/{uuid}.{ext}` (업로더ID/포스트ID/UUID, 확장자 화이트리스트) |
| 허용 파일 | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` |
| 최대 크기 | 5MB |
| 썸네일 프리셋 | `thumb_400x300`, `card_800x600`, `hero_1600x900` |
| 캐시 TTL | `Cache-Control: public, max-age=31536000` (1년) |

#### 접근 권한 정책

| 작업 | 권한 |
|------|------|
| 읽기 (public) | 누구나 (CDN 캐시 활용) |
| 업로드 | Auth된 Author 이상만 (`auth.jwt()->>'role' IN ('author', 'editor', 'admin')`) |
| 삭제 | 본인 업로드 파일만 또는 Admin |

> **경로 규칙 설명**: 첫 번째 폴더가 업로더의 `user_id`이므로 삭제 정책에서 소유권 검증이 가능합니다.

**결정 필요**: Editor에게 타인 이미지 삭제 권한을 부여할지 여부

- **현재 정책**: Editor는 본인 업로드 파일만 삭제 가능 (Admin만 타인 파일 삭제)
- **대안**: Editor에게 자산 정리 권한 부여 시 삭제 정책에 `auth.jwt()->>'role' = 'editor'` 추가

#### Storage RLS 정책 예시

```sql
-- 읽기: 누구나
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

-- 업로드: Author 이상만, 본인 폴더에만 업로드 가능
CREATE POLICY "Auth upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.jwt()->>'role' IN ('author', 'editor', 'admin')
    AND (storage.foldername(name))[1] = auth.uid()::text  -- 본인 폴더에만
  );

-- 삭제: 본인 업로드 파일만 또는 Admin
CREATE POLICY "Delete own or admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text  -- 본인 폴더
      OR auth.jwt()->>'role' = 'admin'
    )
  );
```

> **참고**: `storage.foldername(name)`은 경로를 폴더 배열로 분리합니다. 경로가 `/{user_id}/{post_id}/{file}`이면 `[1]`은 `user_id`입니다.

#### WebP 변환 정책

| 항목 | 정책 |
|------|------|
| 변환 시점 | 업로드 시 Edge Function 호출 |
| 원본 보관 | 유지 (폴백용) |
| 변환 실패 시 | 원본 이미지 그대로 사용, 에러 로깅 |
| 변환 대상 | `.jpg`, `.png` → `.webp` (`.gif`는 변환 안 함) |

### 4.6 Markdown 에디터 보안 및 UX 기준

#### 보안 (XSS 방지)

```typescript
// rehype-sanitize 설정
const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'www.slideshare.net',
];

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...defaultSchema.tagNames, 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    img: ['src', 'alt', 'title', 'width', 'height'],
    a: ['href', 'title', 'target', 'rel'],
    code: ['className'],  // 코드 하이라이팅용
    iframe: [
      'src', 'width', 'height', 'title',
      'frameborder', 'allowfullscreen',
      ['sandbox', 'allow-scripts allow-same-origin allow-presentation'],
      ['allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'],
    ],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
    src: ['https'],  // https만 허용
  },
};

// iframe src 도메인 검증 (커스텀 플러그인)
function validateIframeSrc(node: Element) {
  if (node.tagName === 'iframe' && node.properties?.src) {
    const url = new URL(node.properties.src as string);
    if (!ALLOWED_IFRAME_HOSTS.includes(url.host)) {
      node.properties.src = '';  // 차단
    }
  }
}
```

#### iframe 허용 도메인

| 도메인 | 용도 |
|--------|------|
| `youtube.com`, `youtube-nocookie.com` | 동영상 임베드 |
| `player.vimeo.com` | 동영상 임베드 |
| `slideshare.net` | 프레젠테이션 임베드 |

> **주의**: 허용 도메인 외 iframe은 자동 제거됨

#### UX 기준

| 기능 | 지원 |
|------|------|
| 드래그 & 드롭 이미지 업로드 | ✅ |
| 클립보드 붙여넣기 (Ctrl+V) | ✅ |
| 실시간 미리보기 | ✅ (좌우 분할) |
| 자동 저장 | ✅ (30초마다 draft 저장) |
| 단축키 | Bold (Ctrl+B), Italic (Ctrl+I), Link (Ctrl+K) |
| 이미지 리사이즈 UI | ✅ (업로드 후 크기 선택) |

---

## 5. 페이지 구조

### 5.1 라우트 설계
```
/blog                           # 블로그 목록
/blog/:slug                     # 블로그 상세
/blog/category/:category        # 카테고리별 목록
/blog/tag/:tag                  # 태그별 목록
/admin/blog                     # 관리자: 포스트 목록 (인증 필요)
/admin/blog/new                 # 관리자: 새 포스트 작성
/admin/blog/edit/:id            # 관리자: 포스트 수정
```

### 5.2 컴포넌트 구조 (예상)
```
src/
├── components/
│   └── blog/
│       ├── BlogCard.jsx        # 포스트 카드
│       ├── BlogList.jsx        # 포스트 목록
│       ├── BlogDetail.jsx      # 포스트 상세
│       ├── BlogSidebar.jsx     # 사이드바 (카테고리, 태그)
│       ├── BlogPagination.jsx  # 페이지네이션
│       ├── BlogTOC.jsx         # 목차
│       └── MarkdownRenderer.jsx # Markdown 렌더러
├── pages/
│   └── blog/
│       ├── BlogIndexPage.jsx   # /blog
│       ├── BlogPostPage.jsx    # /blog/:slug
│       ├── BlogCategoryPage.jsx # /blog/category/:category
│       └── BlogTagPage.jsx     # /blog/tag/:tag
├── hooks/
│   └── useBlog.js              # 블로그 데이터 훅
└── services/
    └── blogService.js          # API 호출 로직
```

---

## 6. UI/UX 디자인

### 6.1 블로그 목록 페이지 레이아웃
```
┌─────────────────────────────────────────────────┐
│                    Header                        │
├─────────────────────────────────────────────────┤
│  [블로그]                           [검색 아이콘] │
│                                                  │
│  [카테고리 탭: 전체 | 웨비나 인사이트 | 이벤트 후기 | ...]│
├───────────────────────────┬─────────────────────┤
│                           │                      │
│  ┌─────────────────────┐ │  사이드바             │
│  │   썸네일 이미지      │ │  ├── 인기 포스트      │
│  │   제목              │ │  ├── 카테고리         │
│  │   요약...           │ │  └── 태그 클라우드    │
│  │   날짜 | 카테고리    │ │                      │
│  └─────────────────────┘ │                      │
│                           │                      │
│  ┌─────────────────────┐ │                      │
│  │   ...               │ │                      │
│  └─────────────────────┘ │                      │
│                           │                      │
│  [1] [2] [3] ... [다음]   │                      │
├───────────────────────────┴─────────────────────┤
│                    Footer                        │
└─────────────────────────────────────────────────┘
```

### 6.2 블로그 상세 페이지 레이아웃
```
┌─────────────────────────────────────────────────┐
│                    Header                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  [히어로 이미지 - 전체 너비]                      │
│                                                  │
├───────────────────────────┬─────────────────────┤
│                           │                      │
│  # 포스트 제목            │  목차 (TOC)           │
│                           │  ├── 섹션 1          │
│  작성자 | 2024.12.08      │  ├── 섹션 2          │
│  카테고리: 웨비나 인사이트  │  └── 섹션 3          │
│                           │                      │
│  본문 내용...             │  [공유 버튼]          │
│                           │                      │
│  ## 섹션 1                │                      │
│  ...                      │                      │
│                           │                      │
│  ## 섹션 2                │                      │
│  ...                      │                      │
│                           │                      │
│  태그: #웨비나 #하이브리드  │                      │
│                           │                      │
│  [← 이전 포스트] [다음 →]  │                      │
├───────────────────────────┴─────────────────────┤
│  관련 포스트                                     │
│  [카드1] [카드2] [카드3]                         │
├─────────────────────────────────────────────────┤
│                    Footer                        │
└─────────────────────────────────────────────────┘
```

### 6.3 디자인 가이드라인
- 기존 웹사이트 스타일 (Salient 테마) 유지
- 폰트: 기존 웹폰트 사용
- 색상: 기존 브랜드 컬러 유지
- 반응형: 모바일/태블릿/데스크톱 지원

---

## 7. SEO 요구사항

### 7.1 메타 태그
```html
<title>{포스트 제목} | Webinars 블로그</title>
<meta name="description" content="{포스트 요약}">
<meta name="keywords" content="{태그들}">

<!-- Open Graph -->
<meta property="og:title" content="{포스트 제목}">
<meta property="og:description" content="{포스트 요약}">
<meta property="og:image" content="{대표 이미지}">
<meta property="og:url" content="{포스트 URL}">
<meta property="og:type" content="article">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{포스트 제목}">
<meta name="twitter:description" content="{포스트 요약}">
<meta name="twitter:image" content="{대표 이미지}">
```

### 7.2 구조화된 데이터 (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{포스트 제목}",
  "image": "{대표 이미지}",
  "datePublished": "{발행일}",
  "dateModified": "{수정일}",
  "author": {
    "@type": "Person",
    "name": "{작성자}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Webinars"
  }
}
```

### 7.3 URL 구조

- 슬러그는 한글 또는 영문으로 작성
- 예: `/blog/2024-hybrid-event-trend` 또는 `/blog/2024년-하이브리드-이벤트-트렌드`

### 7.4 Prerender 파이프라인 (MVP)

| 항목 | 설정 |
|------|------|
| 도구 | `vite-plugin-ssg` 또는 `@prerenderer/rollup-plugin` |
| 대상 경로 | `/blog`, `/blog/:slug`, `/blog/category/:category`, `/blog/tag/:tag` |
| 빌드 시점 | CI/CD (GitHub Actions) 배포 시 자동 실행 |

#### 동적 경로 생성

```typescript
// prerender.config.ts
import { createClient } from '@supabase/supabase-js';

// 서비스 키 사용 (빌드 시에만, 환경변수로 주입)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!  // anon key 아님
);

export async function getRoutes(): Promise<string[]> {
  // 발행된 포스트 조회
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published')
    .is('deleted_at', null);

  if (postsError) {
    console.error('Failed to fetch posts:', postsError);
    throw postsError;
  }

  // 모든 카테고리 조회
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('slug');

  if (categoriesError) {
    console.error('Failed to fetch categories:', categoriesError);
    throw categoriesError;
  }

  // 모든 태그 조회
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('slug');

  if (tagsError) {
    console.error('Failed to fetch tags:', tagsError);
    throw tagsError;
  }

  return [
    '/blog',
    ...(posts ?? []).map(p => `/blog/${p.slug}`),
    ...(categories ?? []).map(c => `/blog/category/${c.slug}`),
    ...(tags ?? []).map(t => `/blog/tag/${t.slug}`),
  ];
}
```

#### 재빌드 트리거

| 이벤트 | 트리거 방식 |
|--------|-------------|
| 새 포스트 발행 | Supabase Database Webhook → GitHub Actions workflow_dispatch |
| 포스트 수정/삭제 | 동일 (status 변경 감지) |
| 예약 발행 완료 | 스케줄러가 발행 후 웹훅 호출 |
| 수동 배포 | GitHub Actions 수동 실행 |

#### 검증 체크리스트 (CI에서 자동 검증)

```bash
# 프리렌더 후 검증 스크립트 예시
- [ ] 각 페이지에 <title> 태그 존재 확인
- [ ] og:title, og:description 메타 태그 존재 확인
- [ ] JSON-LD 스크립트 블록 존재 확인
- [ ] 200 상태 코드 반환 확인
- [ ] 프리렌더된 HTML 파일 개수 = 발행된 포스트 수 + 정적 페이지 수
```

#### Sitemap 생성

- 빌드 시 `/sitemap.xml` 자동 생성
- 포스트, 카테고리, 태그 페이지 포함
- `lastmod`는 `updated_at` 기준

---

## 8. 성능 요구사항

| 항목 | 목표 |
|------|------|
| FCP (First Contentful Paint) | < 1.5s |
| LCP (Largest Contentful Paint) | < 2.5s |
| TTI (Time to Interactive) | < 3.5s |
| 이미지 로딩 | Lazy loading 적용 |
| 번들 사이즈 | 블로그 전용 청크 **120KB 이하** (gzipped) |

### 8.1 번들 최적화 전략

| 전략 | 상세 |
|------|------|
| 코드 스플리팅 | `/blog/*` 경로 전용 청크 분리 (React.lazy) |
| 지연 로딩 | Markdown 에디터는 관리자 페이지 진입 시 로드 |
| 트리 쉐이킹 | Supabase 클라이언트 필요 모듈만 import |
| 라이브러리 분리 | react-markdown, rehype를 별도 vendor 청크로 분리 |

#### 예상 번들 구성 (gzipped)

| 청크 | 예상 크기 |
|------|-----------|
| 메인 앱 (공통) | ~80KB |
| 블로그 뷰어 청크 | ~60KB (react-markdown + rehype) |
| 블로그 에디터 청크 | ~50KB (관리자 전용, 지연 로딩) |
| Supabase 클라이언트 | ~25KB |

---

## 9. 마일스톤

### Phase 1: 기본 블로그 구현 (P0)
- [ ] 데이터베이스 스키마 설계 및 구축
- [ ] 블로그 목록 페이지 구현
- [ ] 블로그 상세 페이지 구현
- [ ] Markdown 렌더링 구현
- [ ] 기본 라우팅 설정

### Phase 2: 필터링 및 네비게이션 (P1)
- [ ] 카테고리/태그 시스템 구현
- [ ] 페이지네이션 구현
- [ ] 사이드바 구현
- [ ] 목차(TOC) 구현
- [ ] 이전/다음 포스트 네비게이션

### Phase 3: 관리자 기능 (P1)
- [ ] 관리자 인증 구현
- [ ] 포스트 CRUD 구현
- [ ] Markdown 에디터 구현
- [ ] 이미지 업로드 구현

### Phase 4: 고급 기능 (P2)
- [ ] 검색 기능
- [ ] 관련 포스트 추천
- [ ] 소셜 공유 버튼
- [ ] 예약 발행
- [ ] SEO 최적화

---

## 10. PRD 검토 결과 및 해결 현황

> **최종 업데이트**: 2024-12-08 - 모든 이슈 해결됨

### 10.1 해결된 이슈 요약

| # | 이슈 | 상태 | 해결 위치 |
|---|------|------|-----------|
| 1 | SEO 전략 미결정 | ✅ 해결 | 7.4 Prerender 파이프라인, 12.4 SEO 전략 결정 |
| 2 | Soft Delete 필드 누락 | ✅ 해결 | 3.1 Post 모델 (`deleted_at`, `deleted_by`) |
| 3 | 예약 발행 상태 불일치 | ✅ 해결 | 3.1 Post 모델, 4.4 스케줄러 정책 |
| 4 | 태그 참조 무결성 문제 | ✅ 해결 | 3.5 PostTag 조인 테이블 |
| 5 | 권한 모델 부재 | ✅ 해결 | 3.7 역할 정의, 3.8 RLS 정책 |
| 6 | 번들 사이즈 목표 비현실적 | ✅ 해결 | 8.1 번들 최적화 전략 (120KB 목표) |

### 10.2 추가 반영 사항

| 항목 | 상태 | 위치 |
|------|------|------|
| Prerender 도구 수정 (`vite-plugin-ssg`) | ✅ | 7.4 |
| 재빌드 트리거 (웹훅) | ✅ | 7.4 |
| 스케줄러 재시도/데드레터 정책 | ✅ | 4.4 |
| Storage RLS 정책 | ✅ | 4.5 |
| WebP 변환 폴백 정책 | ✅ | 4.5 |
| iframe 도메인 화이트리스트 | ✅ | 4.6 |
| Post 추가 필드 (`published_by`, `updated_by`) | ✅ | 3.1 |
| AuditLog 트리거 | ✅ | 3.8 |

### 10.3 남은 리스크

| 리스크 | 대응 |
|--------|------|
| Supabase Free 플랜에서 Scheduled Functions 미지원 | GitHub Actions cron 대안 문서화 (4.4) |
| Prerender 후 포스트 추가 시 재빌드 지연 | 웹훅 트리거로 자동화 (7.4) |

---

## 11. 리스크 및 고려사항

### 11.1 기술적 리스크
| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| Supabase 무료 티어 제한 | 트래픽 초과 시 서비스 중단 | 모니터링 설정, 유료 전환 계획 |
| SEO (SPA 한계) | 검색엔진 인덱싱 문제 | SSR 도입 검토 (Next.js) 또는 Prerendering |
| 이미지 최적화 | 페이지 로딩 속도 저하 | CDN, WebP 변환, lazy loading |

### 11.2 보안 고려사항
- 관리자 인증: Supabase Auth 또는 자체 인증
- XSS 방지: Markdown 렌더링 시 sanitize 처리
- 이미지 업로드: 파일 타입/크기 검증

### 11.3 확장성 고려사항
- 향후 댓글 기능 추가 가능성
- 다국어 지원 가능성
- 뉴스레터 구독 연동 가능성

---

## 12. 결정 필요 사항

### 12.1 백엔드 선택
- [x] **Option A**: Supabase (권장 - 빠른 구현, 무료 티어) ✅ **선택됨**
- [ ] ~~Option B: Headless CMS (Strapi, Contentful)~~
- [ ] ~~Option C: File-based (정적 Markdown)~~

### 12.2 에디터 선택
- [x] **Option A**: 마크다운 에디터 (react-markdown-editor-lite) ✅ **선택됨**
- [ ] ~~Option B: 리치 텍스트 에디터 (TipTap, Lexical)~~
- [ ] ~~Option C: 외부 CMS 에디터 사용~~

> **선택 이유**: 출시 속도 빠르고 포맷 일관성 유지 용이
> **향후 계획**: 풍부한 포맷/협업 필요 시 TipTap/Lexical 전환 고려 (콘텐츠 마이그레이션 방안 사전 준비)

### 12.3 이미지 저장소
- [x] **Option A**: Supabase Storage ✅ **선택됨**
- [ ] ~~Option B: Cloudinary~~ (보조 CDN으로 하이브리드 고려 가능)
- [ ] ~~Option C: AWS S3~~

> **선택 이유**: 동일 스택/권한 체계로 빠른 통합, 비용 단순
> **향후 계획**: 고급 리사이즈/자동 WebP 필요 시 Cloudinary 보조 CDN 검토

### 12.4 SEO 전략
- [x] **Option A**: 현재 SPA 유지 + Prerendering ✅ **MVP 선택**
- [ ] **Option B**: Next.js로 마이그레이션 (SSR) → **6~12개월 내 로드맵**
- [ ] ~~Option C: 블로그만 별도 서브도메인 (blog.webinars.co.kr)~~ → 추후 결정

> **MVP 전략**: SPA + 빌드 시 정적 프리렌더로 인덱싱 리스크 최소화
> **로드맵**: 6~12개월 내 블로그 섹션만 Next.js/SSR 전환 → 성능/SEO 안정화 후 서브도메인 여부 결정

---

## 13. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [웨비나스 기존 PRD](./webinars-prd.md)
- [기존 웹사이트](https://webinars.co.kr)
