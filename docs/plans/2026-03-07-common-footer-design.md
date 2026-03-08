# Common Footer Design

**Date:** 2026-03-07

## Goal

공개 페이지 `/`, `/about`, `/services2`, `/contact`, `/reference`, `/blog`에 동일한 React 공통 Footer 컴포넌트 1개를 적용한다. 모달 `wp_*` 페이지에는 Footer를 렌더링하지 않는다.

## Decision

- 공통 Footer는 React 컴포넌트로 구현한다.
- 레거시 raw HTML 페이지 안에 박혀 있는 기존 footer/tel 블록은 `PageRenderer`에서 제거한다.
- 블로그는 전용 푸터를 제거하고 공통 Footer를 사용한다.
- Footer 디자인은 화이트 배경, 좌측 정렬, 데스크톱 `60px` 시작선 기준으로 통일한다.

## Scope

- 포함: `home`, `about`, `services2`, `contact`, `reference`, `blog`
- 제외: `wp_*` 모달 상세 페이지, 관리자 페이지

## Implementation Notes

- Footer 내용은 `© 2022년 주식회사 웨비나스...`, 회사 정보, `PARTNERSHIP`, 고정 `teldiv`를 포함한다.
- `PageRenderer`는 레거시 dark `#footer-outer`와 raw HTML 내부 footer 섹션을 제거해야 한다.
- `reference`는 `PageRenderer` 기반이므로 동일 제거 규칙을 재사용하고, React에서 공통 Footer를 추가한다.

## Verification

- 공개 페이지에서 Footer 컴포넌트가 1개만 보이는지 확인
- `#footer-outer` 레거시 dark footer가 제거됐는지 확인
- footer 첫 줄 시작 x 좌표가 공개 페이지 간 동일한지 확인
- blog GNB 회귀 없는지 확인
