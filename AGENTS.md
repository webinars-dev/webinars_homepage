

# Tesk Process
- 태스크 진행시 jira mcp 를 사용하여  https://webinars2012.atlassian.net/jira/software/c/projects/WH/boards/142 에 Backlog에 이슈를 등록하고 태스크를 진행. 
  진행시에는 Selected for Development, 테스트시에는 TEST, 완료시에는 Done으로 이동. 푸시요청시 푸시 완료 후 Deployment 로 이동
- Done 으로 변경시 해결 방안도 정리해서 추가


# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Vite + React app source (`src/main.jsx` entry, routes in `src/App.jsx`).
- `src/pages/`: Route-level pages (including `src/pages/admin/` and `src/pages/admin/ui/` for the admin UI).
- `src/components/`, `src/hooks/`, `src/lib/`, `src/services/`, `src/types/`: Shared UI, hooks, utilities (e.g. `src/lib/supabase.js`), API helpers, and types.
- `archive/`: Legacy/generated pages/components still referenced by the router—avoid large refactors here unless required.
- `public/`: Static assets served as-is (`public/wp/`, `public/images/`, etc.).
- `api/`: Vercel serverless functions (e.g. `api/admins.mjs`).
- `server/`: Local dev middleware used by Vite (e.g. `/api/admins` via `server/adminsHandler.mjs`).
- `supabase/migrations/`: Database migrations.

## Build, Test, and Development Commands
- `npm install` (or `npm ci`): Install dependencies (see `.npmrc` for `legacy-peer-deps=true`).
- `npm run dev`: Start Vite dev server on `http://localhost:3000`.
- `npm run build`: Production build to `dist/`.
- `npm run preview`: Serve the production build locally.
- `npm run crawl`: Runs `crawler-improved.js` (Puppeteer-based; may require network access).

## Coding Style & Naming Conventions
- JavaScript/JSX (ESM). Use 2-space indentation, single quotes, and keep semicolon usage consistent with the file you touch.
- React components: `PascalCase.jsx` (e.g. `src/components/ContactThankYou.jsx`).
- Hooks: `useSomething` under `src/hooks/`.
- Admin UI uses Tailwind scoped to `.admin-ui` (see `tailwind.config.js` and `postcss.config.cjs`); avoid leaking global styles.

## Testing Guidelines
- End-to-end tests use Playwright: root `*.spec.js` with config in `playwright.config.js`.
- Run: `npx playwright test` (or a single file: `npx playwright test admin-ui.spec.js`).
- Reports/artifacts: `playwright-report/`, `test-results/`.

## Commit & Pull Request Guidelines
- Follow Conventional Commits-style history: `feat(scope): ...`, `fix: ...`, `chore: ...`, `docs: ...` (Korean summaries are common and OK).
- PRs: include a short description, linked issue/PRD (see `doc/projects/`), and screenshots for UI/admin changes; note any env/migration steps.

## Configuration & Security Tips
- Do not commit secrets (`.env*` is gitignored). Common vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
