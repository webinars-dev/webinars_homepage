# Common Footer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 공개 페이지에 React 공통 Footer 1개를 적용하고 레거시 footer 중복을 제거한다.

**Architecture:** 레거시 raw HTML 페이지는 `PageRenderer`로 렌더링하되, 렌더 전 DOM 파싱 단계에서 기존 footer/tel 블록을 제거한다. 공개 페이지 셸은 React `SharedFooter`를 공통으로 붙이고, 블로그도 같은 컴포넌트로 전환한다.

**Tech Stack:** React, Vite, Playwright

---

### Task 1: 공통 Footer 컴포넌트 생성

**Files:**
- Create: `src/components/SharedFooter.jsx`

**Step 1: Write the failing test**

`footer-consistency.spec.js`에서 공개 페이지가 동일한 footer 정렬을 사용해야 한다는 검증을 추가한다.

**Step 2: Run test to verify it fails**

Run: `npx playwright test footer-consistency.spec.js`
Expected: footer count/x-position mismatch로 FAIL

**Step 3: Write minimal implementation**

화이트 배경, 좌측 정렬, `PARTNERSHIP`, `teldiv`를 포함한 `SharedFooter`를 만든다.

**Step 4: Run test to verify it passes**

Run: `npx playwright test footer-consistency.spec.js`
Expected: footer 정렬 관련 검증 PASS

### Task 2: 공개 페이지 래퍼 적용

**Files:**
- Create: `src/components/PublicPageLayout.jsx`
- Modify: `archive/components/about.jsx`
- Modify: `archive/components/index.jsx`
- Modify: `archive/components/services2.jsx`
- Modify: `archive/components/contact.jsx`
- Modify: `src/pages/reference2/Reference2Page.jsx`

**Step 1: Write the failing test**

`home-footer.spec.js`를 공통 Footer 존재 기준으로 갱신한다.

**Step 2: Run test to verify it fails**

Run: `npx playwright test home-footer.spec.js`
Expected: old footer expectation mismatch로 FAIL

**Step 3: Write minimal implementation**

공개 페이지가 `PageRenderer` 뒤에 `SharedFooter`를 붙이도록 래퍼를 연결한다.

**Step 4: Run test to verify it passes**

Run: `npx playwright test home-footer.spec.js footer-consistency.spec.js`
Expected: PASS

### Task 3: 레거시 footer 제거

**Files:**
- Modify: `src/components/PageRenderer.jsx`

**Step 1: Write the failing test**

`footer-consistency.spec.js`에서 공개 페이지에 dark `#footer-outer`가 없어야 한다는 검증을 추가한다.

**Step 2: Run test to verify it fails**

Run: `npx playwright test footer-consistency.spec.js`
Expected: `#footer-outer`가 남아 있어서 FAIL

**Step 3: Write minimal implementation**

DOMParser 단계에서 legacy dark footer와 raw HTML footer 섹션을 제거한다.

**Step 4: Run test to verify it passes**

Run: `npx playwright test footer-consistency.spec.js`
Expected: PASS

### Task 4: 블로그 공통 Footer 전환

**Files:**
- Modify: `src/components/blog/BlogLayout.jsx`
- Test: `blog-gnb.spec.js`

**Step 1: Write the failing test**

`footer-consistency.spec.js`에서 blog footer x-position이 공개 페이지와 같아야 한다는 검증을 유지한다.

**Step 2: Run test to verify it fails**

Run: `npx playwright test footer-consistency.spec.js`
Expected: blog footer position mismatch로 FAIL

**Step 3: Write minimal implementation**

블로그 전용 footer/teldiv를 제거하고 `SharedFooter`를 연결한다.

**Step 4: Run test to verify it passes**

Run: `npx playwright test footer-consistency.spec.js blog-gnb.spec.js`
Expected: PASS

### Task 5: 최종 검증

**Files:**
- Test: `footer-consistency.spec.js`
- Test: `home-footer.spec.js`
- Test: `blog-gnb.spec.js`

**Step 1: Run full targeted verification**

Run: `HOME_PAGE_URL=http://127.0.0.1:4173/ ABOUT_PAGE_URL=http://127.0.0.1:4173/about/ SERVICES_PAGE_URL=http://127.0.0.1:4173/services2/ CONTACT_PAGE_URL=http://127.0.0.1:4173/contact/ BLOG_PAGE_URL=http://127.0.0.1:4173/blog/ npx playwright test footer-consistency.spec.js home-footer.spec.js blog-gnb.spec.js`

**Step 2: Confirm browser state**

Playwright로 `about`, `blog`를 열어 footer count와 x-position을 확인한다.
