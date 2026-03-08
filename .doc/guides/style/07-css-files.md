# 7. CSS 파일 목록

## 공개 페이지 (레거시)

### `public/css/` — WordPress/Salient 변환 CSS

| 파일 | 설명 |
|------|------|
| `inline-styles.css` | **가장 중요.** 폰트 정의, 유틸리티 클래스, SPA 내비게이션 픽스, 투명 헤더 처리 |
| `style-0.css` | Salient 테마 리셋 + 기본 타이포그래피 |
| `style-1.css` | Salient 레이아웃 (컬럼, 섹션, 래퍼) |
| `style-2.css` | 네비게이션 (GNB, 모바일 메뉴) |
| `style-6.css` | 히어로/배너 슬라이더 |
| `style-*.css` | 각 페이지별 섹션 스타일 (플러그인 포함) |

> `public/css/style-*.css` 파일은 WordPress에서 크롤링하여 변환된 것으로 **직접 수정하지 않습니다.**  
> 오버라이드가 필요하면 `public/css/inline-styles.css`에 추가합니다.

---

## 신규 React 컴포넌트

| 파일 | 소속 | 설명 |
|------|------|------|
| `src/pages/admin/admin-ui.css` | Admin | Tailwind v4 진입점, shadcn 디자인 토큰 (OKLCH 변수) |
| `src/pages/admin/admin.css` | Admin | 레이아웃/컴포넌트 클래스 (`.admin-layout`, `.admin-btn`, `.admin-table` 등) |
| `src/pages/reference2/reference2.css` | Reference | 그리드 카드, 모달, 반응형 레이아웃 |
| `src/components/shared-footer.css` | 공유 | 푸터 레이아웃, CSS 변수 기반 테마 |

---

## 로딩 순서 (index.html)

```html
<!-- index.html -->
<link rel="stylesheet" href="/css/style-0.css">
<link rel="stylesheet" href="/css/style-1.css">
...
<link rel="stylesheet" href="/css/style-32.css">
<link rel="stylesheet" href="/css/inline-styles.css">  <!-- 최후 오버라이드 -->
```

React 컴포넌트 CSS는 각 컴포넌트 파일에서 `import`로 로드됩니다:

```js
// src/pages/admin/AdminLayout.jsx
import './admin-ui.css';
import './admin.css';

// src/pages/reference2/Reference2.jsx
import './reference2.css';

// src/components/SharedFooter.jsx
import './shared-footer.css';
```

---

## PostCSS 파이프라인 (`postcss.config.cjs`)

```
입력 CSS
  └─ @tailwindcss/postcss  (Tailwind v4 처리)
  └─ autoprefixer          (벤더 프리픽스 자동 추가)
  └─ importantAdminUtilities (커스텀 플러그인)
       └─ .admin-ui 스코프 유틸리티/컴포넌트 레이어에 !important 자동 추가
```

> `importantAdminUtilities` 플러그인: `@layer utilities` / `@layer components` 안에서  
> `.admin-ui` 셀렉터를 포함한 규칙에 `!important`를 자동으로 주입합니다.  
> 레거시 CSS와의 명시도 충돌을 해결하기 위한 임시 해결책입니다.
