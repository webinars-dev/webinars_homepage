# 블로그 기능 PRD

## 1. 개요

### 1.1 프로젝트 정보
- **프로젝트명**: Webinars V3 블로그 기능
- **작성일**: 2024-12-08
- **상태**: 계획 단계
- **우선순위**: High

### 1.2 배경
Webinars V3 웹사이트에 블로그 기능을 추가하여 회사 소식, 이벤트 후기, 웨비나 인사이트 등의 콘텐츠를 발행하고 관리할 수 있는 시스템을 구축합니다.

### 1.3 목표
- 회사 브랜딩 강화를 위한 콘텐츠 마케팅 플랫폼 구축
- SEO 개선을 통한 유기적 트래픽 증가
- 웨비나/이벤트 관련 인사이트 공유
- 고객 engagement 향상

---

## 2. 기능 요구사항

### 2.1 사용자 기능 (Frontend)

#### 2.1.1 블로그 목록 페이지 (`/blog`)
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 포스트 목록 | 최신순 정렬된 블로그 포스트 카드 목록 | P0 |
| 썸네일 이미지 | 각 포스트의 대표 이미지 표시 | P0 |
| 제목/요약 | 포스트 제목 및 요약(excerpt) 표시 | P0 |
| 날짜 표시 | 작성일/수정일 표시 | P0 |
| 카테고리 필터 | 카테고리별 포스트 필터링 | P1 |
| 태그 필터 | 태그별 포스트 필터링 | P1 |
| 페이지네이션 | 페이지당 10-12개 포스트, 무한 스크롤 또는 번호 방식 | P1 |
| 검색 | 제목/내용 키워드 검색 | P2 |

#### 2.1.2 블로그 상세 페이지 (`/blog/:slug`)
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 본문 렌더링 | Markdown/HTML 본문 렌더링 | P0 |
| 헤더 이미지 | 상단 대표 이미지 | P0 |
| 메타 정보 | 작성자, 작성일, 카테고리, 태그 | P0 |
| 목차(TOC) | 본문 헤딩 기반 목차 자동 생성 | P1 |
| 이전/다음 포스트 | 네비게이션 링크 | P1 |
| 관련 포스트 | 같은 카테고리/태그 포스트 추천 | P2 |
| 소셜 공유 | Twitter, LinkedIn, Facebook 공유 버튼 | P2 |

#### 2.1.3 카테고리 페이지 (`/blog/category/:category`)
- 특정 카테고리의 포스트만 필터링하여 표시
- 카테고리 설명 표시

#### 2.1.4 태그 페이지 (`/blog/tag/:tag`)
- 특정 태그가 포함된 포스트만 필터링하여 표시

### 2.2 관리자 기능 (Admin)

#### 2.2.1 포스트 관리
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 포스트 작성 | 새 포스트 작성 (Markdown 에디터) | P0 |
| 포스트 수정 | 기존 포스트 수정 | P0 |
| 포스트 삭제 | 포스트 삭제 (soft delete) | P0 |
| 임시 저장 | 드래프트 저장 | P1 |
| 예약 발행 | 미래 시간에 자동 발행 | P2 |
| 이미지 업로드 | 본문 내 이미지 업로드 | P0 |

#### 2.2.2 카테고리/태그 관리
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 카테고리 CRUD | 카테고리 생성/수정/삭제 | P1 |
| 태그 CRUD | 태그 생성/수정/삭제 | P1 |

---

## 3. 데이터 모델

### 3.1 Post (포스트)
```typescript
interface Post {
  id: string;                    // UUID
  slug: string;                  // URL 슬러그 (unique)
  title: string;                 // 제목
  excerpt: string;               // 요약 (150자 내외)
  content: string;               // 본문 (Markdown)
  featured_image: string | null; // 대표 이미지 URL
  author_id: string;             // 작성자 ID
  category_id: string;           // 카테고리 ID
  tags: string[];                // 태그 ID 배열
  status: 'draft' | 'published' | 'archived'; // 상태
  published_at: Date | null;     // 발행일
  created_at: Date;              // 생성일
  updated_at: Date;              // 수정일
  meta_title: string | null;     // SEO 제목
  meta_description: string | null; // SEO 설명
  view_count: number;            // 조회수
}
```

### 3.2 Category (카테고리)
```typescript
interface Category {
  id: string;
  name: string;                  // 카테고리명 (예: "웨비나 인사이트")
  slug: string;                  // URL 슬러그
  description: string | null;    // 설명
  order: number;                 // 정렬 순서
  created_at: Date;
  updated_at: Date;
}
```

### 3.3 Tag (태그)
```typescript
interface Tag {
  id: string;
  name: string;                  // 태그명
  slug: string;                  // URL 슬러그
  created_at: Date;
}
```

### 3.4 Author (작성자)
```typescript
interface Author {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
}
```

---

## 4. 기술 스택

### 4.1 현재 프로젝트 스택 (유지)
- Frontend: React 19, Vite 7, react-router-dom 7
- 스타일: 기존 WordPress CSS 유지
- 테스트: Playwright

