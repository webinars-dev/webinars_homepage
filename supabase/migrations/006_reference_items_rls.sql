-- =====================================================
-- Webinars V3 Reference Items RLS Policies
-- 생성일: 2025-12-15
-- 설명: 공개 목록은 published만, 관리는 admin만
-- =====================================================

ALTER TABLE reference_items ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재실행 안전)
DROP POLICY IF EXISTS "Public read reference items" ON reference_items;
DROP POLICY IF EXISTS "Admin read reference items" ON reference_items;
DROP POLICY IF EXISTS "Admin insert reference items" ON reference_items;
DROP POLICY IF EXISTS "Admin update reference items" ON reference_items;

-- 공개: 발행된 항목만
CREATE POLICY "Public read reference items" ON reference_items
  FOR SELECT USING (
    is_published = true
    AND deleted_at IS NULL
  );

-- 관리자: (미발행 포함) 조회 가능
CREATE POLICY "Admin read reference items" ON reference_items
  FOR SELECT USING (
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

-- 관리자: 생성 가능
CREATE POLICY "Admin insert reference items" ON reference_items
  FOR INSERT WITH CHECK (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM authors
      WHERE authors.id = auth.uid()
      AND authors.role = 'admin'
    )
  );

-- 관리자: 수정 가능 (soft delete 포함)
CREATE POLICY "Admin update reference items" ON reference_items
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
  ) WITH CHECK (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM authors
      WHERE authors.id = auth.uid()
      AND authors.role = 'admin'
    )
  );

