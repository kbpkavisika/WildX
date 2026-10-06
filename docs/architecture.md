# WildX – Architecture

Technical design for [requirements.md](requirements.md). Requirement IDs (`PAT-05`, `CMN-04` …) are referenced throughout.
Guiding rule: **simplest thing that satisfies the requirement.** This is a prototype. Do not add layers, services or libraries that this document does not list without agreeing it with the team first.

---

## 1. Overview

```
 Phone browser (ranger / villager)          Desktop browser (manager / CLO / LEL)
            │                                           │
            └──────────────┬────────────────────────────┘
                           │ HTTPS JSON (JWT)
                 ┌─────────▼──────────┐       Simulators (curl / script)
                 │  Next.js frontend  │       collar fixes, camera images,
                 └─────────┬──────────┘       inbound SMS  ── X-Api-Key ──┐
                           │ REST /api/**                                  │
                 ┌─────────▼──────────────────────────────────────────────▼┐
                 │  Spring Boot monolith  (controllers → services → JPA)   │
                 │  @Scheduled jobs: escalation, device health             │
                 └─────────┬───────────────────────────┬───────────────────┘
                           │                           │
                     PostgreSQL                  ./uploads (photos/images)
```

- The system is **one backend and one frontend.** There are no microservices, no message broker and no WebSockets.
- **Real-time behaviour uses polling.** The dashboard polls every 15 s and notifications are polled every 30 s, which meets NFR-04.
- The **external systems are simulated** through REST endpoints protected by a static API key (§7).

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | Spring Boot 4.1, Java 25, Maven | Already scaffolded in `backend/` |
| Persistence | Spring Data JPA + PostgreSQL | `ddl-auto=update` during development, with no migrations tool. Custom queries use the Criteria API only (no raw SQL/JPQL) |
| Validation | `spring-boot-starter-validation` | `@Valid` on request DTOs |
| Auth | `spring-boot-starter-security` + `spring-boot-starter-security-oauth2-resource-server` | Stateless HS256 JWT access token issued by our own `/api/v1/auth/login`, valid 12 h. Claims: `sub` (user id), `role`, `parkId`. No refresh tokens, cookies or sessions, and no external IdP |
| Boilerplate | Lombok | `@Getter @Setter` on entities, and Java `record` for DTOs |
| Frontend | Next.js 16 (App Router), React 19, TypeScript | ⚠ Read `frontend/AGENTS.md`, because Next 16 APIs differ from older versions |
| Styling | Tailwind CSS 4 | Mobile-first: write the base styles for phones and add `lg:` styles for the desktop dashboard |
| Maps | `leaflet` + `react-leaflet`, OpenStreetMap tiles | Load map components with `dynamic(..., { ssr:false })` |
| Geometry | Hand-written `GeoUtil` (point-in-polygon, haversine) | **No PostGIS.** Polygons are stored as GeoJSON text |

The project adds **no other dependencies** without team agreement. Phone camera and GPS use native browser features: `<input type="file" accept="image/*" capture="environment">` and `navigator.geolocation.watchPosition`.

## 3. Key technical decisions

| # | Decision | Why / trade-off |
|---|---|---|
| D1 | A responsive web app replaces native mobile apps | One codebase. The trade-off is that GPS stops in the background when the screen is locked, which is a documented limitation |
| D2 | Geometry is stored as GeoJSON in `TEXT` columns and checked in Java | No PostGIS install is needed. The data volumes are prototype-sized |
| D3 | Polling replaces WebSockets/SSE | It is simpler and works through any proxy. 15–30 s of latency is acceptable |
| D4 | **Dispatch** is one table with a polymorphic `(source_type, source_id)` | UC2, UC3 and UC4 all reuse one "Dispatch Responder" (CMN-06) |
| D5 | Incident types, alert rules, zones, sectors and segments are per-park data | A new park or hazard type needs no code change (fixes W4) |
| D6 | A validated community report **is** the conflict case, with no separate table | Its lifecycle is linear, so a second table would add nothing |
| D7 | Waypoints are track points with `is_waypoint=true` | There is one location model, with no duplicated GPS fields (fixes W12) |
| D8 | Files are stored on local disk (`wildx.upload-dir`), and the DB holds only the path | No object store is needed for the prototype |
| D9 | The JWT is kept in `localStorage` | This is acceptable for the prototype, and the trade-off against XSS exposure is noted |
| D10 | The SMS gateway is simulated: outbound SMS is only logged | Swapping in a real provider later only touches `SmsService` |

