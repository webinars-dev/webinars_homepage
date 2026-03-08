# 스타일 가이드

웨비나스 프런트엔드의 CSS 구조, 디자인 토큰, 폰트, 컬러 시스템 정리 문서입니다.

---

## 목차

| # | 문서 | 설명 |
|---|------|------|
| 1 | [스타일 아키텍처 개요](./01-architecture.md) | 레거시 vs 신규 이중 구조 설명 |
| 2 | [폰트 시스템](./02-fonts.md) | Hyphen Sans, Noto Sans KR, Inter 적용 방식 |
| 3 | [컬러 시스템](./03-colors.md) | 레거시 하드코딩 색상 / Admin OKLCH 토큰 |
| 4 | [레거시 유틸리티 클래스](./04-legacy-utilities.md) | `.txt*`, `.mt*`, `.fl` 등 전체 목록 |
| 5 | [반응형 브레이크포인트](./05-breakpoints.md) | 레거시 / 신규 컴포넌트 / Admin 분기 기준 |
| 6 | [Admin UI 디자인 토큰](./06-admin-design-tokens.md) | OKLCH CSS 변수 전체 목록, Tailwind 매핑 |
| 7 | [CSS 파일 목록](./07-css-files.md) | 파일별 역할, 로딩 순서, PostCSS 파이프라인 |
| 8 | [Admin UI 스코핑 메커니즘](./08-admin-scoping.md) | `.admin-ui` 격리 5단계 구조 상세 설명 |
| 9 | [주의사항 및 규칙](./09-rules-and-notes.md) | 금지 사항, 알려진 이슈, 네이밍 규칙 |

---

## 한눈에 보는 아키텍처

```
webinars_homepage
│
├── 레거시 공개 페이지 (홈·About·Services·Contact 등)
│   ├── public/css/style-*.css     ← WordPress 변환본 (수정 금지)
│   └── public/css/inline-styles.css ← 오버라이드 전용
│
├── 신규 React 컴포넌트 (Blog, Reference)
│   ├── src/components/blog/BlogCard.css
│   ├── src/pages/reference2/reference2.css
│   └── src/components/shared-footer.css
│
└── Admin 패널 (/admin/*)   ← .admin-ui 스코프 내 완전 격리
    ├── src/pages/admin/admin-ui.css  ← Tailwind v4 + OKLCH 토큰
    ├── src/pages/admin/admin.css     ← 레이아웃 클래스 (마이그레이션 중)
    └── src/pages/admin/ui/           ← shadcn 컴포넌트
```

---

## 빠른 참조

- **레거시 CSS 오버라이드** → `public/css/inline-styles.css`
- **Admin 색상 변경** → `src/pages/admin/admin-ui.css` CSS 변수
- **Admin 새 컴포넌트 추가** → `npx shadcn@latest add <name>`
- **브레이크포인트 기준** → 모바일 `690px`, 태블릿 `1000px`, Admin `768px/1024px`
- **Admin Tailwind 적용 안 될 때** → `<div className="admin-ui">` 래퍼 확인
