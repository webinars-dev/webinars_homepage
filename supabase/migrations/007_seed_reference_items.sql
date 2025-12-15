-- =====================================================
-- Webinars V3 Reference Items Seed
-- 생성일: 2025-12-15
-- 설명: 기존 /reference 페이지 데이터를 /reference2 초기값으로 채웁니다.
-- =====================================================

-- Auto-generated seed for reference_items (from archive/pages/reference.html)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM reference_items) = 0 THEN
    INSERT INTO reference_items (category, title, client, image_url, modal_path, col_span, "order", is_published)
    VALUES
      (E'Offline', E'2024\nRMAF\nAnnual Symposium', E'재생의료진행재단', E'/wp-content/uploads/2024/12/사진-1-3.jpg', E'/wp/2024_offline_1028', 12, 1, true),
      (E'DESIGN / PUBLICATION', E'2024\n강원 동계청소년올림픽', E'IOC /\n강원동계청소년올림픽 조직위원회', E'/wp-content/uploads/2024/02/thumb_01_2024.png', E'/wp/WEBINAR/2024_design_publication_1', 8, 2, true),
      (E'Offline', E'2024년\n정신건강의 날\n기념식 및 포럼', E'국립정신건강센터', E'/wp-content/uploads/2024/12/사진-1_무대잘보이게-확대필요.jpg', E'/wp/2024_offline_1010', 4, 3, true),
      (E'OFFLINE', E'2024\n전통의약 국제 심포지엄', E'한국한의약진흥원', E'/wp-content/uploads/2024/12/사진-5_인형이랑-브이하신분-강조.jpg', E'/wp/2024_offline_0927', 4, 4, true),
      (E'OFFLINE', E'헌법재판 연구원\n제13회\n국제학술심포지엄', E'헌법재판소 헌법재판연구원', E'/wp-content/uploads/2024/12/사진-2-3.jpg', E'/wp/2024_offline_0904', 4, 5, true),
      (E'Offline', E'2024\n수술부위감염 감시체계 실무자 워크숍', E'KONIS', E'/wp-content/uploads/2024/12/KONISS-ICU3수정.jpg', E'/wp/2023_offline_1201', 8, 6, true),
      (E'Offline', E'2024\n중환자실 의료관련감염\n감시체계 실무자 교육', E'KONIS', E'/wp-content/uploads/2024/12/KONISS-ICU15수정.jpg', E'/wp/2024_offline_0705', 12, 7, true),
      (E'Offline', E'2024\n첨단재생의료\n인재양성포럼', E'재생의료진흥재단', E'/wp-content/uploads/2024/12/사진-2.jpg', E'/wp/2024_offline_rmaf0715', 12, 8, true),
      (E'offline', E'Advanced\nCancer Therapeutics\nSummit 2024', E'연세대학교, 연세의료원', E'/wp-content/uploads/2024/12/사진-3-4.jpg', E'/wp/2024_offline_acts2024', 4, 9, true),
      (E'OFFLINE', E'2023\n수술부위감염 감시체계\n실무자 워크숍 프로그램', E'KONIS', E'/wp-content/uploads/2024/02/thumb_02_2024.png', E'/wp/2024_offline_2', 4, 10, true),
      (E'OFFLINE', E'2023\n첨단재생의료 전략포럼', E'재생의료진흥재단', E'/wp-content/uploads/2024/02/thumb_03_2024.png', E'/wp/2024_offline_3', 4, 11, true),
      (E'Hybrid', E'2023\n제29회 아주이과심포지엄', E'아주대병원의료원', E'/wp-content/uploads/2024/02/thumb_04_2024.png', E'/wp/2024_hybrid_4', 12, 12, true),
      (E'Hybrid', E'2023\n글로벌 전통의약 협력을 위한\n국제 컨퍼런스', E'한국한의약진흥원', E'/wp-content/uploads/2024/02/thumb_05_2024.png', E'/wp/2024_hybrid_5', 12, 13, true),
      (E'OFFLINE', E'2023\n자살예방의 날 기념식', E'한국생명 존중희망재단', E'/wp-content/uploads/2024/02/thumb_06_2024.png', E'/wp/2024_offline_6', 8, 14, true),
      (E'OFFLINE', E'헌법재판연구원\n제12회 국제학술심포지엄', E'헌법재판소 헌법재판연구원', E'/wp-content/uploads/2024/02/thumb_07_2024.png', E'/wp/WEBINAR/2024_offline_7', 4, 15, true),
      (E'Hybrid', E'Global Gastric\nCancer Summit 2023', E'연세암병원', E'/wp-content/uploads/2024/02/thumb_08_2024-1.png', E'/wp/2024_hybrid_8', 4, 16, true),
      (E'OFFLINE', E'글로벌 의료기기사 B\n전문가 회의', E'글로벌 의료기기사 B', E'/wp-content/uploads/2024/02/thumb_09_2024.png', E'/wp/2024_offline_9', 4, 17, true),
      (E'Hybrid', E'2022년\n감염병관리 콘퍼런스', E'질병관리청', E'/wp-content/uploads/2023/02/thumb_01-1.png', E'/wp/hybrid_1', 8, 18, true),
      (E'Hybrid', E'임상시험\n디지털 전환 연구회 포럼\n2022', E'국가임상시험지원재단', E'/wp-content/uploads/2023/02/thumb_02.png', E'/wp/hybrid_2', 12, 19, true),
      (E'Hybrid', E'2022\n자원봉사 국제포럼', E'(재)한국중앙자원봉사센터', E'/wp-content/uploads/2023/02/thumb_03.png', E'/wp/hybrid_3', 12, 20, true),
      (E'SOLUTION', E'LAUNCH 심포지엄', E'글로벌 제약사 G', E'/wp-content/uploads/2023/02/thumb_04.png', E'/wp/solution_4', 4, 21, true),
      (E'Hybrid', E'헌법재판연구원\n제11회 국제학술심포지엄', E'헌법재판소 헌법재판연구원', E'/wp-content/uploads/2023/02/thumb_05.png', E'/wp/hybrid_5', 4, 22, true),
      (E'HYBRID', E'글로벌 제약사 M\n기자간담회', E'글로벌 제약사 M', E'/wp-content/uploads/2023/02/thumb_06.png', E'/wp/hybrid_6', 4, 23, true),
      (E'Hybrid', E'2022\n제28회 아주이과심포지엄', E'아주대병원의료원', E'/wp-content/uploads/2023/02/thumb_07.png', E'/wp/hybrid_7', 12, 24, true),
      (E'Hybrid', E'글로벌 제약사 M\n심포지엄', E'글로벌 제약사 M', E'/wp-content/uploads/2023/02/thumb_08.png', E'/wp/hybrid_8', 12, 25, true),
      (E'Hybrid', E'2022년도\n사회보장정보포럼', E'한국사회보장정보원', E'/wp-content/uploads/2023/02/thumb_09.png', E'/wp/hybrid_9', 8, 26, true),
      (E'WEBINAR / LIVE STREAMING', E'글로벌 제약사 A\n심포지엄', E'글로벌 제약사 A', E'/wp-content/uploads/2023/02/thumb_10.png', E'/wp/WEBINAR/webinar_live-streaming_10', 4, 27, true),
      (E'Hybrid', E'글로벌 제약사 A\n심포지엄', E'글로벌 제약사 A', E'/wp-content/uploads/2023/02/thumb_11.png', E'/wp/hybrid_11', 4, 28, true),
      (E'Hybrid', E'글로벌 제약사\n심포지엄', E'글로벌 제약사 B, O', E'/wp-content/uploads/2023/02/thumb_12.png', E'/wp/hybrid_12', 4, 29, true),
      (E'WEBINAR / LIVE STREAMING', E'글로벌 의료기기사 B\n전문가 회의', E'글로벌 의료기기사 B', E'/wp-content/uploads/2023/02/thumb_13.png', E'/wp/webinar_live-streaming_13', 8, 30, true),
      (E'Webinar / Live Streaming', E'글로벌 제약사 A\nMEETING', E'글로벌 제약사 A', E'/wp-content/uploads/2023/02/thumb_14.png', E'/wp/webinar_live-streaming_14', 12, 31, true),
      (E'Webinar / Live Streaming', E'S사\nSEMINAR', E'S사', E'/wp-content/uploads/2023/02/thumb_15.png', E'/wp/webinar_live-streaming_15', 12, 32, true);
  END IF;
END $$;