## 4. Backend structure

The backend keeps the existing layer packages under `com.wildx.wildx` and adds `controller` and `dto`. **Prefix each class name with its module** so the four devs rarely edit the same file.

```
com.wildx.wildx
├─ config/      SecurityConfig, JwtConfig, WebConfig (CORS), DataSeeder
├─ constant/    Roles, AppConstants (night hours, thresholds)
├─ controller/  AuthController, AdminController, Park*Controller,
│               Patrol*, Incident*, Dispatch*, Alert*, Device*, CameraImage*, Community*, Sms*, Report*
├─ dto/         request/response records, e.g. IncidentCreateRequest
├─ exception/   NotFoundException, BadRequestException, GlobalExceptionHandler (@RestControllerAdvice)
├─ mapper/      hand-written entity ↔ DTO mappers (static methods)
├─ model/       JPA entities (§5)
├─ repository/  Spring Data interfaces (derived methods only); *CustomRepository + impl/*CustomRepositoryImpl (Criteria API)
├─ service/     interfaces; impl/*ServiceImpl hold business logic, @Transactional; *Job classes with @Scheduled
├─ type/        enums (Role, Severity, IncidentStatus, …)
└─ util/        GeoUtil, SmsParser
```

Each package's owner is shown in the requirements doc §3. The shared services have these owners:

| Shared service | Owner |
|---|---|
| `AuthService`, `ParkService` (parks, sectors) | UC1 |
| `DispatchService` | UC2 |
| `NotificationService` | UC3 |
| `SmsService` | UC4 |

Rules:
- Controllers stay thin and call services. A service may call another module's service, but **never another module's repository**.
- Every endpoint returns DTOs and never entities.
- Errors are returned as `{ "error": "message" }` with the right HTTP status from `GlobalExceptionHandler`.
- Every list is scoped to the caller's park. The server reads `parkId` from the JWT, except for Admin.

## 5. Database design (PostgreSQL)

All tables have `id BIGSERIAL PK` and the audit columns `created_at`, `modified_at` (`TIMESTAMPTZ`), `created_by`, `modified_by` (user id from the JWT, `NULL` for unauthenticated or system writes). Entities get them by extending `model/Auditable` (Spring Data JPA auditing). Location columns are always `lat DOUBLE, lng DOUBLE`. Geometry columns hold GeoJSON `TEXT`. Enums are stored as `VARCHAR` (`@Enumerated(STRING)`).

`dispatch` links to `incident`, `alert` or `community_report` through `(source_type, source_id)`, with no foreign key (D4).

**Shared / UC1**

| Table | Columns |
|---|---|
| `park` | name, code UNIQUE, boundary_geojson, neglect_days (7), duplicate_window_min (120), hotspot_threshold (5) |
| `sector` | park_id FK, name, polygon_geojson |
| `app_user` | park_id FK NULL (null for Admin), name, email UNIQUE, phone, password_hash, role, language (`en`/`si`/`ta`), active, on_duty, last_lat, last_lng, last_seen_at |
| `patrol_route` | park_id FK, name, path_geojson (LineString) |
| `patrol` | route_id FK, ranger_id FK, scheduled_date, status (`PLANNED/ACTIVE/COMPLETED/CANCELLED`), started_at, ended_at |
| `track_point` | patrol_id FK, lat, lng, accuracy_m, recorded_at, sector_id FK NULL, is_waypoint, note — UNIQUE(patrol_id, recorded_at) |
| `notification` | user_id FK, title, body, link, read_at |
| `dispatch` | source_type (`INCIDENT/ALERT/COMMUNITY_REPORT`), source_id, responder_id FK, assigned_by FK, status (`ASSIGNED/ACKNOWLEDGED/COMPLETED/DECLINED`), assigned_at, acknowledged_at, completed_at, outcome, note |

