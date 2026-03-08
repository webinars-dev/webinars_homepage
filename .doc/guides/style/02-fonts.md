# 2. 폰트 시스템

## 사용 폰트 목록

| 폰트명 | 적용 영역 | 특성 |
|--------|----------|------|
| **Hyphen Sans** (`hyphen`) | 레거시 공개 페이지 헤딩, GNB 메뉴 | 커스텀 웹폰트, 대문자 전용, 영문 브랜드체 |
| **Noto Sans KR** | 레거시 한국어 본문·캡션 | Google Fonts (self-hosted), 400/700/900 weight |
| **Inter** | Admin 패널 UI | Google Fonts CDN, 400/500/600/700 weight |
| **Noto Sans** | Admin 패널 영문 보조 | Google Fonts CDN |

---

## Hyphen Sans (커스텀 웹폰트)

레거시 사이트 전체 헤딩 및 GNB에 사용되는 브랜드 폰트입니다.

```css
/* public/css/inline-styles.css */
@font-face {
  font-family: 'hyphen';
  font-style: normal;
  font-weight: 400;
  src: url('/images/fonts/Hyphen-Sans.woff2') format('woff2'),
       url('/images/fonts/Hyphen-Sans.woff') format('woff'),
       url('/images/fonts/Hyphen-Sans.otf') format('opentype');
}
```

**적용 규칙:**
```css
h1, h2, h3   { font-family: 'hyphen', 'Noto Sans KR' !important; text-transform: uppercase; }
h1 span      { font-family: 'hyphen' !important; text-transform: uppercase; }
.en          { font-family: 'hyphen' !important; }
/* GNB 메뉴 */
#top nav > ul > li > a { font-family: 'hyphen' !important; text-transform: uppercase; font-size: 20px; font-weight: 900; }
```

파일 위치: `/public/images/fonts/Hyphen-Sans.woff2`, `.woff`, `.otf`

---

## Noto Sans KR (레거시 한국어 본문)

```css
/* public/css/inline-styles.css */
@font-face {
  font-family: 'Noto Sans KR';
  font-weight: 400; /* Regular */
  src: url('//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff2') format('woff2'), ...;
}
@font-face {
  font-family: 'Noto Sans KR';
  font-weight: 700; /* Bold */
  ...
}
@font-face {
  font-family: 'Noto Sans KR';
  font-weight: 900; /* Black */
  ...
}
```

**적용 규칙:**
```css
h5, h6         { font-family: 'Noto Sans KR' !important; }
.ult_expheader { font-family: 'Noto Sans KR' !important; }
.noto          { font-family: 'Noto Sans KR' !important; }
```

---

## Inter + Noto Sans (Admin 패널)

Admin 패널은 페이지 진입 시 JS로 Google Fonts를 동적 로드합니다.

```js
// src/pages/admin/AdminLayout.jsx
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap';
```

CSS 적용:
```css
/* src/pages/admin/admin-ui.css */
.admin-ui {
  font-family: 'Inter', 'Noto Sans', 'Noto Sans KR',
               ui-sans-serif, system-ui, -apple-system, ...;
}
```

---

## 폰트 사용 원칙

1. **레거시 영역**: `hyphen` (영문 헤딩) + `Noto Sans KR` (한국어 본문) 조합
2. **신규 Blog/Reference 영역**: 시스템 폰트 스택 사용 (별도 지정 없음)
3. **Admin 영역**: `Inter` + `Noto Sans KR` (`.admin-ui` 스코프 내에서만)
4. 레거시 CSS에는 `.noto` 클래스로 한국어 폰트를 명시적으로 지정하는 패턴이 존재
