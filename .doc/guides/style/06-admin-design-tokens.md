# 6. Admin UI 디자인 토큰

Admin 패널은 shadcn + Tailwind v4 기반으로 구성되어 있으며,  
`src/pages/admin/admin-ui.css`에 CSS 변수로 모든 디자인 토큰이 정의되어 있습니다.

---

## Tailwind 설정 개요 (`tailwind.config.js`)

```js
module.exports = {
  darkMode: ['class'],
  // Admin 컴포넌트 파일에만 적용
  content: ['./src/pages/admin/**/*.{js,jsx,ts,tsx}'],
  important: '.admin-ui',  // 모든 유틸리티에 .admin-ui 스코프 강제
  corePlugins: {
    preflight: false,      // 글로벌 CSS 리셋 비활성화 (레거시 충돌 방지)
  },
  // ...
}
```

> `corePlugins.preflight: false` — 레거시 공개 페이지 스타일과 충돌 방지를 위해 Tailwind의 기본 리셋을 비활성화합니다.

---

## CSS 변수 전체 목록 (Light 모드)

`src/pages/admin/admin-ui.css` > `.admin-ui` 블록

### 기본 색상

```css
--background: 1 0 0;                    /* 흰색 배경 */
--foreground: 0.141 0.005 285.823;      /* 거의 검정 텍스트 */
--card: 1 0 0;
--card-foreground: 0.141 0.005 285.823;
--popover: 1 0 0;
--popover-foreground: 0.141 0.005 285.823;
```

### 주요 액션 색상

```css
--primary: 0.51 0.23 277;              /* 인디고/퍼플 계열 */
--primary-foreground: 0.96 0.02 272;   /* 연한 퍼플-화이트 */
```

### 보조 색상

```css
--secondary: 0.967 0.001 286.375;      /* 연한 회색 배경 */
--secondary-foreground: 0.21 0.006 285.885;

--muted: 0.967 0.001 286.375;          /* 비활성 배경 */
--muted-foreground: 0.552 0.016 285.938; /* 회색 텍스트 */

--accent: 0.967 0.001 286.375;         /* 강조 배경 */
--accent-foreground: 0.21 0.006 285.885;
```

### 상태 색상

```css
--destructive: 0.577 0.245 27.325;     /* 빨강 계열 (삭제/경고) */
--destructive-foreground: 0.985 0 0;
```

### 구조 색상

```css
--border: 0.92 0.004 286.32;
--input: 0.92 0.004 286.32;
--ring: 0.705 0.015 286.067;
```

### 모서리 반경

```css
--radius: 0.5rem;   /* 8px */
/* tailwind.config.js 에서 lg/md/sm으로 파생 */
/* lg: var(--radius)          = 8px */
/* md: calc(var(--radius)-2px) = 6px */
/* sm: calc(var(--radius)-4px) = 4px */
```

### 차트 색상

```css
--chart-1: 0.51 0.23 277;
--chart-2: 0.623 0.214 259.815;
--chart-3: 0.546 0.245 262.881;
--chart-4: 0.488 0.243 264.376;
--chart-5: 0.424 0.199 265.638;
```

### 사이드바 색상

```css
--sidebar: 0.985 0 0;                       /* 사이드바 배경 (밝은 흰색) */
--sidebar-foreground: 0.141 0.005 285.823;
--sidebar-primary: 0.51 0.23 277;           /* 활성 메뉴 배경 */
--sidebar-primary-foreground: 0.96 0.02 272;
--sidebar-accent: 0.967 0.001 286.375;      /* hover 배경 */
--sidebar-accent-foreground: 0.21 0.006 285.885;
--sidebar-border: 0.92 0.004 286.32;
--sidebar-ring: 0.705 0.015 286.067;
```

---

## Dark 모드 변수 (`.admin-ui.dark`)

Dark 모드 클래스 추가 시 자동 전환됩니다. (현재 UI 토글 기능 미구현)

주요 변화:
```css
--background: 0.141 0.005 285.823;    /* 다크 배경 */
--foreground: 0.985 0 0;               /* 밝은 텍스트 */
--primary: 0.59 0.2 277;               /* 더 밝은 인디고 */
--border: 1 0 0 / 10%;                 /* 반투명 보더 */
```

---

## Tailwind 색상 매핑

`tailwind.config.js`에서 CSS 변수를 Tailwind 색상으로 매핑하여 클래스로 사용 가능합니다.

```js
colors: {
  primary:     'oklch(var(--primary))',
  background:  'oklch(var(--background))',
  foreground:  'oklch(var(--foreground))',
  muted:       'oklch(var(--muted))',
  // ...
}
```

사용 예시:
```jsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">저장</button>
</div>
```

---

## 설치된 shadcn 컴포넌트 목록

`src/pages/admin/ui/` 디렉토리에 설치된 컴포넌트:

| 컴포넌트 | 파일 | 용도 |
|----------|------|------|
| `Button` | `button.jsx` | 버튼 (variant: default, outline, ghost 등) |
| `Badge` | `badge.jsx` | 상태 뱃지 |
| `Card` | `card.jsx` | 카드 레이아웃 |
| `Checkbox` | `checkbox.jsx` | 체크박스 |
| `Input` | `input.jsx` | 텍스트 입력 |
| `Label` | `label.jsx` | 폼 라벨 |
| `Select` | `select.jsx` | 셀렉트 박스 |
| `Separator` | `separator.jsx` | 구분선 |
| `Table` | `table.jsx` | 데이터 테이블 |
| `Textarea` | `textarea.jsx` | 텍스트 영역 |
| `RichTextEditor` | `rich-text-editor.jsx` | 마크다운 에디터 래퍼 |
| `cn` | `cn.js` | clsx + tailwind-merge 유틸 |
