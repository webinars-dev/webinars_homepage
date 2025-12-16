-- =====================================================
-- Webinars V3 Reference Items RLS Fix (Soft Delete)
-- 생성일: 2025-12-16
-- 설명:
--  - UPDATE 시 USING 조건이 변경된 row(soft delete)에도 적용되어
--    deleted_at을 설정하는 업데이트가 거부되는 케이스가 발생할 수 있어,
--    관리 정책의 USING에서 deleted_at 조건을 제거합니다.
-- =====================================================

DROP POLICY IF EXISTS "Webinars staff manage reference items" ON reference_items;

CREATE POLICY "Webinars staff manage reference items" ON reference_items
  FOR ALL TO authenticated
  USING (
    COALESCE(auth.jwt()->>'email', '') ILIKE '%@webinars.co.kr'
  )
  WITH CHECK (
    COALESCE(auth.jwt()->>'email', '') ILIKE '%@webinars.co.kr'
  );

