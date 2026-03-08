# 8. Admin UI 스코핑 메커니즘

Admin 패널의 Tailwind/shadcn 스타일이 레거시 공개 페이지에 누출되지 않도록  
다층 격리 구조를 사용합니다.

---

## 격리 구조 다이어그램

```
┌── index.html ──────────────────────────────────────┐
│  <link href="/css/style-*.css"> (레거시 글로벌 CSS) │
│                                                     │
│  ┌── React App (SPA) ──────────────────────────┐   │
│  │                                              │   │
│  │  /admin/* 라우트                             │   │
│  │  ┌── <div className="admin-ui"> ──────────┐  │   │
│  │  │  Tailwind 유틸리티 클래스 적용 범위     │  │   │
│  │  │  shadcn 컴포넌트                        │  │   │
│  │  │  OKLCH 디자인 토큰 (CSS 변수)           │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  │                                              │   │
│  │  /blog, /reference, / 등                    │   │
│  │  ← Tailwind 클래스 미적용 영역              │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 1단계: Tailwind content 경로 제한

```js
// tailwind.config.js
content: [
  './src/pages/admin/**/*.{js,jsx,ts,tsx}',
  './src/pages/admin/ui/**/*.{js,jsx,ts,tsx}',
],
```

Admin 파일에서만 Tailwind 클래스를 스캔 → 불필요한 CSS 생성 방지.

---

## 2단계: `important` 옵션으로 스코프 강제

```js
// tailwind.config.js
important: '.admin-ui',
```

생성되는 모든 Tailwind 유틸리티에 `.admin-ui` 프리픽스가 자동으로 붙습니다.

```css
/* 생성 결과 예시 */
.admin-ui .bg-background { background-color: oklch(var(--background)) !important; }
.admin-ui .text-foreground { color: oklch(var(--foreground)) !important; }
```

---

## 3단계: Preflight 비활성화

```js
// tailwind.config.js
corePlugins: {
  preflight: false,
}
```

Tailwind의 CSS 리셋(`normalize.css` 기반)을 글로벌로 적용하지 않음.  
→ 레거시 CSS의 브라우저 기본 스타일이 Tailwind에 의해 초기화되지 않음.

대신 `admin-ui.css`에서 `.admin-ui` 스코프 내에만 최소 리셋 적용:

```css
.admin-ui :where(*, ::before, ::after) {
  box-sizing: border-box;
  border-color: oklch(var(--border));
}
.admin-ui :where(button) {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  /* ... */
}
```

---

## 4단계: `!important` 자동 주입 (PostCSS 플러그인)

레거시 CSS 중 명시도(specificity)가 높은 규칙이 Admin 스타일을 덮어쓸 경우를 대비한 안전망.

```js
// postcss.config.cjs
const importantAdminUtilities = {
  postcssPlugin: 'important-admin-utilities',
  Rule(rule) {
    // .admin-ui 가 포함된 규칙만 처리
    if (!rule.selector?.includes('.admin-ui')) return;
    // utilities 또는 components 레이어 안에 있는 경우만
    if (!isUtilitiesOrComponentsLayer) return;
    // 모든 선언에 !important 추가
    rule.walkDecls(decl => { decl.important = true; });
  },
};
```

---

## 5단계: CSS 레이어 순서 명시

```css
/* admin-ui.css */
@layer theme, base, components, utilities;
```

Tailwind v4의 네이티브 CSS 캐스케이드 레이어를 명시적으로 선언하여  
레이어 우선순위를 보장합니다: `utilities > components > base > theme`.

---

## 디자인 토큰 적용 방식

CSS 변수는 `.admin-ui` 선택자 내에 정의되므로, Admin 영역 밖에서는 적용되지 않습니다.

```css
/* admin-ui.css */
@layer base {
  .admin-ui {
    --primary: 0.51 0.23 277;
    /* ... */
  }
}
```

Admin 컴포넌트에서의 사용:
```jsx
// Admin 컴포넌트 (always inside .admin-ui wrapper)
<Button className="bg-primary text-primary-foreground">저장</Button>
```

---

## Admin 컴포넌트 작성 규칙 요약

1. 모든 Admin 라우트 루트에 `<div className="admin-ui">` 래퍼 필수
2. Admin 전용 CSS는 `src/pages/admin/` 또는 `src/pages/admin/ui/` 안에 위치
3. Tailwind 유틸리티 클래스는 Admin 컴포넌트 안에서만 사용
4. 색상값은 반드시 CSS 변수 (`--primary`, `--background` 등) 사용
5. 하드코딩 색상값 사용 시 `admin.css` 패턴 참고 (점진적 마이그레이션 대상)