### 4.2 추가 기술 스택 (검토 필요)

#### Option A: Supabase (권장)
| 항목 | 선택 | 이유 |
|------|------|------|
| Database | Supabase PostgreSQL | 무료 티어, 실시간 기능, 인증 내장 |
| Storage | Supabase Storage | 이미지 업로드, CDN 지원 |
| Auth | Supabase Auth | 관리자 인증 |
| Markdown | react-markdown + rehype | 클라이언트 렌더링 |

#### Option B: Headless CMS
| 항목 | 선택 | 이유 |
|------|------|------|
| CMS | Strapi / Contentful / Sanity | 콘텐츠 관리 UI 내장 |
| Storage | 클라우드 스토리지 (S3, Cloudinary) | 이미지 최적화 |

#### Option C: File-based (정적)
| 항목 | 선택 | 이유 |
|------|------|------|
| Content | Markdown 파일 (Git 저장) | 단순함, 버전 관리 |
| Build | Vite 플러그인 | 빌드 시 HTML 생성 |

### 4.3 추가 라이브러리 (예상)
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",     // Supabase 클라이언트
    "react-markdown": "^9.x",             // Markdown 렌더링
    "rehype-highlight": "^7.x",           // 코드 하이라이팅
    "rehype-slug": "^6.x",                // 헤딩 앵커
    "date-fns": "^3.x"                    // 날짜 포맷팅
  }
}
```

---

## 5. 페이지 구조

### 5.1 라우트 설계
```
/blog                           # 블로그 목록
/blog/:slug                     # 블로그 상세
/blog/category/:category        # 카테고리별 목록
/blog/tag/:tag                  # 태그별 목록
/admin/blog                     # 관리자: 포스트 목록 (인증 필요)
/admin/blog/new                 # 관리자: 새 포스트 작성
/admin/blog/edit/:id            # 관리자: 포스트 수정
```

### 5.2 컴포넌트 구조 (예상)
```
src/
├── components/
│   └── blog/
│       ├── BlogCard.jsx        # 포스트 카드
│       ├── BlogList.jsx        # 포스트 목록
│       ├── BlogDetail.jsx      # 포스트 상세
│       ├── BlogSidebar.jsx     # 사이드바 (카테고리, 태그)
│       ├── BlogPagination.jsx  # 페이지네이션
│       ├── BlogTOC.jsx         # 목차
│       └── MarkdownRenderer.jsx # Markdown 렌더러
├── pages/
│   └── blog/
│       ├── BlogIndexPage.jsx   # /blog
│       ├── BlogPostPage.jsx    # /blog/:slug
│       ├── BlogCategoryPage.jsx # /blog/category/:category
│       └── BlogTagPage.jsx     # /blog/tag/:tag
├── hooks/
│   └── useBlog.js              # 블로그 데이터 훅
└── services/
    └── blogService.js          # API 호출 로직
```

---

## 6. UI/UX 디자인

### 6.1 블로그 목록 페이지 레이아웃
```
┌─────────────────────────────────────────────────┐
│                    Header                        │
├─────────────────────────────────────────────────┤
│  [블로그]                           [검색 아이콘] │
│                                                  │
│  [카테고리 탭: 전체 | 웨비나 인사이트 | 이벤트 후기 | ...]│
├───────────────────────────┬─────────────────────┤
│                           │                      │
│  ┌─────────────────────┐ │  사이드바             │
│  │   썸네일 이미지      │ │  ├── 인기 포스트      │
│  │   제목              │ │  ├── 카테고리         │
│  │   요약...           │ │  └── 태그 클라우드    │
│  │   날짜 | 카테고리    │ │                      │
│  └─────────────────────┘ │                      │
│                           │                      │
│  ┌─────────────────────┐ │                      │
│  │   ...               │ │                      │
│  └─────────────────────┘ │                      │
│                           │                      │
│  [1] [2] [3] ... [다음]   │                      │
├───────────────────────────┴─────────────────────┤
│                    Footer                        │
└─────────────────────────────────────────────────┘
```

### 6.2 블로그 상세 페이지 레이아웃
```
┌─────────────────────────────────────────────────┐
│                    Header                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  [히어로 이미지 - 전체 너비]                      │
│                                                  │
├───────────────────────────┬─────────────────────┤
│                           │                      │
│  # 포스트 제목            │  목차 (TOC)           │
│                           │  ├── 섹션 1          │
│  작성자 | 2024.12.08      │  ├── 섹션 2          │
│  카테고리: 웨비나 인사이트  │  └── 섹션 3          │
│                           │                      │
│  본문 내용...             │  [공유 버튼]          │
│                           │                      │
│  ## 섹션 1                │                      │
│  ...                      │                      │
│                           │                      │
│  ## 섹션 2                │                      │
│  ...                      │                      │
│                           │                      │
│  태그: #웨비나 #하이브리드  │                      │
│                           │                      │
│  [← 이전 포스트] [다음 →]  │                      │
├───────────────────────────┴─────────────────────┤
│  관련 포스트                                     │
│  [카드1] [카드2] [카드3]                         │
├─────────────────────────────────────────────────┤
│                    Footer                        │
└─────────────────────────────────────────────────┘
```

### 6.3 디자인 가이드라인
- 기존 웹사이트 스타일 (Salient 테마) 유지
- 폰트: 기존 웹폰트 사용
- 색상: 기존 브랜드 컬러 유지
- 반응형: 모바일/태블릿/데스크톱 지원

---

## 7. SEO 요구사항

### 7.1 메타 태그
```html
<title>{포스트 제목} | Webinars 블로그</title>
<meta name="description" content="{포스트 요약}">
<meta name="keywords" content="{태그들}">

