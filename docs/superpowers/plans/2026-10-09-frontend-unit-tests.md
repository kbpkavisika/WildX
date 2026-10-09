# Frontend unit tests implementation plan

**Goal:** Add frontend unit tests with at least 80% statements, branches, functions and lines coverage.

**Architecture:** Vitest runs TypeScript and React tests in jsdom. React Testing Library exercises rendered behavior; fetch, browser APIs and map infrastructure are mocked at their external boundaries. Coverage includes all application source, excluding only `.d.ts` declarations.

**Scope:** Existing CMN, PAT, INC, SEN and COM behavior. No UI or backend changes, comments, branches or commits.

- [x] Add the test runner, coverage thresholds, npm scripts and usage documentation.
- [x] Test validation, mapping, stores, permissions, API contracts and GPS sampling, including invalid and missing inputs.
- [x] Test queries, mutations and browser hooks, including errors, cleanup and invalidation.
- [x] Test components and pages, including empty, loading, error and user interaction states.
- [x] Run coverage and close gaps without excluding executable source. Run lint and build, then review the added files.

**Verification:** `npm run test:coverage`, `npm run lint` and `npm run build` from `frontend`.

**Result:** 706 tests pass. Coverage: 99.33% statements, 97.69% branches, 99.14% functions and 99.64% lines. Build and TypeScript pass. Lint passes with three existing image warnings. Independent review found no important issues.
