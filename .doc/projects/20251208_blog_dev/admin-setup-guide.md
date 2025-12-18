# 블로그 관리자 설정 가이드

## 개요

이 문서는 Webinars V3 블로그의 관리자 권한을 설정하는 방법을 설명합니다.
관리자만 블로그 글을 작성/수정/삭제할 수 있습니다.

## 1. Supabase RLS 정책 적용

### 1.1 Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 `eskwngynvszukwrvhkrw` 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 1.2 마이그레이션 SQL 실행

아래 SQL을 SQL Editor에 붙여넣고 실행:

```sql
-- =====================================================
-- Webinars V3 Blog - Admin Only Posts RLS
-- 생성일: 2024-12-08
-- 설명: 관리자(admin)만 글을 작성/수정/삭제할 수 있도록 정책 강화
-- =====================================================

-- 기존 posts 정책 삭제
DROP POLICY IF EXISTS "Create posts" ON posts;
DROP POLICY IF EXISTS "Update posts" ON posts;
DROP POLICY IF EXISTS "Soft delete posts" ON posts;
DROP POLICY IF EXISTS "Restore posts" ON posts;

-- =====================================================
-- 새로운 Posts 정책 (Admin 전용)
-- =====================================================

-- 생성: Admin만
CREATE POLICY "Admin create posts" ON posts
  FOR INSERT WITH CHECK (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM authors
      WHERE authors.id = auth.uid()
      AND authors.role = 'admin'
    )
  );

-- 수정: Admin만
CREATE POLICY "Admin update posts" ON posts
  FOR UPDATE USING (
    deleted_at IS NULL
    AND (
      (auth.jwt()->'app_metadata'->>'role') = 'admin'
      OR EXISTS (
        SELECT 1 FROM authors
        WHERE authors.id = auth.uid()
        AND authors.role = 'admin'
      )
    )
  );

-- 삭제: Admin만
CREATE POLICY "Admin delete posts" ON posts
  FOR DELETE USING (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM authors
      WHERE authors.id = auth.uid()
      AND authors.role = 'admin'
    )
  );

-- =====================================================
-- Categories/Tags 정책도 Admin 전용으로 변경
-- =====================================================

DROP POLICY IF EXISTS "Editor manage categories" ON categories;
DROP POLICY IF EXISTS "Editor manage tags" ON tags;

CREATE POLICY "Admin manage categories" ON categories
  FOR ALL USING (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM authors
      WHERE authors.id = auth.uid()
      AND authors.role = 'admin'
    )
  );

CREATE POLICY "Admin manage tags" ON tags
  FOR ALL USING (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM authors
      WHERE authors.id = auth.uid()
      AND authors.role = 'admin'
    )
  );

-- =====================================================
-- PostTags 정책도 Admin 전용으로 변경
-- =====================================================

DROP POLICY IF EXISTS "Manage post_tags" ON post_tags;

CREATE POLICY "Admin manage post_tags" ON post_tags
  FOR ALL USING (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM authors
      WHERE authors.id = auth.uid()
      AND authors.role = 'admin'
    )
  );

-- =====================================================
-- Storage 정책도 Admin 전용으로 변경
-- =====================================================

DROP POLICY IF EXISTS "Auth upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Delete own or admin blog images" ON storage.objects;

CREATE POLICY "Admin upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images'
    AND (
      (auth.jwt()->'app_metadata'->>'role') = 'admin'
      OR EXISTS (
        SELECT 1 FROM authors
        WHERE authors.id = auth.uid()
        AND authors.role = 'admin'
      )
    )
  );

CREATE POLICY "Admin delete blog images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-images'
    AND (
      (auth.jwt()->'app_metadata'->>'role') = 'admin'
      OR EXISTS (
        SELECT 1 FROM authors
        WHERE authors.id = auth.uid()
        AND authors.role = 'admin'
      )
    )
  );
```

## 2. 관리자 계정 생성

### 2.1 Supabase Auth에서 사용자 생성

1. Supabase Dashboard에서 **Authentication** > **Users** 클릭
2. **Add user** > **Create new user** 클릭
3. 이메일과 비밀번호 입력 (예: admin@webinars.co.kr)
4. **Auto-confirm user** 체크
5. **Create user** 클릭

### 2.2 Authors 테이블에 Admin으로 등록

생성된 사용자의 UUID를 복사하고, SQL Editor에서 실행:

```sql
-- 새 관리자 추가
INSERT INTO authors (id, name, email, role)
VALUES (
  '여기에-사용자-UUID-입력',  -- Authentication에서 복사한 UUID
  '관리자 이름',
  'admin@webinars.co.kr',
  'admin'
);

-- 또는 기존 사용자를 admin으로 승격
UPDATE authors
SET role = 'admin'
WHERE email = 'admin@webinars.co.kr';
```

### 2.3 (선택) JWT에 role 추가

더 빠른 권한 체크를 위해 JWT의 app_metadata에 role을 추가할 수 있습니다.

SQL Editor에서 실행:

```sql
-- 사용자의 app_metadata에 role 추가
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@webinars.co.kr';
```

## 3. 관리자 로그인 테스트

### 3.1 개발 환경에서 테스트

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://eskwngynvszukwrvhkrw.supabase.co',
  'your-anon-key'
);

// 관리자 로그인
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@webinars.co.kr',
  password: 'your-password'
});

console.log('로그인 결과:', data);

// 글 작성 테스트
const { data: post, error: postError } = await supabase
  .from('posts')
  .insert({
    title: '테스트 글',
    slug: 'test-post',
    excerpt: '테스트 요약',
    content: '테스트 내용',
    author_id: data.user.id,
    category_id: 'category-uuid',
    status: 'published',
    published_at: new Date().toISOString()
  });

console.log('글 작성 결과:', post, postError);
```

## 4. 권한 체크 요약

| 작업 | 비로그인 사용자 | 일반 로그인 사용자 | Admin |
|------|----------------|-------------------|-------|
| 발행된 글 읽기 | ✅ | ✅ | ✅ |
| 글 작성 | ❌ | ❌ | ✅ |
| 글 수정 | ❌ | ❌ | ✅ |
| 글 삭제 | ❌ | ❌ | ✅ |
| 카테고리/태그 관리 | ❌ | ❌ | ✅ |
| 이미지 업로드 | ❌ | ❌ | ✅ |

## 5. 문제 해결

### 5.1 "RLS policy violation" 에러

- authors 테이블에 해당 사용자가 `role = 'admin'`으로 등록되어 있는지 확인
- 로그인된 사용자의 JWT가 올바른지 확인

### 5.2 글 작성이 안 되는 경우

```sql
-- authors 테이블 확인
SELECT * FROM authors WHERE email = 'admin@webinars.co.kr';

-- role이 'admin'인지 확인
-- 'author' 또는 'editor'이면 admin으로 변경:
UPDATE authors SET role = 'admin' WHERE email = 'admin@webinars.co.kr';
```

## 6. 향후 확장

향후 Author/Editor 역할을 다시 추가하려면 `supabase/migrations/002_create_rls_policies.sql`의 원래 정책을 참고하세요.
