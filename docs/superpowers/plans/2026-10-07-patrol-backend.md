# Patrol backend implementation plan

Goal: implement the backend for route planning, patrol operation, live monitoring, history and sector coverage.

Architecture: reuse JWT authentication, park-scoped JPA repositories and existing error handling. Controllers return records; services own validation and transactions. Use the installed JSON mapper and standalone geometry/metrics utilities without adding application dependencies.

Scope: backend only. Sector management is included because tracking and coverage depend on it. Full park/user administration is excluded.

## Constraints

- No code comments, frontend changes, pushes, deleted branches or unrelated history edits.
- Combine related backend features into descriptive configuration, operations and analytics branches with larger functional commits and local non-fast-forward merges. Keep total commits dated today below twenty, including the nine pre-existing commits and all merges.
- Historical geometry and metrics precede authentication; secured integration uses current dates.
- Record assumptions in the uncommitted root decisions file.

## Tasks

- [x] Route geometry: implement and test LineString parsing with valid geographic coordinates.
- [x] Sector geometry: implement and test closed Polygon rings, boundaries and holes.
- [x] History calculations: test haversine distance in metres and duration in seconds.
- [x] Route configuration: add PatrolRoute, request/response records, park-scoped repository, PatrolRouteService and controller; test manager-only writes and geometry validation.
- [x] Sector configuration: add Sector, ParkService and controller, neglect-days setting and read support; test park isolation and polygon validation.
- [x] Patrol assignment: add Patrol, status enum, repository, request/response records and PatrolService; validate assigned ranger's role, activity and park.
- [x] Today's patrols: return assigned ranger's current-date patrols including route geometry; test date and ownership filtering.
- [x] Start patrol: validate ownership and scheduled date, lock state changes, record start timestamp and make retries idempotent.
- [x] Tracking: add TrackPoint and batch ingestion; validate coordinates/times, unique timestamps, active state and sampling policy; test retry and ordering behavior.
- [x] Waypoints: persist optional note and choice on flagged track points; ensure manual points bypass sampling and never create incidents.
- [x] GPS availability: add ranger-owned GPS status endpoint preserving active state and supporting resumed uploads.
- [x] End patrol: record end time, validate timing against the track, make retries idempotent.
- [x] Sector assignment: integrate geometry mapping into ingestion; choose lowest matching ID and leave outside points unmapped.
- [x] Live monitoring: expose active patrols with ranger, route, last location/time and offline status, plus park-scoped ordered tracks.
- [x] Coverage: aggregate sector last visits on read, include never-visited sectors, sort neglected first and use park neglect-days.
- [x] Patrol history: list completed patrol metrics and replay track; use batch reads to avoid N+1 queries.
- [x] Coverage reports: validate inclusive date range; return every sector's point count, distinct patrol count and latest visit; CSV uses escaped fields and formula-safe names.
- [x] Verification: run backend clean verify, measure new-code coverage, test HTTP role enforcement, inspect new commits/messages/dates and verify tracked working tree is clean.

## Verification focus

Foreign-park identifiers must not expose data. Rangers cannot operate another ranger's patrol. Empty or malformed geometries and non-finite coordinates must fail cleanly. Concurrent/retried state changes and uploads must preserve timestamps and waypoint details. History and reports must include deterministic ordering and zero-visit sectors without leaking entities.
