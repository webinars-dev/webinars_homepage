
로컬서버 실행해줘

태스크 문서를 생성해줘 


새 skill을 만들어줘





# Webinars V3 개발 프롬프트

## 프로젝트 개요

**Webinars V3**는 webinars.co.kr 회사 홈페이지의 React 기반 재구축 프로젝트입니다.
WordPress 미러 사이트에서 마이그레이션된 하이브리드 아키텍처를 사용합니다.

- **프로덕션 URL**: https://webinars.co.kr
- **Vercel 배포**: webinarsv3-emp4tckcf-enterfacs-projects.vercel.app

---

## 기술 스택

| 카테고리 | 기술 |
|---------|-----|
| 프레임워크 | React 19.2.0 + Vite 7.2.2 |
| 라우팅 | React Router DOM 7.9.6 |
| 상태관리 | React Context (AuthProvider) |
| 백엔드 | Supabase (eskwngynvszukwrvhkrw) |
| 스타일링 | WordPress CSS + Tailwind CSS (admin 전용) |
| 테스트 | Playwright |
| 배포 | Vercel |

---

## 개발 명령어

**작업 디렉토리**: `webinars_v3/` (프로젝트 루트에서 실행)

```bash
# 프로젝트 디렉토리로 이동
cd /Users/jaeohpark/내\ 드라이브\(Jaeoh.Park@webinars.co.kr\)/Development/dev/webinars_home/webinars_v3

# 개발 서버 실행 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# Playwright 테스트
npx playwright test
```

---

## 디렉토리 구조

```
webinars_v3/
├── src/
│   ├── App.jsx              # 메인 라우터 설정
│   ├── main.jsx             # 엔트리포인트
│   ├── components/          # 공통 컴포넌트
│   │   ├── blog/            # 블로그 관련 컴포넌트
│   │   ├── ContactThankYou.jsx
│   │   ├── ModalContent.jsx
│   │   └── PageRenderer.jsx
│   ├── pages/
│   │   ├── admin/           # 관리자 페이지 (Tailwind scoped)
│   │   │   ├── ui/          # shadcn 스타일 UI 컴포넌트
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminPostListPage.jsx
│   │   │   ├── AdminPostEditPage.jsx
│   │   │   ├── AdminReferenceListPage.jsx
│   │   │   └── AdminReferenceEditPage.jsx
│   │   ├── blog/            # 블로그 페이지
│   │   └── reference2/      # 레퍼런스 페이지
│   ├── hooks/
│   │   ├── useAuth.jsx      # 인증 컨텍스트
│   │   └── useBlog.js       # 블로그 데이터 훅
│   └── lib/
│       └── supabase.js      # Supabase 클라이언트
├── archive/
│   └── components/          # WordPress 변환 정적 페이지들
├── public/
│   ├── css/                 # WordPress CSS (style-0~32.css)
│   ├── js/                  # WordPress JS (script-0~12.js)
│   ├── fonts/               # 폰트 (Hyphen-Sans, icomoon)
│   ├── images/              # 이미지 에셋
│   └── wp-content/          # WordPress 미디어
├── index.html               # SPA 엔트리 HTML
├── vite.config.mjs          # Vite 설정
├── tailwind.config.js       # Tailwind 설정 (admin 전용)
└── playwright.config.js     # Playwright 설정
```

---

## 주요 라우트

| 경로 | 컴포넌트 | 설명 |
|-----|---------|-----|
| `/` | IndexPage | 메인 페이지 |
| `/about` | AboutPage | 회사 소개 |
| `/services`, `/services2` | Services2Page | 서비스 안내 |
| `/reference` | Reference2Page | 레퍼런스 (Masonry) |
| `/contact` | ContactPage | 문의하기 |
| `/blog` | BlogIndexPage | 블로그 목록 |
| `/blog/:slug` | BlogPostPage | 블로그 상세 |
| `/admin/login` | AdminLoginPage | 관리자 로그인 |
| `/admin/blog` | AdminPostListPage | 블로그 관리 |
| `/admin/reference` | AdminReferenceListPage | 레퍼런스 관리 |

---

