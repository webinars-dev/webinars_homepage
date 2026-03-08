# 9. 주의사항 및 규칙

## 절대 하지 말아야 할 것

| ❌ 금지 | 이유 |
|---------|------|
| `public/css/style-*.css` 직접 수정 | WordPress 크롤 변환본으로 재생성 시 덮어써짐 |
| Tailwind 유틸리티 클래스를 `.admin-ui` 밖에서 사용 | 레거시 스타일 파괴 가능성 |
| Admin 컴포넌트에서 `!important` 직접 남용 | PostCSS 플러그인이 이미 처리함 |
| `tailwind.config.js`의 `content` 경로에 admin 외 경로 추가 | Admin 스코핑 원칙 위반 |
| `corePlugins.preflight` 를 `true`로 변경 | 레거시 CSS 전체 레이아웃 붕괴 |

---

## 스타일 추가 위치 가이드

| 상황 | 파일 |
|------|------|
| 레거시 공개 페이지 버그픽스/오버라이드 | `public/css/inline-styles.css` |
| 신규 레거시 유틸리티 클래스 추가 | `public/css/inline-styles.css` |
| 블로그 컴포넌트 스타일 | `src/components/blog/*.css` (해당 컴포넌트와 동일 위치) |
| 레퍼런스 페이지 스타일 | `src/pages/reference2/reference2.css` |
| Admin 디자인 토큰 수정 | `src/pages/admin/admin-ui.css` (.admin-ui 블록) |
| Admin 레이아웃/컴포넌트 클래스 | `src/pages/admin/admin.css` |
| Admin shadcn 컴포넌트 신규 설치 | `npx shadcn@latest add <component>` → `src/pages/admin/ui/` |
| 공유 푸터 테마 수정 | `src/components/shared-footer.css` + `src/lib/footerTheme.js` |

---

## 알려진 이슈

### 1. 레거시 CSS 외부 자산 로드 실패
`public/css/style-*.css` 내 일부 규칙이 `webinars.co.kr` 원본 서버 자산을 참조합니다.  
개발 환경에서 ORB(Origin-keyed Response Blocking) 정책으로 차단되어  
일부 배경 이미지나 폰트가 표시되지 않을 수 있습니다.

**해결:** 필요한 자산은 `public/images/` 또는 `public/fonts/`로 로컬 복사 후 `inline-styles.css`에서 오버라이드.

### 2. SPA 내비게이션 후 투명 헤더 처리
WordPress 원본에서는 JS로 스크롤 이벤트를 감지하여 헤더 배경을 제어했습니다.  
React Router로 페이지 전환 시 해당 스크립트가 재실행되지 않아 헤더가 투명 상태로 남는 문제.

**해결:** `public/css/inline-styles.css`에서 `#header-space`에 `!important` 오버라이드 적용:
```css
#header-space {
  height: 0 !important;
  display: none !important;
}
```

### 3. Admin 입력 필드 브라우저 자동완성 스타일
WebKit 계열 브라우저의 자동완성 스타일(`-webkit-autofill`)이 Admin 테마 색상을 덮어씁니다.

**해결:** `admin.css`에서 `-webkit-text-fill-color`, `opacity`, `background` 강제 지정:
```css
.admin-input {
  background: #ffffff !important;
  color: #111827 !important;
  -webkit-text-fill-color: #111827 !important;
  opacity: 1 !important;
}
```

---

## 신규 컴포넌트 CSS 네이밍 규칙

컴포넌트 prefix를 클래스명에 반드시 포함합니다.

```
{컴포넌트명}-{요소}--{수정자}
```

예시:
```css
/* 컴포넌트: BlogCard */
.blog-card { }
.blog-card__title { }
.blog-card__meta { }
.blog-card--featured { }

/* 컴포넌트: Reference2 */
.reference2-grid { }
.reference2-card--large { }
.reference2-modal-overlay { }
```

---

## Admin 신규 컴포넌트 추가 체크리스트

- [ ] shadcn 컴포넌트가 있다면 `npx shadcn@latest add <name>` 으로 설치
- [ ] 색상값은 CSS 변수(`--primary`, `--muted` 등) 사용
- [ ] 컴포넌트 파일은 `src/pages/admin/ui/` 또는 `src/pages/admin/` 내에 위치
- [ ] Admin 루트에 `admin-ui` 클래스 래퍼 확인
- [ ] 반응형 분기는 `768px` / `1024px` 기준
- [ ] `admin.css` 하드코딩 색상 대신 Tailwind 클래스 + 토큰 사용 권장

---

## 마이그레이션 방향

현재 `admin.css`의 하드코딩 색상값들은 점진적으로 shadcn 토큰 기반 Tailwind 클래스로 교체 예정입니다.

```
[현재] .admin-btn-primary { background: #4f46e5; }
[목표] <Button variant="default"> 또는 className="bg-primary"
```
