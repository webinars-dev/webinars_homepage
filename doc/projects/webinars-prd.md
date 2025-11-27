# Webinars V3 PRD (Vercel + Supabase)

## 개요
- 목적: 기존 정적 아카이브 페이지를 React/Vite 기반으로 재구성하고, Vercel 호스팅 + Supabase(Postgres/Auth/Storage)로 동적 콘텐츠와 신청 플로우를 제공.
- 우선 순위: 빠른 배포/프리뷰, 인증된 신청/문의, 세션/웨비나 리스트 관리, 성능/SEO 유지.
- 성공 지표: 신청 전환율, 페이지 로드 TTFB/CLS, 이메일/소셜 로그인 성공률, 오류 없는 배포 비율.

## 대상 사용자 & 핵심 여정
- 마케터/운영자: 세션 생성·수정·비공개/공개, 문의 확인, 기초 분석 조회.
- 참여자: 세션 탐색 → 상세 보기 → 신청/문의 → 확인 메일 수신.
- 관리자: 스팸/부정 신청 차단, 콘텐츠 버전 관리, 배포 상태 확인.

## 기능 범위
- MVP
  - 세션 리스트/필터/검색(카테고리/분류/태그).
  - 세션 상세: 일정, 발표자, 장소/온라인 링크, 첨부.
  - 신청/문의 폼: Supabase Auth(이메일/소셜) + RLS로 본인 데이터만 접근.
  - 알림: 신청 완료 이메일(웹훅/Edge Function) + 대시보드용 단순 리스트.
  - 정적 페이지 SEO 유지(메타 태그/OG/사이트맵).
- 확장
  - 웨비나 실시간 시청 링크 보호(서명 URL 또는 뷰 토큰).
  - 결제/유료 세션 연동(추후).
  - 관리자용 간단 CMS UI.

## 기술 스택
- FE: React 19 + Vite, 라우팅은 `react-router-dom`. 스타일은 기존 정적 CSS 재사용 후 단계별 개선.
- 배포: Vercel(프리뷰/프로덕션), ISR/Edge Middleware로 리다이렉트·캐싱 제어.
- BE: Supabase(Postgres + Auth + Storage + Edge Functions). 서비스 키는 서버 전용 환경변수에만 두고, 클라이언트는 anon 키만 사용.
- QA: Playwright(E2E), Vercel Preview에서 실행 가능하도록 설정.

## 아키텍처 개요
- Public routes: 목록/상세/정적 페이지(about, contact 등).
- Auth + API: Vercel Serverless/Edge 또는 Supabase Functions에서 처리. 클라이언트 호출은 Supabase JS 클라이언트 사용.
- 데이터 모델(초안)
  - `sessions`: id, title, type(hybrid/offline/online), start_at, end_at, location, city, tags, capacity, status, hero_image_url, description, created_by.
  - `speakers`: id, name, title, company, bio, avatar_url.
  - `session_speakers`: session_id, speaker_id, order.
  - `registrations`: id, session_id, user_id(nullable), name, email, company, phone, consent_flags, status, created_at.
  - `inquiries`: id, name, email, message, session_id(optional), created_at.
  - RLS: 등록/문의는 본인만 조회, 운영자 역할(role claim)만 전체 조회 가능.

## 단계별 개발 계획
- Phase 0: 준비
  - Vercel 프로젝트 생성, env 템플릿(`.env.example`) 작성, `npm run build` 동작 확인.
  - Supabase 프로젝트 생성, DB 스키마 마이그레이션 초안 작성(SQL).
  - Playwright 기본 시나리오 셋업(홈 로드, 404, 주요 CTA 클릭).
- Phase 1: 정적 → 동적 기초
  - 기존 아카이브 페이지를 라우트 별 컴포넌트로 정리(현재 `archive` → `src/pages` 이전).
  - 세션 리스트/상세에 더미 데이터 주입 후 레이아웃/SEO 검증.
  - Vercel Preview 배포 + 헬스체크.
- Phase 2: 데이터/폼 연동
  - Supabase JS로 세션 리스트/상세 조회, 태그/카테고리 필터 구현.
  - 신청/문의 폼 작성 → Supabase Edge Function 또는 Row Insert API로 저장.
  - 이메일 알림: Edge Function에서 webhooks 또는 Supabase Functions + 외부 이메일(SendGrid 등) 호출.
  - Auth: 이메일 링크/소셜(OAuth) 로그인 연결, 보호된 마이페이지(내 신청 목록).
- Phase 3: 운영 기능/최적화
  - 간단한 운영자 페이지(신청/문의 리스트) + role 기반 접근.
  - 이미지/정적 파일은 Supabase Storage 또는 Vercel Assets로 이관, 캐싱 헤더 점검.
  - 성능: 코드 스플리팅, 폰트 최적화, 메타 태그/OG/사이트맵 자동 생성.
  - 모니터링: Vercel Logs + Supabase Observability 대시보드 점검.

## 체크리스트
- 환경/보안
  - [ ] `.env`/Vercel env 분리(anon/service 키, DATABASE_URL, JWT_SECRET).
  - [ ] 서비스 키는 서버 전용 함수에서만 사용, 클라이언트는 anon 키만.
  - [ ] RLS 정책 적용 확인(등록/문의, 운영자 역할).
  - [ ] HTTPS/도메인 설정, 쿠키 SameSite/HttpOnly 설정.
- FE/UX
  - [ ] 주요 페이지 라우트 연결(홈, about, contact, 리스트, 상세, 404).
  - [ ] 신청/문의 폼 유효성 + 오류/성공 피드백.
  - [ ] 접근성: 기본 ARIA, 포커스 트랩, 키보드 내비게이션.
  - [ ] SEO: title/description/OG, sitemap, robots.txt.
- 데이터/백엔드
  - [ ] 세션/스피커/신청/문의 테이블 생성 및 인덱스.
  - [ ] Edge Function/Serverless에서 입력 검증, 레이트 리밋(간단히 IP/캡차).
  - [ ] 이메일 알림 템플릿/발신자 도메인 설정.
- 배포/테스트
  - [ ] `npm run build` 성공, Vercel Preview 정상.
  - [ ] Playwright: 홈 로드, 세션 리스트/필터, 신청/문의 제출 플로우.
  - [ ] 롤백 계획/릴리즈 태그, 변경 로그 기록.

## 산출물/운영
- 마이그레이션: `/supabase/migrations`(추가 예정).
- 테스트: `tests/`에 Playwright 스펙 유지, CI에서 Vercel Preview URL로 실행 가능하게 설정.
- 모니터링: 배포 후 로그/오류 알림(이메일/Slack) 설정.
