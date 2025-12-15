-- =====================================================
-- Webinars V3 Blog Schema
-- 생성일: 2024-12-08
-- =====================================================

-- 1. Authors 테이블 (Supabase Auth와 연동)
CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('admin', 'editor', 'author')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Categories 테이블
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tags 테이블
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Posts 테이블
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  featured_image TEXT,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived', 'publish_failed')),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES authors(id),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES authors(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES authors(id),
  publish_retry_count INTEGER NOT NULL DEFAULT 0,
  last_publish_attempt_at TIMESTAMPTZ,
  last_publish_error TEXT,
  meta_title TEXT,
  meta_description TEXT,
  view_count INTEGER NOT NULL DEFAULT 0
);

-- 5. PostTags 조인 테이블
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

-- 6. AuditLogs 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'publish', 'unpublish', 'restore')),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'category', 'tag')),
  target_id UUID NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================

-- Posts 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(status, scheduled_at) WHERE status = 'scheduled';

-- PostTags 인덱스
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- AuditLogs 인덱스
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- =====================================================
-- Triggers
-- =====================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Posts updated_at 트리거
DROP TRIGGER IF EXISTS posts_updated_at ON posts;
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Categories updated_at 트리거
DROP TRIGGER IF EXISTS categories_updated_at ON categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AuditLog 자동 기록 트리거
CREATE OR REPLACE FUNCTION log_post_changes()
RETURNS TRIGGER AS $$
DECLARE
  actor_id UUID;
  action_type TEXT;
BEGIN
  -- 사용자 ID 결정: auth.uid() > NEW.updated_by > 시스템 UUID
  actor_id := COALESCE(
    auth.uid(),
    NEW.updated_by,
    '00000000-0000-0000-0000-000000000000'::UUID
  );

  -- 액션 타입 결정
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
  ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    action_type := 'delete';
  ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    action_type := 'restore';
  ELSIF OLD.status != 'published' AND NEW.status = 'published' THEN
    action_type := 'publish';
  ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
    action_type := 'unpublish';
  ELSE
    action_type := 'update';
  END IF;

  INSERT INTO audit_logs (user_id, action, target_type, target_id, changes)
  VALUES (
    actor_id,
    action_type,
    'post',
    NEW.id,
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS post_audit_trigger ON posts;
CREATE TRIGGER post_audit_trigger
  AFTER INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION log_post_changes();

-- =====================================================
-- 초기 데이터 (샘플 카테고리)
-- =====================================================

INSERT INTO categories (name, slug, description, "order") VALUES
  ('웨비나 인사이트', 'webinar-insights', '웨비나 관련 인사이트와 팁을 공유합니다.', 1),
  ('이벤트 후기', 'event-reviews', '진행한 이벤트의 후기와 하이라이트입니다.', 2),
  ('회사 소식', 'company-news', '웨비나스의 최신 소식을 전합니다.', 3),
  ('기술 블로그', 'tech-blog', '기술적인 내용과 개발 이야기입니다.', 4)
ON CONFLICT (slug) DO NOTHING;

-- 샘플 태그
INSERT INTO tags (name, slug) VALUES
  ('웨비나', 'webinar'),
  ('하이브리드', 'hybrid'),
  ('라이브스트리밍', 'livestreaming'),
  ('이벤트', 'event'),
  ('팁', 'tips')
ON CONFLICT (slug) DO NOTHING;
