# 3. 컬러 시스템

## 개요

컬러 시스템은 두 영역으로 완전히 분리됩니다.

- **레거시 공개 페이지**: 하드코딩 색상값 (Hex/RGBA)
- **Admin 패널**: OKLCH 기반 CSS 변수 (shadcn 토큰 시스템)

---

## 레거시 공개 페이지 색상

### 브랜드 컬러

| 이름 | 값 | 사용처 |
|------|-----|--------|
| 브랜드 블랙 | `#000000` / `#111111` | 헤딩, 텍스트, 보더 |
| 브랜드 화이트 | `#ffffff` | 배경, 모달, 카드 |
| 브랜드 다크 | `#1f2937` | 레이어 배경, 오버레이 |
| 액센트 오렌지 | (홈 히어로 그라데이션) | 히어로 섹션 배경 그라데이션 |

### 텍스트 컬러

| 역할 | 값 |
|------|-----|
| 기본 텍스트 | `#111111`, `#333333` |
| 보조 텍스트 | `#5C5C5C`, `#666666` |
| 비활성 텍스트 | `#9ca3af`, `#CCCCCC` |
| 화이트 텍스트 (다크 배경용) | `#ffffff` |
| 링크 hover | `#4a4a6a` (블로그) |

### 배경 컬러

| 역할 | 값 |
|------|-----|
| 페이지 배경 | `#ffffff` |
| 섹션 배경 (밝음) | `#f5f5f5`, `#f0f0f5` |
| 다크 섹션 | `#1f2937`, `#111827`, `#374151` |
| 오버레이 | `rgba(0,0,0,0.65)` ~ `rgba(0,0,0,0.8)` |

### 컨택트 폼 컬러 (다크 배경)

```css
/* 폼 입력 필드 - 반투명 화이트 */
input[type=text], input[type=email], input[type=tel], textarea {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}
/* 플레이스홀더 */
input::placeholder, textarea::placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
}
```

---

## Blog 컴포넌트 색상

```css
/* src/components/blog/BlogCard.css */
--blog-card-bg:         #ffffff
--blog-card-shadow:     rgba(0,0,0,0.06)  /* 기본 */
--blog-card-shadow-hover: rgba(0,0,0,0.12) /* hover */
--blog-category-text:   #1a1a2e
--blog-category-bg:     #f0f0f5
--blog-category-hover-bg: #1a1a2e
--blog-title-color:     #1a1a2e
--blog-excerpt-color:   #666666
--blog-meta-color:      #999999
--blog-tag-bg:          #f8f8f8
--blog-tag-color:       #888888
```

---

## Reference 컴포넌트 색상

```css
/* src/pages/reference2/reference2.css */
--reference-card-bg:      #6b7280  /* 이미지 없을 때 폴백 */
--reference-card-text:    #ffffff
--reference-overlay:      rgba(0,0,0,0.65)
--reference-divider:      rgba(255,255,255,0.55)
--reference-modal-bg:     #ffffff
--reference-modal-title:  #1f2937
--reference-modal-text:   #111827
--reference-section-border: #374151
```

---

## Admin 패널 색상 (OKLCH 토큰)

Admin은 CSS 변수를 통해 shadcn 시스템을 사용합니다. 값은 `oklch(L C H)` 형식입니다.

### Light 모드 (`admin-ui` 기본)

| 토큰 | OKLCH 값 | 역할 |
|------|---------|------|
| `--primary` | `0.51 0.23 277` | 주 액션 컬러 (인디고/퍼플 계열) |
| `--background` | `1 0 0` | 페이지 배경 (흰색) |
| `--foreground` | `0.141 0.005 285.823` | 기본 텍스트 (거의 검정) |
| `--muted` | `0.967 0.001 286.375` | 비활성 배경 |
| `--muted-foreground` | `0.552 0.016 285.938` | 비활성 텍스트 (회색) |
| `--destructive` | `0.577 0.245 27.325` | 위험/삭제 (빨강 계열) |
| `--border` | `0.92 0.004 286.32` | 테두리 |
| `--radius` | `0.5rem` | 기본 border-radius |

### Sidebar 토큰

| 토큰 | 역할 |
|------|------|
| `--sidebar` | 사이드바 배경 |
| `--sidebar-foreground` | 사이드바 텍스트 |
| `--sidebar-primary` | 사이드바 활성 메뉴 배경 |
| `--sidebar-accent` | 사이드바 hover 배경 |
| `--sidebar-border` | 사이드바 구분선 |

### Dark 모드 (`.admin-ui.dark`)

Dark 모드 토큰도 정의되어 있으나 현재 UI에서 자동 전환 기능은 미구현 상태입니다.

---

## Admin 레거시 CSS 하드코딩 색상 (`admin.css`)

`admin.css`는 shadcn 도입 이전 스타일로 일부 하드코딩 색상이 남아 있습니다.

| 역할 | 값 |
|------|-----|
| 사이드바 배경 | `#1f2937` |
| 사이드바 hover | `#374151` |
| 사이드바 테두리 | `#374151` |
| 기본 버튼 배경 | `white` |
| 기본 버튼 보더 | `#d1d5db` |
| Primary 버튼 | `#4f46e5` (인디고) |
| Success 버튼 | `#10b981` (그린) |
| Warning 버튼 | `#f59e0b` (옐로우) |
| Danger 버튼 | `#ef4444` (레드) |
| 에러 배경 | `#fef2f2` |
| 에러 테두리 | `#fecaca` |
| 에러 텍스트 | `#dc2626` |
| 상태 - Draft | `#6b7280` (회색) |
| 상태 - Published | `#10b981` (초록) |
| 상태 - Scheduled | `#3b82f6` (파랑) |

> ⚠️ 신규 Admin 컴포넌트 작성 시에는 `admin.css`의 하드코딩 값 대신, `admin-ui.css`에 정의된 shadcn CSS 변수를 사용해야 합니다.

---

## 공유 푸터 색상 (CSS 변수)

푸터는 레거시 페이지 배경색을 감지해 동적으로 테마를 설정합니다 (`src/lib/footerTheme.js`).

```css
/* src/components/shared-footer.css */
.shared-footer {
  background: var(--footer-bg, #ffffff);
  border-top: 1px solid var(--footer-border, #eeeeee);
}
.shared-footer__title,
.shared-footer__info-text {
  color: var(--footer-fg, #111111);
}
```

| CSS 변수 | 기본값 | 설명 |
|----------|--------|------|
| `--footer-bg` | `#ffffff` | 푸터 배경 |
| `--footer-fg` | `#111111` | 푸터 텍스트 |
| `--footer-border` | `#eeeeee` | 상단 구분선 |
