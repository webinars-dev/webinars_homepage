-- =====================================================
-- Webinars V3 Blog - View Count RPC Function
-- 생성일: 2024-12-09
-- 설명: 익명 사용자도 조회수를 증가시킬 수 있도록 RPC 함수 추가
--       RLS를 우회하여 안전하게 view_count만 업데이트
-- =====================================================

-- 조회수 증가 함수 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- view_count만 1 증가, 다른 필드는 건드리지 않음
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = post_id
    AND status = 'published'  -- 발행된 글만
    AND deleted_at IS NULL;   -- 삭제되지 않은 글만
END;
$$;

-- 함수 실행 권한 부여 (anon, authenticated 모두 호출 가능)
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO authenticated;

-- 주의: 이 함수는 rate limiting이 없으므로
-- 프론트엔드에서 세션당 1회만 호출하도록 제어해야 합니다.
-- 또는 추후 rate limiting 로직을 함수 내에 추가할 수 있습니다.

-- =====================================================
-- (선택) Rate Limiting을 위한 view_logs 테이블
-- 필요시 주석 해제하여 사용
-- =====================================================
/*
CREATE TABLE IF NOT EXISTS view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL,  -- IP 해시 또는 세션 ID
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_view_logs_post_visitor ON view_logs(post_id, visitor_hash);

-- Rate limiting 적용 버전
CREATE OR REPLACE FUNCTION increment_view_count_limited(
  p_post_id UUID,
  p_visitor_hash TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_view TIMESTAMPTZ;
BEGIN
  -- 최근 1시간 내 동일 방문자 조회 기록 확인
  SELECT viewed_at INTO last_view
  FROM view_logs
  WHERE post_id = p_post_id
    AND visitor_hash = p_visitor_hash
    AND viewed_at > NOW() - INTERVAL '1 hour'
  ORDER BY viewed_at DESC
  LIMIT 1;

  -- 최근 조회 기록이 없으면 카운트 증가
  IF last_view IS NULL THEN
    UPDATE posts
    SET view_count = view_count + 1
    WHERE id = p_post_id
      AND status = 'published'
      AND deleted_at IS NULL;

    INSERT INTO view_logs (post_id, visitor_hash)
    VALUES (p_post_id, p_visitor_hash);

    RETURN true;
  END IF;

  RETURN false;  -- 이미 최근에 조회함
END;
$$;
*/