**UC2**

| Table | Columns |
|---|---|
| `incident_type` | park_id FK, name, default_severity, active |
| `incident` | park_id FK, type_id FK, reporter_id FK, patrol_id FK NULL, lat, lng, location_source (`GPS/MANUAL`), sector_id FK NULL, description, photo_path, severity, status (`NEW/ASSIGNED/RESOLVED/DISMISSED`), occurred_at (device time), resolution_note |

**UC3**

| Table | Columns |
|---|---|
| `animal` | park_id FK, name, species |
| `device` | park_id FK, type (`COLLAR/CAMERA`), code UNIQUE, animal_id FK NULL, lat, lng (camera), expected_interval_min, battery_pct, last_seen_at |
| `zone` | park_id FK, name, type (`FARMLAND/ROAD/VILLAGE_BUFFER/RESTRICTED`), polygon_geojson |
| `alert_rule` | park_id FK, zone_type, severity, cooldown_min, ack_sla_min — UNIQUE(park_id, zone_type) |
| `collar_fix` | device_id FK, lat, lng, battery_pct, recorded_at — UNIQUE(device_id, recorded_at) |
| `alert` | park_id FK, type (`ZONE_BREACH/MORTALITY/DEVICE_HEALTH/HUMAN_DETECTED`), severity, device_id FK NULL, zone_id FK NULL, camera_image_id FK NULL, lat, lng, status (`OPEN/ACKNOWLEDGED/RESOLVED`), escalation_level (0..2), sla_due_at, acknowledged_by FK, acknowledged_at, resolved_at, disposition |
| `camera_image` | device_id FK, file_path, captured_at, status (`PENDING/TAGGED/EMPTY/UNIDENTIFIABLE/RESTRICTED`), species, count, reviewed_by FK, reviewed_at — UNIQUE(device_id, captured_at) |
| `audit_log` | user_id FK, action, entity, entity_id, reason |

**UC4**

| Table | Columns |
|---|---|
| `boundary_segment` | park_id FK, name, code UNIQUE per park (SMS landmark), center_lat, center_lng |
| `community_report` | reference_code UNIQUE (`R-1042`), park_id FK, segment_id FK NULL, channel (`SMS/WEB`), reporter_phone, type (`SIGHTING/CROP_DAMAGE/OTHER`), animal_count, description, photo_path, lat, lng, raw_text, status (`NEW/NEEDS_LOCATION/DUPLICATE/VALIDATED/DISPATCHED/CLOSED/INVALID`), duplicate_of_id FK NULL, severity, invalid_reason, outcome, closed_at |

The enums live in `type/`:
- `Role`: RANGER, SUPERVISOR, MANAGER, CLO, LEL, ADMIN
- `Severity`: LOW, MEDIUM, HIGH, CRITICAL
- Disposition: CONFLICT_AVERTED, CONFLICT_OCCURRED, NO_ACTION, FALSE_ALARM

## 6. REST API

Every path starts with `/api/v1` and needs a JWT, except where a row says **public** or **api-key**. Roles are enforced with `@PreAuthorize`.

