# Footer Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 공개 페이지 공통 Footer가 페이지 하단 배경을 따라가고, 배경 밝기에 따라 텍스트와 테두리 색을 자동 전환하도록 만든다.

**Architecture:** `PublicPageLayout`에 footer theme resolver를 두고, `SharedFooter`는 CSS 변수 기반으로 테마를 소비한다. 자동 추출이 어려운 페이지는 명시적 override를 허용해 레거시 HTML 구조에서도 안정적으로 동작하게 한다.

**Tech Stack:** React, Vite, legacy HTML via `PageRenderer`, Playwright

---

### Task 1: Footer Theme Tests

**Files:**
- Modify: `home-footer.spec.js`
- Modify: `footer-consistency.spec.js`

**Step 1: Write the failing test**

`home-footer.spec.js`에 Footer 배경/텍스트 tone 검증을 추가한다. `footer-consistency.spec.js`에 override 케이스 확인을 위한 검증을 추가한다.

**Step 2: Run test to verify it fails**

Run: `HOME_PAGE_URL=http://127.0.0.1:4173/ ABOUT_PAGE_URL=http://127.0.0.1:4173/about/ SERVICES_PAGE_URL=http://127.0.0.1:4173/services2/ CONTACT_PAGE_URL=http://127.0.0.1:4173/contact/ REFERENCE_PAGE_URL=http://127.0.0.1:4173/reference/ BLOG_PAGE_URL=http://127.0.0.1:4173/blog/ MODAL_PAGE_URL=http://127.0.0.1:4173/2024_hybrid_4/ npx playwright test home-footer.spec.js footer-consistency.spec.js`

Expected: FAIL because footer theme is still fixed light theme.

**Step 3: Write minimal implementation**

`SharedFooter`에 theme variables와 `data-footer-tone`를 추가하고, `PublicPageLayout`에 resolver 연결을 위한 API를 만든다.

**Step 4: Run test to verify it passes**

Run the same command and confirm both specs pass.

**Step 5: Commit**

```bash
git add home-footer.spec.js footer-consistency.spec.js src/components/SharedFooter.jsx src/components/shared-footer.css src/components/PublicPageLayout.jsx
git commit -m "fix: add adaptive footer theme"
```

### Task 2: Theme Resolver and Overrides

**Files:**
- Modify: `src/components/PublicPageLayout.jsx`
- Modify: `src/components/SharedFooter.jsx`
- Modify: `src/components/shared-footer.css`
- Modify: `src/components/blog/BlogLayout.jsx`
- Modify: `src/pages/reference2/Reference2Page.jsx`

**Step 1: Write the failing test**

Footer에 `data-footer-tone`과 계산된 CSS 변수가 반영되는지 검증하는 Playwright expectation을 추가한다.

**Step 2: Run test to verify it fails**

Run: `HOME_PAGE_URL=http://127.0.0.1:4173/ ABOUT_PAGE_URL=http://127.0.0.1:4173/about/ SERVICES_PAGE_URL=http://127.0.0.1:4173/services2/ CONTACT_PAGE_URL=http://127.0.0.1:4173/contact/ REFERENCE_PAGE_URL=http://127.0.0.1:4173/reference/ BLOG_PAGE_URL=http://127.0.0.1:4173/blog/ MODAL_PAGE_URL=http://127.0.0.1:4173/2024_hybrid_4/ npx playwright test home-footer.spec.js footer-consistency.spec.js`

Expected: FAIL because footer resolver and override path are not implemented yet.

**Step 3: Write minimal implementation**

- Footer 배경색 추출 helper를 `PublicPageLayout`에 넣는다.
- Footer tone 계산을 luminance 기반으로 구현한다.
- 블로그/레퍼런스 등 예외 페이지에 필요하면 override 속성을 추가한다.

**Step 4: Run test to verify it passes**

Run the same command and confirm both specs pass.

**Step 5: Commit**

```bash
git add src/components/PublicPageLayout.jsx src/components/SharedFooter.jsx src/components/shared-footer.css src/components/blog/BlogLayout.jsx src/pages/reference2/Reference2Page.jsx
git commit -m "fix: resolve footer theme from page background"
```

### Task 3: Final Verification

**Files:**
- Test: `home-footer.spec.js`
- Test: `footer-consistency.spec.js`
- Test: `blog-gnb.spec.js`

**Step 1: Run focused regression suite**

Run: `HOME_PAGE_URL=http://127.0.0.1:4173/ ABOUT_PAGE_URL=http://127.0.0.1:4173/about/ SERVICES_PAGE_URL=http://127.0.0.1:4173/services2/ CONTACT_PAGE_URL=http://127.0.0.1:4173/contact/ REFERENCE_PAGE_URL=http://127.0.0.1:4173/reference/ BLOG_PAGE_URL=http://127.0.0.1:4173/blog/ MODAL_PAGE_URL=http://127.0.0.1:4173/2024_hybrid_4/ npx playwright test footer-consistency.spec.js home-footer.spec.js blog-gnb.spec.js`

Expected: PASS with zero failures.

**Step 2: Manual verification**

Use Playwright MCP to confirm at least one 밝은 페이지와 한 개 override 페이지에서 Footer 배경/텍스트 색이 의도대로 보이는지 확인한다.

**Step 3: Commit**

```bash
git add docs/plans/2026-03-07-footer-theme-design.md docs/plans/2026-03-07-footer-theme.md
git commit -m "docs: add footer theme design and plan"
```
