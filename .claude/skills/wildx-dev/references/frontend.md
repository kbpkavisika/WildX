# Frontend standards (Next.js)

- Read `frontend/AGENTS.md` first; Next 16 APIs differ — check `node_modules/next/dist/docs/`.
- `docs/DESIGN.md` is mandatory for every UI change: use its tokens, components and Do's and Don'ts exactly. Never deviate. If it needs to change, ask the user and update it first.
- Follow architecture §8 (folders, `lib/*`, polling).
- Reuse `components/` and `lib/` (api, auth, outbox, geo, i18n) before writing new ones. Build reusable components first; extract anything used twice.
- State: Zustand for client state (one small store per concern). Server data is never kept in Zustand.
- API calls: React Query (`useQuery`/`useMutation`) wrapped in a custom hook per resource. Components never call `fetch` directly.
- Separation of concerns: the api layer only sends the request and returns the raw response. Mapping, calculations and business rules go in separate pure mapper/service functions. Components only render.
- Coding standards: SOLID, small single-purpose functions, meaningful names, no magic values, no duplicated logic, strict TypeScript with no `any`.
- API base `NEXT_PUBLIC_API_URL` (`.env.local`) ends with `/api/v1`. No secrets in frontend code.
- Multi-option values: TS string-literal unions/const objects mirroring backend enums, in one shared file.
- Constants (intervals, limits) in a constants file, not inline.
- Every screen must be mobile responsive: build mobile-first with Tailwind breakpoints, no horizontal page scroll, layouts reflow to one column on narrow screens (per `docs/DESIGN.md` Layout).
- Mobile rules (CMN-09): `min-h-12` tap targets, ≥4.5:1 contrast, pick-lists, status = text + colour.
- Validate forms before submit; highlight missing required fields.
- Keep components small; extract hooks/helpers when a component grows hard to read.
- Verify: `npm run lint && npm run build` must pass.
