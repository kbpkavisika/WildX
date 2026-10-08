# WildX – agent rules

- This is a prototype, not a production app. Do not over-engineer.
- Prefer the simplest implementation that gets the job done over fancy solutions.
- Follow coding standards: SOLID, clean code, clean architecture.
- Never write code comments, under any circumstance.
- Never commit or create branches unless the user specifically asks to.
- `docs/DESIGN.md` is the source of truth for all UI. Follow it exactly and never deviate. If it needs to change, ask the user and update it first.
- All UI must be mobile responsive.
- Frontend stack rules (reusable components, Zustand for state, React Query for API calls, separation of concerns between api, mapping and rendering) live in the `wildx-dev` skill. Use it before writing any WildX code.
