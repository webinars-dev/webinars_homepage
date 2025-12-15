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

-- 읽기 정책은 유지 (기존 "Read posts" 정책)
-- 발행된 글은 누구나, 미발행은 admin만

-- 생성: Admin만
CREATE POLICY "Admin create posts" ON posts
  FOR INSERT WITH CHECK (
    -- 방법 1: JWT의 app_metadata.role 확인
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
    -- 방법 2: authors 테이블의 role 확인 (백업)
    OR EXISTS (
      SELECT 1 FROM authors
      WHERE authors.id = auth.uid()
      AND authors.role = 'admin'
    )
  );

-- 수정: Admin만 (deleted_at이 NULL인 글만)
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

-- Soft Delete: Admin만
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

-- Categories: Admin만 관리
CREATE POLICY "Admin manage categories" ON categories
  FOR ALL USING (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM authors
      WHERE authors.id = auth.uid()
      AND authors.role = 'admin'
    )
  );

-- Tags: Admin만 관리
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

-- 업로드: Admin만
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

-- 삭제: Admin만
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

-- =====================================================
-- Admin 사용자 생성을 위한 헬퍼 함수
-- Supabase Dashboard에서 SQL Editor로 실행하여 admin 추가
-- =====================================================

-- 사용 예시 (주석 해제하고 실행):
-- 1. 먼저 Supabase Auth에서 사용자를 생성
-- 2. 그 다음 아래 SQL로 authors 테이블에 admin으로 추가:
/*
INSERT INTO authors (id, name, email, role)
VALUES (
  '사용자-UUID-여기에-입력',
  '관리자 이름',
  'admin@webinars.co.kr',
  'admin'
);
*/

-- 기존 사용자를 admin으로 승격:
/*
UPDATE authors
SET role = 'admin'
WHERE email = 'admin@webinars.co.kr';
*/