## Supabase 데이터베이스

### 테이블 구조

**posts** (블로그)
- id, title, slug, content, excerpt
- featured_image, category_id, status
- author_id, created_at, updated_at

**categories** (블로그 카테고리)
- id, name, slug, description

**tags** (블로그 태그)
- id, name, slug

**references** (레퍼런스 포트폴리오)
- id, title, client, category, description
- thumbnail_url, gallery, date, status
- sort_order, created_at

---

## 아키텍처 특징

### 1. 하이브리드 CSS 시스템
- **WordPress CSS**: 기존 사이트 스타일 유지 (`public/css/`)
- **Tailwind CSS**: admin 페이지 전용 (`.admin-ui` 스코프)
- `tailwind.config.js`의 `important: '.admin-ui'`로 충돌 방지

### 2. LocalLinkAdapter 패턴
`App.jsx`의 `LocalLinkAdapter` 컴포넌트가:
- `webinars.co.kr` 링크를 로컬 경로로 변환
- SPA 내비게이션 처리
- 모달 링크는 WordPress JS가 처리하도록 bypass

### 3. WordPress 자산 통합
- jQuery 및 imagesLoaded CDN 로드
- WordPress 테마 스크립트 (`public/js/script-*.js`)
- 폰트 CORS 우회를 위한 로컬 경로 오버라이드

---

## admin UI 개발 가이드

admin 페이지는 shadcn 스타일 컴포넌트를 사용합니다:

```jsx
// src/pages/admin/ui/ 컴포넌트 사용
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardContent } from './ui/card';

// admin 페이지는 .admin-ui 래퍼 필수
<div className="admin-ui">
  <Card>
    <CardHeader>제목</CardHeader>
    <CardContent>내용</CardContent>
  </Card>
</div>
```

### CSS 변수 (oklch 색상)
```css
--background: 100% 0 0;
--foreground: 14.9% 0.052 264.4;
--primary: 42.4% 0.199 265.8;
--muted: 96.7% 0.001 286.4;
--border: 91.8% 0.006 264.5;
```

---

## 개발 주의사항

1. **WordPress CSS 충돌 주의**
   - admin 외 페이지에서 Tailwind 클래스 사용 금지
   - 새 스타일은 인라인 또는 CSS 모듈 사용

2. **정적 페이지 수정**
   - `archive/components/` 파일은 자동 생성된 것
   - 직접 수정 시 크롤러 재실행으로 덮어쓰기 가능

3. **Supabase RLS**
   - 모든 테이블에 Row Level Security 적용됨
   - 관리자 기능은 인증된 사용자만 접근

4. **이미지 경로**
   - 상대 경로 사용: `/images/`, `/wp-content/`
   - 외부 URL은 Supabase Storage 또는 원본 도메인

---

## 환경 변수

```env
# Supabase 연결 (필수)
VITE_SUPABASE_URL=https://eskwngynvszukwrvhkrw.supabase.co
VITE_SUPABASE_ANON_KEY=...

# 참고용 (서버 측)
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Playwright 테스트

```bash
# 전체 테스트
npx playwright test

# UI 모드
npx playwright test --ui

# 특정 테스트
npx playwright test admin-ui.spec.js
```

테스트 파일:
- `admin-ui.spec.js` - 관리자 UI 테스트
- `test-pages.spec.js` - 페이지 로드 테스트

---

## 배포

Vercel에 자동 배포됩니다:
- main 브랜치 push 시 자동 배포
- Preview 배포: PR 생성 시

```bash
# 수동 배포 확인
vercel ls
vercel inspect <deployment-url>
```

---

## 자주 사용하는 작업

### 새 블로그 포스트 추가
1. `/admin/login` 에서 로그인
2. `/admin/blog/new` 에서 작성
3. Markdown 에디터로 content 입력

### 레퍼런스 추가
1. `/admin/reference/new` 에서 작성
2. 썸네일 이미지 업로드
3. 갤러리 이미지 (선택)

### 정적 페이지 수정
1. `archive/components/` 에서 해당 파일 찾기
2. JSX 직접 수정
3. 개발 서버에서 확인
