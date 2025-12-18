# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 작업 지침

- 한국어로 답변
- 개발 후 Playwright로 확인
- 임시 스크립트는 `temp/` 디렉토리에 저장

## 개발 명령어

```bash
# 개발 서버 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build

# Playwright 테스트
npx playwright test
npx playwright test admin-ui.spec.js  # 단일 테스트 파일
```

## 프로젝트 아키텍처

**Webinars v3** - WordPress에서 마이그레이션된 한국어 기업 웹사이트 (webinars.co.kr)

### 핵심 기술 스택

- **Frontend**: React 19, Vite 7, React Router 7
- **Backend**: Supabase (Auth, DB, Storage)
- **Styling**: Tailwind CSS 4 (관리자 UI 전용, `.admin-ui` 스코프)
- **Testing**: Playwright

### 하이브리드 렌더링 아키텍처

1. **WordPress 아카이브** (`archive/components/`): 50개의 정적 HTML→JSX 변환 컴포넌트
2. **React SPA 페이지** (`src/pages/`): 블로그, 레퍼런스, 관리자 시스템

**PageRenderer** (`src/components/PageRenderer.jsx`): 핵심 렌더링 엔진
- WordPress HTML을 React로 변환
- 이미지 URL 정규화 (webinars.co.kr → 로컬 경로)
- Salient 테마 애니메이션 재구현
- React Portal 기반 모달 시스템

### 라우팅 구조 (`src/App.jsx`)

```
/                    → IndexPage (WordPress 아카이브)
/about, /services2   → WordPress 아카이브 페이지
/reference           → Reference2Page (Supabase 갤러리)
/blog/*              → 블로그 시스템 (Supabase)
/admin/*             → 관리자 시스템 (인증 필요)
/2023_offline_*/     → 모달용 WordPress 페이지 (40+)
```

### 관리자 시스템 (`src/pages/admin/`)

- **인증**: Supabase Auth + `app_metadata.role`
- **권한**: admin (전체 접근) / author (제한)
- **UI 컴포넌트**: `src/pages/admin/ui/` (shadcn 스타일)
- **API**: `/api/admins` (Vercel serverless)

### Tailwind 격리 패턴

관리자 UI는 WordPress 스타일과 충돌 방지를 위해 격리됨:
- `.admin-ui` 클래스 내부에서만 Tailwind 적용
- `postcss.config.cjs`의 `importantAdminUtilities` 플러그인이 `!important` 추가
- preflight 비활성화

## 디렉토리 구조

```
webinars_v3/
├── src/
│   ├── components/           # 공용 컴포넌트
│   │   ├── PageRenderer.jsx  # WordPress HTML 렌더링 엔진 (핵심)
│   │   └── ModalContent.jsx  # 모달 콘텐츠
│   ├── pages/
│   │   ├── admin/            # 관리자 시스템
│   │   │   ├── ui/           # shadcn 스타일 UI 컴포넌트
│   │   │   └── admin-ui.css  # Tailwind 빌드 결과
│   │   ├── blog/             # 블로그 페이지
│   │   └── reference2/       # 레퍼런스 갤러리
│   ├── services/             # Supabase API 레이어
│   ├── hooks/                # useAuth, useAdminRole
│   └── lib/supabase.js       # Supabase 클라이언트
├── archive/components/       # WordPress→JSX 아카이브 (50개)
├── public/                   # 정적 에셋 (css/, js/, fonts/, wp-content/)
├── server/                   # 개발 서버 미들웨어
├── api/                      # Vercel serverless 함수
└── supabase/migrations/      # DB 스키마
```

## Supabase 데이터베이스

**주요 테이블**: `posts`, `authors`, `categories`, `tags`, `post_tags`, `reference_items`

**환경 변수** (`.env.local`):
```
VITE_SUPABASE_URL=https://eskwngynvszukwrvhkrw.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 주요 파일 위치

- **라우팅**: `src/App.jsx`
- **렌더링 엔진**: `src/components/PageRenderer.jsx`
- **관리자 레이아웃**: `src/pages/admin/AdminLayout.jsx`
- **Tailwind 설정**: `tailwind.config.js` (`.admin-ui` 스코프)
- **PostCSS 플러그인**: `postcss.config.cjs` (`importantAdminUtilities`)
- **Vercel 설정**: `vercel.json`

## 주의사항

### 한글 URL 처리
- macOS (NFD) vs Linux (NFC) 정규화 차이 주의
- `PageRenderer`에서 자동 처리

### 관리자 UI 스타일링
- Tailwind 유틸리티는 `.admin-ui` 래퍼 내부에서만 사용
- WordPress 스타일 오버라이드 시 `!important` 필요

### 모달 시스템
- `ModalContext`로 중첩 모달 방지
- WordPress 페이지는 모달로만 렌더링 (`/2023_offline_*/` 등)
