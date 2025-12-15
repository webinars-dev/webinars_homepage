-- =====================================================
-- Webinars V3 Blog RLS Policies
-- 생성일: 2024-12-08
-- =====================================================

-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Authors 정책
-- =====================================================

-- 읽기: 누구나
CREATE POLICY "Public read authors" ON authors
  FOR SELECT USING (true);

-- =====================================================
-- Categories 정책
-- =====================================================

-- 읽기: 누구나
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (true);

-- 생성/수정/삭제: Editor/Admin만
CREATE POLICY "Editor manage categories" ON categories
  FOR ALL USING (
    auth.jwt()->>'role' IN ('editor', 'admin')
  );

-- =====================================================
-- Tags 정책
-- =====================================================

-- 읽기: 누구나
CREATE POLICY "Public read tags" ON tags
  FOR SELECT USING (true);

-- 생성/수정/삭제: Editor/Admin만
CREATE POLICY "Editor manage tags" ON tags
  FOR ALL USING (
    auth.jwt()->>'role' IN ('editor', 'admin')
  );

-- =====================================================
-- Posts 정책
-- =====================================================

-- 읽기: 발행된 글은 누구나, 미발행은 작성자/Editor/Admin만
CREATE POLICY "Read posts" ON posts
  FOR SELECT USING (
    (status = 'published' AND deleted_at IS NULL)
    OR author_id = auth.uid()
    OR auth.jwt()->>'role' IN ('editor', 'admin')
  );

-- 생성: Author 이상
CREATE POLICY "Create posts" ON posts
  FOR INSERT WITH CHECK (
    auth.jwt()->>'role' IN ('author', 'editor', 'admin')
    AND author_id = auth.uid()
  );

-- 수정 (일반): 본인 글 또는 Editor/Admin, soft delete는 불가
CREATE POLICY "Update posts" ON posts
  FOR UPDATE USING (
    deleted_at IS NULL
    AND (
      author_id = auth.uid()
      OR auth.jwt()->>'role' IN ('editor', 'admin')
    )
  ) WITH CHECK (
    -- Author/Editor는 deleted_at을 설정할 수 없음
    CASE WHEN auth.jwt()->>'role' IN ('author', 'editor')
      THEN deleted_at IS NULL
      ELSE TRUE
    END
    -- Author는 status를 published/scheduled로 변경 불가
    AND CASE WHEN auth.jwt()->>'role' = 'author'
      THEN status NOT IN ('published', 'scheduled')
      ELSE TRUE
    END
  );

-- Soft Delete: Admin만 가능
CREATE POLICY "Soft delete posts" ON posts
  FOR UPDATE USING (
    auth.jwt()->>'role' = 'admin'
  ) WITH CHECK (
    auth.jwt()->>'role' = 'admin'
    AND deleted_at IS NOT NULL
    AND deleted_by = auth.uid()
  );

-- Restore (복구): Admin만 삭제된 글 복구 가능
CREATE POLICY "Restore posts" ON posts
  FOR UPDATE USING (
    auth.jwt()->>'role' = 'admin'
    AND deleted_at IS NOT NULL
  ) WITH CHECK (
    auth.jwt()->>'role' = 'admin'
    AND deleted_at IS NULL
    AND deleted_by IS NULL
  );

-- =====================================================
-- PostTags 정책
-- =====================================================

-- 읽기: 누구나
CREATE POLICY "Public read post_tags" ON post_tags
  FOR SELECT USING (true);

-- 생성/삭제: 해당 포스트 작성자 또는 Editor/Admin
CREATE POLICY "Manage post_tags" ON post_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_tags.post_id
      AND (
        posts.author_id = auth.uid()
        OR auth.jwt()->>'role' IN ('editor', 'admin')
      )
    )
  );

-- =====================================================
-- AuditLogs 정책
-- =====================================================

-- 읽기: Admin만
CREATE POLICY "Admin read audit_logs" ON audit_logs
  FOR SELECT USING (
    auth.jwt()->>'role' = 'admin'
  );

-- 생성: 시스템 트리거만 (SECURITY DEFINER 함수에서 처리)
-- 직접 INSERT는 허용하지 않음

-- =====================================================
-- Storage 정책 (blog-images 버킷)
-- =====================================================

-- 버킷 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- 읽기: 누구나
CREATE POLICY "Public read blog images" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

-- 업로드: Author 이상만, 본인 폴더에만
CREATE POLICY "Auth upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.jwt()->>'role' IN ('author', 'editor', 'admin')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 삭제: 본인 업로드 파일만 또는 Admin
CREATE POLICY "Delete own or admin blog images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR auth.jwt()->>'role' = 'admin'
    )
  );
