-- =====================================================
-- Webinars V3 Reference Items - Modal HTML Column
-- 생성일: 2025-12-16
-- 설명: 레퍼런스 카드 모달 내용을 DB에서 편집할 수 있도록 modal_html 컬럼 추가
-- =====================================================

ALTER TABLE reference_items
  ADD COLUMN IF NOT EXISTS modal_html TEXT;

