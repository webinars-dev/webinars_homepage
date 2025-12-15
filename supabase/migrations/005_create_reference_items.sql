-- =====================================================
-- Webinars V3 Reference Items Schema
-- 생성일: 2025-12-15
-- 설명: /reference2 레퍼런스 카드 데이터 테이블
-- =====================================================

-- NOTE:
-- - update_updated_at_column() 함수는 001_create_blog_tables.sql 에서 생성됩니다.
-- - authors 테이블은 기존 블로그 관리자(auth.users 연동)와 동일한 체계를 사용합니다.

CREATE TABLE IF NOT EXISTS reference_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  client TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  modal_path TEXT,
  col_span INTEGER NOT NULL DEFAULT 4 CHECK (col_span IN (4, 8, 12)),
  "order" INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES authors(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES authors(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reference_items_order ON reference_items("order");
CREATE INDEX IF NOT EXISTS idx_reference_items_published ON reference_items(is_published);
CREATE INDEX IF NOT EXISTS idx_reference_items_deleted_at ON reference_items(deleted_at);

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS reference_items_updated_at ON reference_items;
CREATE TRIGGER reference_items_updated_at
  BEFORE UPDATE ON reference_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

