# Webinars v3

WordPress에서 React SPA로 마이그레이션된 웨비나스코리아(webinars.co.kr) 기업 웹사이트입니다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React 19, Vite 7, React Router 7 |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Styling | Tailwind CSS 4 (관리자 UI 전용) |
| Testing | Playwright |
| Deployment | Vercel |

## 시작하기

### 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local)
VITE_SUPABASE_URL=https://eskwngynvszukwrvhkrw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> **보안 주의**: `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용해야 합니다. 절대 `VITE_` 프리픽스를 붙이지 마세요 (클라이언트에 노출됨).

### 개발 서버

```bash
npm run dev      # http://localhost:3000
```

### 프로덕션 빌드

```bash
npm run build    # dist/ 디렉토리에 빌드
npm run preview  # 빌드 결과 로컬 확인
```

### 테스트

```bash
npx playwright test                    # 전체 테스트
npx playwright test admin-ui.spec.js   # 단일 파일 테스트
```

## 프로젝트 구조

```text
webinars_v3/
├── src/
│   ├── main.jsx                 # React 진입점
│   ├── App.jsx                  # 라우팅 설정
│   ├── components/
│   │   ├── PageRenderer.jsx     # WordPress HTML → React 변환 엔진
│   │   └── ModalContent.jsx     # 모달 콘텐츠 핸들러
│   ├── pages/
│   │   ├── admin/               # 관리자 시스템
│   │   │   ├── ui/              # shadcn 스타일 UI 컴포넌트
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── AdminPostListPage.jsx
│   │   │   ├── AdminPostEditPage.jsx
│   │   │   ├── AdminReferenceListPage.jsx
│   │   │   ├── AdminReferenceEditPage.jsx
│   │   │   ├── AdminAnalyticsPage.jsx
│   │   │   └── AdminAdminsPage.jsx
│   │   ├── blog/                # 블로그 페이지
│   │   └── reference2/          # 레퍼런스 갤러리
│   ├── services/                # Supabase API 레이어
│   ├── hooks/                   # useAuth, useAdminRole
│   └── lib/supabase.js          # Supabase 클라이언트
├── archive/components/          # WordPress→JSX 아카이브 (50개)
├── public/                      # 정적 에셋 (css/, js/, fonts/)
├── api/                         # Vercel serverless 함수
├── server/                      # 개발 서버 미들웨어
└── supabase/migrations/         # DB 스키마 마이그레이션
```

## 아키텍처

### 하이브리드 렌더링

1. **WordPress 아카이브** (`archive/components/`): 50개의 정적 HTML→JSX 변환 컴포넌트
2. **React SPA 페이지** (`src/pages/`): 블로그, 레퍼런스, 관리자 시스템

**PageRenderer**: 핵심 렌더링 엔진

- WordPress HTML을 React로 동적 변환
- 이미지 URL 정규화 (webinars.co.kr → 로컬 경로)
- macOS(NFD)/Linux(NFC) 유니코드 정규화 처리
- React Portal 기반 모달 시스템

### 라우팅

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | IndexPage | 메인 페이지 |
| `/about`, `/services2` | WordPress Archive | 정적 페이지 |
| `/reference` | Reference2Page | 레퍼런스 갤러리 |
| `/reference2` | Reference2Page | 레퍼런스 갤러리 (별칭) |
| `/blog` | BlogIndexPage | 블로그 목록 |
| `/blog/:slug` | BlogPostPage | 블로그 상세 |
| `/blog/category/:categorySlug` | BlogCategoryPage | 카테고리 필터 |
| `/blog/tag/:tagSlug` | BlogTagPage | 태그 필터 |
| `/contact` | ContactPage | 문의 페이지 |
| `/admin/*` | Admin System | 관리자 시스템 |

## 관리자 시스템

### 인증

- Supabase Auth 기반
- `app_metadata.role`로 권한 관리
- 역할: `admin` (전체 접근), `author` (제한적 접근)

