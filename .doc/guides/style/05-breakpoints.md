# 5. 반응형 브레이크포인트

## 레거시 공개 페이지

WordPress Salient 테마 기반으로 아래 브레이크포인트를 사용합니다.

| 브레이크포인트 | 범위 | 용도 |
|--------------|------|------|
| **Mobile** | `max-width: 689px` | 스마트폰 |
| **Tablet** | `690px ~ 999px` | 태블릿 (세로) |
| **Tablet Landscape** | `770px ~ 1024px` | 태블릿 (가로) |
| **Desktop** | `min-width: 1000px` | 데스크탑 |
| **Wide Desktop** | `min-width: 1025px` | 대형 모니터 |

### 주요 분기 기준

```
── 689px ─────────── 999px ─────────── 1024px ─── 1181px ──────→
  Mobile              Tablet          T.Landscape    Wide Desktop
  (max-width:689px)  (690-999px)      (770-1024px)  (1025-1181px)
```

### 코드 예시

```css
/* Mobile */
@media screen and (max-width: 789px) { ... }
@media only screen and (max-width: 690px) { ... }

/* Tablet */
@media (min-width: 770px) and (max-width: 1024px) { ... }
@media only screen and (max-width: 999px) { ... }

/* Desktop */
@media only screen and (min-width: 1000px) { ... }

/* Wide Desktop */
@media (min-width: 1025px) and (max-width: 1181px) { ... }
```

---

## 신규 컴포넌트 (Blog / Reference)

컴포넌트 단위로 독립적인 브레이크포인트를 사용합니다.

### Reference2 (`reference2.css`)

| 브레이크포인트 | 레이아웃 변화 |
|--------------|-------------|
| `max-width: 1000px` | 3열 → 2열 그리드, 카드 높이 380px → 320px |
| `max-width: 690px` | 2열 → 1열 그리드, 카드 높이 280px, 모든 카드 동일 크기 |

```css
/* 데스크탑: 3열 */
.reference2-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 380px;
}

/* 태블릿: 2열 */
@media (max-width: 1000px) {
  .reference2-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 320px;
  }
}

/* 모바일: 1열 */
@media (max-width: 690px) {
  .reference2-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: 280px;
  }
}
```

### 공유 푸터 (`shared-footer.css`)

| 브레이크포인트 | 변화 |
|--------------|------|
| `max-width: 999px` | 좌측 패딩 60px → 80px |
| `max-width: 690px` | 데스크탑 타이틀 숨기고 모바일 타이틀 표시 |

---

## Admin 패널 (`admin.css`)

| 브레이크포인트 | 변화 |
|--------------|------|
| `max-width: 1024px` | 포스트 편집 폼: 2열(1fr + 320px) → 1열, 사이드바 상단으로 이동 |
| `max-width: 768px` | 사이드바 고정 해제, 메인 마진 제거, 패딩 축소 |

```css
@media (max-width: 1024px) {
  .admin-post-form { grid-template-columns: 1fr; }
  .admin-post-form-sidebar { order: -1; }
}

@media (max-width: 768px) {
  .admin-sidebar { width: 100%; height: auto; position: relative; }
  .admin-main { margin-left: 0; }
  .admin-page { padding: 16px; }
}
```

---

## 특수 디바이스 대응 (레거시)

일부 세밀한 디바이스 너비별 대응이 있습니다 (레거시 Reference 카드 높이 조정):

```css
@media (min-width: 720px) and (max-width: 769px) { ... }
@media (min-width: 411px) and (max-width: 415px) { ... }  /* iPhone 6/7/8 Plus */
@media (min-width: 377px) and (max-width: 410px) { ... }  /* iPhone X/XS */
@media (min-width: 362px) and (max-width: 376px) { ... }  /* 중소형 폰 */
@media screen and (max-width: 361px) { ... }
@media screen and (max-width: 321px) { ... }              /* iPhone SE */
```