| Module | Endpoint | Who |
|---|---|---|
| Auth | `POST /auth/login` → `{token, user}` | public |
| Admin | `GET/POST/PUT /admin/parks`, `GET/POST/PUT /admin/users` | ADMIN |
| Park config | `GET/POST/PUT/DELETE /parks/{id}/sectors\|zones\|alert-rules\|incident-types\|segments\|devices\|animals` | MANAGER (writes), staff (reads) |
| UC1 | `GET/POST /routes`, `POST /patrols` (assign), `GET /patrols?status=&date=` | MANAGER, SUPERVISOR |
| UC1 | `GET /me/patrols` | RANGER |
| UC1 | `POST /patrols/{id}/start` `{at}`, `POST /patrols/{id}/end` `{at}` | RANGER, idempotent |
| UC1 | `POST /patrols/{id}/points` `[{lat, lng, accuracyM, recordedAt, isWaypoint, note}]` | RANGER, batch upsert |
| UC1 | `GET /patrols/{id}/track`, `GET /monitor/live`, `GET /monitor/coverage` | SUPERVISOR, MANAGER |
| UC2 | `POST /incidents` (multipart: `data` JSON + `photo`), `GET /incidents?status=&type=&severity=`, `GET /incidents/{id}`, `PATCH /incidents/{id}` (severity), `POST /incidents/{id}/dismiss` | RANGER creates, SUPERVISOR/MANAGER triage |
| Shared | `POST /dispatches` `{sourceType, sourceId, responderId}`, `GET /me/dispatches`, `POST /dispatches/{id}/acknowledge\|complete\|decline` | — |
| Shared | `GET /responders?lat=&lng=`, which returns on-duty rangers sorted by distance | — |
| Shared | `GET /me/notifications`, `POST /notifications/{id}/read` | any |
| UC3 | `GET /alerts?status=`, `POST /alerts/{id}/acknowledge`, `POST /alerts/{id}/resolve` `{disposition}` | staff |
| UC3 | `GET /camera-images?status=`, `POST /camera-images/{id}/tag`, `GET /camera-images/{id}/file?reason=` (audited if restricted) | MANAGER, LEL (restricted) |
| UC3 sim | `POST /ingest/collar-fixes`, `POST /ingest/camera-images` (multipart) | **api-key** |
| UC4 | `POST /public/reports` (multipart), `GET /public/reports/{ref}`, `GET /public/parks/{id}/segments` | **public** |
| UC4 sim | `POST /ingest/sms` `{from, body}` → `{reply}` | **api-key** |
| UC4 | `GET /community-reports?status=`, `POST /community-reports/{id}/validate` `{severity}`, `POST /community-reports/{id}/invalidate` `{reason}`, `GET /community/hotspots` | CLO, MANAGER |
| Reports | `GET /reports/coverage\|incidents\|alerts\|conflicts?from=&to=` (`&format=csv`) | MANAGER, SUPERVISOR |
| Files | `GET /files/{path}` for incident and report photos | staff |

**Dispatch side-effects:** completing a dispatch updates its source.
- Incident → `RESOLVED`
- Alert → `RESOLVED` with a disposition
- Community report → `CLOSED`, followed by a villager SMS or status update

`DispatchService` delegates each update through a `switch` on `source_type`.

## 7. Key flows

### 7.1 Collar fix → alert (SEN-04 to SEN-09)
- Store the fix (duplicates ignored) and update the device's last seen and battery.
- If the fix is inside a zone, create an alert from the zone's rule unless one was raised within the cool-down. Night-time raises severity one level.
- A scheduled job escalates unacknowledged alerts after each SLA period: Supervisor, then Manager.
- A second scheduled job raises device-health and mortality alerts, never duplicating an open one.

### 7.2 Inbound SMS (COM-03 to COM-05)
- Format `TYPE LANDMARK [COUNT]`, case-insensitive. Unparseable → help reply.
- Unknown landmark → `NEEDS_LOCATION`. Then duplicate check, save, notify CLOs, reply with the reference code.

| Type | English | Sinhala (translit.) | Tamil (translit.) |
|---|---|---|---|
| SIGHTING | `ELE` | `ALI` | `YANAI` |
| CROP_DAMAGE | `CROP` | `GOVI` | `PAYIR` |
| OTHER | `HELP` | `UDAW` | `UTHAVI` |

Help reply: `WildX: send TYPE LANDMARK COUNT e.g. ELE KUMB 3. Types: ELE/ALI/YANAI, CROP/GOVI/PAYIR.`

### 7.3 Coverage and hotspots
Computed on read, never stored. A sector is neglected when its last track point is missing or older than `neglect_days`. A segment is a hotspot when it has at least `hotspot_threshold` validated reports in the last 30 days.

## 8. Frontend structure

