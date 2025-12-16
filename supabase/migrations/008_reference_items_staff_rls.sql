-- =====================================================
-- Webinars V3 Reference Items RLS Policies (v2)
-- 생성일: 2025-12-16
-- 설명:
--  - 공개 페이지: 발행된 항목만 조회 가능
--  - 내부 관리자: @webinars.co.kr 계정(로그인)만 CRUD 가능
-- =====================================================

ALTER TABLE reference_items ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재실행 안전)
DROP POLICY IF EXISTS "Public read reference items" ON reference_items;
DROP POLICY IF EXISTS "Admin read reference items" ON reference_items;
DROP POLICY IF EXISTS "Admin insert reference items" ON reference_items;
DROP POLICY IF EXISTS "Admin update reference items" ON reference_items;
DROP POLICY IF EXISTS "Webinars staff manage reference items" ON reference_items;

-- 공개: 발행된 항목만
CREATE POLICY "Public read reference items" ON reference_items
  FOR SELECT USING (
    is_published = true
    AND deleted_at IS NULL
  );

-- 내부 관리자: @webinars.co.kr 로그인 사용자만 관리 가능
CREATE POLICY "Webinars staff manage reference items" ON reference_items
  FOR ALL TO authenticated
  USING (
    deleted_at IS NULL
    AND COALESCE(auth.jwt()->>'email', '') ILIKE '%@webinars.co.kr'
  )
  WITH CHECK (
    COALESCE(auth.jwt()->>'email', '') ILIKE '%@webinars.co.kr'
  );

