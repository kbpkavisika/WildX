---
name: wildx-dev
description: Mandatory workflow for implementing any WildX feature, requirement (CMN/PAT/INC/SEN/COM IDs) or use case in backend or frontend. Use before writing WildX code.
---

# WildX dev workflow

Run the gates in order. Never skip one.

## Laziness ladder
Understand the problem fully first, then stop at the first rung that holds:
1. Does it need to exist at all? Speculative need → skip it (YAGNI).
2. Already in this codebase? Reuse it.
3. Stdlib / framework (Spring, Next.js, React) does it? Use it.
4. Native platform feature covers it? (HTML input over a widget, CSS over JS, DB constraint over app code.)
5. Already-installed dependency solves it? Use it. Never add a new one (Zustand and React Query are the approved state and data libraries).
6. Only then: the minimum code that works.

Rules: no single-implementation interfaces or one-product factories, no config for constants, no scaffolding "for later", deletion over addition, fewest files, shortest working diff. Bug fix = root cause in the shared function, not a patch per caller. Never simplify away input validation, security, data-loss error handling, accessibility basics, or anything explicitly required.

SOLID, lightly: one clear responsibility per class/component, depend on the existing abstractions, keep interfaces small. Apply it to code you are already writing; never create interfaces, classes or layers just to satisfy a principle.

## 1. Clarify requirements
- Read only the relevant parts of `docs/requirements.md`: §1–4 (scope, actors, CMN) + the target UC section. Use `Grep`/`Read` with offset; do not load other UCs.
- List the requirement IDs in scope, priority, and acceptance criteria.
- Ask the user about every ambiguity, gap or conflict (AskUserQuestion). Do not guess.

## 2. Check architecture
- Read only the relevant sections of `docs/architecture.md` (tables, endpoints, flows for the IDs in scope; §2–4 always).
- Note reusable services/utils/components already listed or present in code (Grep the codebase).

## 3. Plan
Write a short plan: files to add/change per layer, entities/DTOs/endpoints, tests, requirement IDs covered.

## 4. Evaluate the plan
Check it against: requirements in scope, architecture, the standards reference, the laziness ladder (cut anything a higher rung covers), reuse (no duplicate logic), no new dependencies. Fix the plan, then show it to the user before coding.

## 5. Docs first
If the plan or user decision diverges from `requirements.md` or `architecture.md`, update the docs **before** writing code. Docs must never be outdated.

## 6. Implement
Load only the reference you need:
- Backend → [references/backend.md](references/backend.md)
- Frontend → [references/frontend.md](references/frontend.md)

## 7. Verify (before finishing)
- Backend: `cd backend && ./mvnw verify` — compiles, tests pass, ≥80% coverage on new code.
- Frontend: `cd frontend && npm run lint && npm run build`.
- No code comments anywhere.
- Re-check docs still match the code.