```
frontend/
├─ app/
│  ├─ login/page.tsx
│  ├─ ranger/                 # phone-first; role RANGER
│  │  ├─ layout.tsx           # bottom nav (Patrols, Report, Tasks, Alerts)
│  │  ├─ page.tsx             # my patrols today
│  │  ├─ patrol/[id]/page.tsx # map, Start/End, Waypoint, Report incident
│  │  ├─ incident/new/page.tsx
│  │  ├─ tasks/page.tsx       # my dispatches + my incidents
│  │  └─ alerts/page.tsx      # notifications, acknowledge
│  ├─ dashboard/              # desktop-first, responsive; staff roles
│  │  ├─ layout.tsx           # side nav (collapses to top menu on phone), notification bell
│  │  ├─ page.tsx             # live map: patrols + open alerts + new incidents + hotspots
│  │  ├─ patrols/  routes/  coverage/          # UC1
│  │  ├─ incidents/                            # UC2
│  │  ├─ alerts/  images/  devices/            # UC3
│  │  ├─ community/                            # UC4
│  │  ├─ reports/                              # all four reports, tabs
│  │  └─ settings/            # sectors, zones, alert rules, incident types, segments (GeoJSON paste)
│  ├─ admin/                  # parks, users
│  └─ report/                 # PUBLIC villager form; [ref]/page.tsx = status
├─ components/                # Map (Leaflet), StatusBadge, SeverityBadge, BigButton, PickList, DispatchDialog
├─ lib/
│  ├─ api.ts                  # fetch wrapper: base URL, JWT header, JSON errors
│  ├─ auth.ts                 # token + user in localStorage, useUser(), role guard
│  ├─ geo.ts                  # watchPosition wrapper (60 s / 50 m)
│  └─ i18n.ts                 # { en, si, ta } dictionaries + useT()
```

- **Role guard:** each top-level layout redirects the user to `/login` if their role does not match. The backend is the real enforcement.
- **Data fetching** uses plain `fetch` in client components with `setInterval` polling. There is no state library and no React Query.
- **Status and severity** are always shown as **text plus a colour**, never colour alone.
- **Mobile UI:** use `min-h-12` (48 px) for tap targets and the `text-base`/`text-lg` text sizes. The primary action is a full-width button pinned to the bottom of the screen.

## 9. Configuration and local setup

Secrets go in `backend/.env` (git-ignored; `backend/.env.example` lists the keys: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`). Spring loads it through `spring.config.import`. Frontend `.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1`.

To run the system, start PostgreSQL (`docker-compose.yml` in the repo root, `postgres:17-alpine`), the backend and the frontend:

```bash
docker compose up -d
```

```bash
cd backend && ./mvnw spring-boot:run
```

```bash
cd frontend && npm run dev
```

**Seed data:** `config/DataSeeder` runs only when the DB is empty. It creates:
- park **Yala**, with 4 sectors, 2 routes and 2 zones (Kumbukgaha farmland, and a road);
- alert rules, 5 incident types and 3 boundary segments (`KUMB`, `PAL`, `KAT`);
- 1 collar on elephant "Gemunu" and 1 camera;
- one user per role (`ranger@wildx.lk`, `supervisor@wildx.lk`, `manager@wildx.lk`, `clo@wildx.lk`, `lel@wildx.lk`, `admin@wildx.lk`), with the test password `password`.

Simulation scripts live in `docs/sim/*.http` (IntelliJ/VS Code REST client) and send a fix inside the farmland zone, a camera image and an SMS.

## 10. Testing

- Backend: unit tests with ≥80% coverage on new code; focus on `GeoUtil`, `SmsParser`, alert rules, escalation and the duplicate check.
- Frontend: manually run each flow in requirements.md at 360 px.

## 11. Conventions

- **Git:**
  - Branch names: `uc1/…`, `uc2/…`, `uc3/…`, `uc4/…`, `common/…`.
  - Commits use conventional commits and mention requirement IDs, e.g. `feat(uc2): incident triage queue [INC-08]`.
  - PRs go into `main` and need one teammate's review.
- **API naming:**
  - JSON uses camelCase.
  - Timestamps are ISO-8601 UTC.
  - IDs are numbers (`Long`).
- **Changes to this document:** any change to a shared table, enum or endpoint must update this document in the same PR.
