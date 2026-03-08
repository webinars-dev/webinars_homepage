# Footer Theme Design

## Goal

공개 페이지의 공통 Footer가 각 페이지의 하단 배경 컨텍스트를 따라가도록 만든다. 배경색이 밝으면 어두운 텍스트를, 배경색이 어두우면 밝은 텍스트를 자동으로 사용한다.

## Scope

- 대상 페이지: `/`, `/about`, `/services2`, `/contact`, `/reference`, `/blog`
- 제외 페이지: 모달 `wp_*`
- Footer 구조는 유지하고, 색상만 페이지 컨텍스트에 맞게 자동 전환한다.

## Options

### 1. Route-level manual mapping

경로별로 `light`/`dark`를 직접 지정한다.

- 장점: 단순하고 예측 가능하다.
- 단점: 자동 전환이 아니고 유지보수 비용이 크다.

### 2. Pure DOM sampling

Footer 직전 콘텐츠의 계산된 배경색만 읽어 테마를 계산한다.

- 장점: 가장 자동화에 가깝다.
- 단점: 투명 배경, 중첩 래퍼, 배경 이미지에서 취약하다.

### 3. Hybrid automatic theme

기본은 DOM에서 배경을 자동 추출하고, 애매한 페이지만 명시적 오버라이드로 보정한다.

- 장점: 자동성과 안정성을 함께 확보한다.
- 단점: 1번보다 구현이 약간 복잡하다.

## Chosen Approach

`3. Hybrid automatic theme`

공통 Footer는 가능한 한 페이지 하단의 실제 배경색을 자동으로 따라간다. 다만 마지막 섹션이 투명하거나 배경 이미지 중심이라 계산이 불안정할 때는 페이지 레벨 속성이나 CSS 변수로 안전하게 오버라이드한다.

## Architecture

### SharedFooter

- 고정 `background`/`color`를 제거한다.
- `--footer-bg`, `--footer-fg`, `--footer-border` CSS 변수를 읽는다.
- Footer 루트에 현재 테마를 반영하는 `data-footer-tone`을 둔다.

### PublicPageLayout

- 페이지 콘텐츠와 Footer 사이의 공통 래퍼 역할을 유지한다.
- 렌더 후 Footer 직전의 실제 콘텐츠 노드에서 배경 후보를 찾는 resolver를 실행한다.
- resolver 결과를 CSS 변수로 Footer에 주입한다.

### Theme resolver

- Footer 바로 앞의 형제 노드부터 시작한다.
- 비투명 `background-color`를 가진 가장 가까운 후보를 찾는다.
- `background-image`만 있고 단색 배경이 없으면 오버라이드 속성을 먼저 본다.
- 그래도 못 찾으면 `body` 배경색으로 fallback 한다.
- 최종 배경색의 luminance를 계산해 foreground를 자동 결정한다.

### Explicit override

- 페이지별 예외 처리를 위해 `data-footer-theme-bg`, `data-footer-theme-tone` 또는 동등한 CSS 변수를 지원한다.
- 기본은 자동 탐색이고, override는 예외 페이지 보정 용도다.

## Error Handling

- resolver가 유효한 색을 못 찾으면 안전한 기본값을 사용한다.
- 기본값은 현재 light footer와 동일한 흰 배경 + 검정 텍스트다.
- 계산 실패가 렌더 실패로 이어지지 않게 한다.

## Testing

- Playwright 회귀 테스트로 공개 페이지에 Footer가 1개만 렌더링되는지 확인한다.
- 밝은 배경 페이지에서 Footer 배경과 텍스트 대비가 light theme 기준인지 확인한다.
- override가 필요한 케이스 하나를 만들어 dark background + light text 전환을 검증한다.
- 모달 no-footer 회귀를 유지한다.