<!-- Open Graph -->
<meta property="og:title" content="{포스트 제목}">
<meta property="og:description" content="{포스트 요약}">
<meta property="og:image" content="{대표 이미지}">
<meta property="og:url" content="{포스트 URL}">
<meta property="og:type" content="article">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{포스트 제목}">
<meta name="twitter:description" content="{포스트 요약}">
<meta name="twitter:image" content="{대표 이미지}">
```

### 7.2 구조화된 데이터 (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{포스트 제목}",
  "image": "{대표 이미지}",
  "datePublished": "{발행일}",
  "dateModified": "{수정일}",
  "author": {
    "@type": "Person",
    "name": "{작성자}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Webinars"
  }
}
```

### 7.3 URL 구조
- 슬러그는 한글 또는 영문으로 작성
- 예: `/blog/2024-hybrid-event-trend` 또는 `/blog/2024년-하이브리드-이벤트-트렌드`

---

## 8. 성능 요구사항

| 항목 | 목표 |
|------|------|
| FCP (First Contentful Paint) | < 1.5s |
| LCP (Largest Contentful Paint) | < 2.5s |
| TTI (Time to Interactive) | < 3.5s |
| 이미지 로딩 | Lazy loading 적용 |
| 번들 사이즈 | 블로그 관련 코드 50KB 이하 (gzipped) |

---

## 9. 마일스톤

### Phase 1: 기본 블로그 구현 (P0)
- [ ] 데이터베이스 스키마 설계 및 구축
- [ ] 블로그 목록 페이지 구현
- [ ] 블로그 상세 페이지 구현
- [ ] Markdown 렌더링 구현
- [ ] 기본 라우팅 설정

### Phase 2: 필터링 및 네비게이션 (P1)
- [ ] 카테고리/태그 시스템 구현
- [ ] 페이지네이션 구현
- [ ] 사이드바 구현
- [ ] 목차(TOC) 구현
- [ ] 이전/다음 포스트 네비게이션

### Phase 3: 관리자 기능 (P1)
- [ ] 관리자 인증 구현
- [ ] 포스트 CRUD 구현
- [ ] Markdown 에디터 구현
- [ ] 이미지 업로드 구현

### Phase 4: 고급 기능 (P2)
- [ ] 검색 기능
- [ ] 관련 포스트 추천
- [ ] 소셜 공유 버튼
- [ ] 예약 발행
- [ ] SEO 최적화

---

## 10. 리스크 및 고려사항

### 10.1 기술적 리스크
| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| Supabase 무료 티어 제한 | 트래픽 초과 시 서비스 중단 | 모니터링 설정, 유료 전환 계획 |
| SEO (SPA 한계) | 검색엔진 인덱싱 문제 | SSR 도입 검토 (Next.js) 또는 Prerendering |
| 이미지 최적화 | 페이지 로딩 속도 저하 | CDN, WebP 변환, lazy loading |

### 10.2 보안 고려사항
- 관리자 인증: Supabase Auth 또는 자체 인증
- XSS 방지: Markdown 렌더링 시 sanitize 처리
- 이미지 업로드: 파일 타입/크기 검증

### 10.3 확장성 고려사항
- 향후 댓글 기능 추가 가능성
- 다국어 지원 가능성
- 뉴스레터 구독 연동 가능성

---

## 11. 결정 필요 사항

### 11.1 백엔드 선택
- [ ] **Option A**: Supabase (권장 - 빠른 구현, 무료 티어)
- [ ] **Option B**: Headless CMS (Strapi, Contentful)
- [ ] **Option C**: File-based (정적 Markdown)

### 11.2 에디터 선택
- [ ] **Option A**: 기존 마크다운 에디터 라이브러리 (react-markdown-editor-lite)
- [ ] **Option B**: 리치 텍스트 에디터 (TipTap, Lexical)
- [ ] **Option C**: 외부 CMS 에디터 사용

### 11.3 이미지 저장소
- [ ] **Option A**: Supabase Storage
- [ ] **Option B**: Cloudinary
- [ ] **Option C**: AWS S3

### 11.4 SEO 전략
- [ ] **Option A**: 현재 SPA 유지 + Prerendering
- [ ] **Option B**: Next.js로 마이그레이션 (SSR)
- [ ] **Option C**: 블로그만 별도 서브도메인 (blog.webinars.co.kr)

---

## 12. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [웨비나스 기존 PRD](./webinars-prd.md)
- [기존 웹사이트](https://webinars.co.kr)
