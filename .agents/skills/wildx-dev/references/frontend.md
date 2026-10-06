# Frontend standards (Next.js)

- Read `frontend/AGENTS.md` first; Next 16 APIs differ — check `node_modules/next/dist/docs/`.
- Follow architecture §8 (folders, `lib/*`, polling, no state libs, no new deps).
- Reuse `components/` and `lib/` (api, auth, outbox, geo, i18n) before writing new ones.
- API base `NEXT_PUBLIC_API_URL` (`.env.local`) ends with `/api/v1`. No secrets in frontend code.
- Multi-option values: TS string-literal unions/const objects mirroring backend enums, in one shared file.
- Constants (intervals, limits) in a constants file, not inline.
- Mobile rules (CMN-09): `min-h-12` tap targets, ≥4.5:1 contrast, pick-lists, status = text + colour.
- Validate forms before submit; highlight missing required fields.
- Keep components small; extract hooks/helpers when a component grows hard to read.
- Verify: `npm run lint && npm run build` must pass.