### 기능

| 메뉴 | 권한 | 설명 |
|------|------|------|
| 대시보드 | 전체 | 통계 및 현황 |
| 블로그 관리 | admin | 게시물 CRUD |
| 레퍼런스 관리 | 전체 | 갤러리 항목 관리 |
| 통계분석 | admin | GA4 데이터 시각화 |
| 관리자 관리 | admin | 사용자 권한 관리 |

### UI 컴포넌트

`src/pages/admin/ui/` 디렉토리에 shadcn 스타일 컴포넌트:

- Badge, Button, Card, Checkbox
- Input, Label, Select, Textarea
- Table, Separator
- RichTextEditor

## 데이터베이스

### 주요 테이블

| 테이블 | 설명 |
|--------|------|
| `posts` | 블로그 게시물 |
| `authors` | 작성자 (auth.users FK) |
| `categories` | 카테고리 |
| `tags` | 태그 |
| `post_tags` | 게시물-태그 연결 |
| `reference_items` | 레퍼런스 갤러리 항목 |
| `audit_logs` | 변경 이력 |

### 게시물 상태

```text
draft → scheduled → published
                 ↘ publish_failed (재시도)
                 ↘ archived
```

### 마이그레이션

```text
supabase/migrations/
├── 001_create_blog_tables.sql          # 블로그 스키마
├── 002_create_rls_policies.sql         # Row Level Security
├── 003_admin_only_posts.sql            # 관리자 접근 제어
├── 004_view_count_rpc.sql              # 조회수 RPC
├── 005_create_reference_items.sql      # 레퍼런스 갤러리
├── 006-010_*                           # RLS 및 기능 확장
```

## 스타일링

### Tailwind 격리 패턴

관리자 UI는 WordPress 스타일과 충돌 방지를 위해 `.admin-ui` 클래스 내부로 격리:

```javascript
// tailwind.config.js
module.exports = {
  important: '.admin-ui',
  corePlugins: { preflight: false }
}
```

```javascript
// postcss.config.cjs
importantAdminUtilities  // .admin-ui 내 유틸리티에 !important 추가
```

### 사용 예시

```jsx
<div className="admin-ui">
  <Button variant="primary">저장</Button>
</div>
```

## API

### 개발 환경 (server/)

| 엔드포인트 | 핸들러 | 설명 |
|-----------|--------|------|
| `/api/admins` | adminsHandler.mjs | 사용자 관리 |
| `/api/posts` | postsHandler.mjs | 게시물 CRUD |
| `/api/analytics` | analyticsHandler.mjs | GA4 데이터 |

### 프로덕션 (api/)

Vercel Serverless Functions로 동일 엔드포인트 제공

## 배포

### Vercel 설정 (vercel.json)

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/((?!assets/|wp/|api/).*)", "destination": "/index.html" }
  ]
}
```

### 환경 변수

Vercel 대시보드에서 설정:

- `VITE_SUPABASE_URL` - 클라이언트용 (공개)
- `VITE_SUPABASE_ANON_KEY` - 클라이언트용 (공개)
- `SUPABASE_SERVICE_ROLE_KEY` - 서버용 (비공개, Serverless Functions에서만 사용)

## 개발 가이드

### 커밋 컨벤션

```text
feat(scope): 새 기능 추가
fix(scope): 버그 수정
chore(scope): 설정 변경
docs(scope): 문서 수정
```

### 코드 스타일

- 컴포넌트: PascalCase.jsx
- 훅: useSomething.js
- 들여쓰기: 2 spaces
- 문자열: single quotes

### 주의사항

1. **한글 URL**: macOS(NFD)/Linux(NFC) 정규화 차이 - PageRenderer에서 자동 처리
2. **관리자 스타일**: `.admin-ui` 래퍼 내부에서만 Tailwind 사용
3. **모달 시스템**: ModalContext로 중첩 모달 방지

## 라이선스

ISC
