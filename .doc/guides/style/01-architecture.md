# 1. 스타일 아키텍처 개요

## 이중 구조 (Dual-layer Architecture)

이 프로젝트는 두 가지 완전히 다른 스타일 시스템이 공존합니다.

```
┌─────────────────────────────────────────────────────────┐
│                   webinars_homepage                     │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │  레거시 영역          │  │  신규 React 영역          │ │
│  │  (archive/components)│  │  (src/pages/, src/       │ │
│  │                      │  │   components/)           │ │
│  │  · Vanilla CSS       │  │                          │ │
│  │  · WordPress 기반    │  │  ┌────────┐ ┌──────────┐ │ │
│  │  · public/css/*.css  │  │  │ Blog   │ │  Admin   │ │ │
│  │  · inline-styles.css │  │  │Reference│ │  Panel   │ │ │
│  │                      │  │  │        │ │          │ │ │
│  │  홈, About, Services │  │  │Vanilla │ │Tailwind  │ │ │
│  │  Contact, wp_* 페이지│  │  │CSS     │ │v4+shadcn │ │ │
│  └──────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 영역별 스타일 방식

| 영역 | 방식 | 주요 파일 |
|------|------|-----------|
| 레거시 공개 페이지 (홈·About·Services·Contact·wp_*) | Vanilla CSS (WordPress/Salient 기반) | `public/css/style-*.css`, `public/css/inline-styles.css` |
| 블로그 (`/blog`) | Vanilla CSS (컴포넌트 단위) | `src/components/blog/BlogCard.css` |
| 레퍼런스 (`/reference`) | Vanilla CSS (컴포넌트 단위) | `src/pages/reference2/reference2.css` |
| 공유 푸터 | Vanilla CSS + CSS 변수 | `src/components/shared-footer.css` |
| Admin 패널 (`/admin`) | Tailwind v4 + shadcn (`.admin-ui` 스코프) | `src/pages/admin/admin-ui.css`, `src/pages/admin/admin.css` |

## 핵심 원칙

- **레거시 영역과 신규 영역의 CSS는 절대 혼용하지 않는다.**
- Admin Tailwind 클래스는 반드시 `.admin-ui` 래퍼 안에서만 적용된다 (`tailwind.config.js`의 `important: '.admin-ui'`).
- 신규 컴포넌트 작성 시 BEM 유사 네이밍 또는 컴포넌트명 prefix를 사용한다.
