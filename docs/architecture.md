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
| `patrol` | route_id FK, ranger_id FK, scheduled_date, status (`PLANNED/ACTIVE/COMPLETED/CANCELLED`), started_at, ended_at, gps_available, last_contact_at |
| `track_point` | patrol_id FK, lat, lng, accuracy_m, recorded_at, sector_id FK NULL, is_waypoint, note, waypoint_type — UNIQUE(patrol_id, recorded_at) |
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
| `escalation_step` | park_id FK, step_no, role — UNIQUE(park_id, step_no) |
| `collar_fix` | device_id FK, lat, lng, battery_pct, recorded_at — UNIQUE(device_id, recorded_at) |
| `alert` | park_id FK, type (`ZONE_BREACH/MORTALITY/DEVICE_HEALTH/HUMAN_DETECTED`), severity, device_id FK NULL, zone_id FK NULL, camera_image_id FK NULL, lat, lng, status (`OPEN/ACKNOWLEDGED/RESOLVED`), occurred_at (breach time from the fix), escalation_level (default 0), ack_sla_min (copied from the rule, default 15), sla_due_at, acknowledged_by_id FK, acknowledged_at, resolved_at, disposition |
| `camera_image` | device_id FK, file_path, captured_at, status (`PENDING/TAGGED/EMPTY/UNIDENTIFIABLE/RESTRICTED`), species, animal_count, reviewed_by_id FK, reviewed_at — UNIQUE(device_id, captured_at) |
| `audit_log` | user_id FK, action (text, e.g. `VIEW_RESTRICTED_IMAGE`), entity, entity_id, reason (time = `created_at`) |

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

### Patrol backend contract

Patrol APIs use the existing JWT roles and scope every read/write to the caller's current park. Requests are checked against the active database user so deactivated users or outdated role/park claims cannot continue using patrol APIs.

Route paths are GeoJSON LineStrings. Sector polygons support holes; exterior boundaries are included and hole boundaries excluded. Overlapping sectors resolve to the lowest sector ID. Geometry input is validated before persistence.

The backend accepts validated timestamped tracking batches and samples automatic points when 60 seconds or 50 metres have passed since the previous accepted point. First points are always recorded; new out-of-order points are rejected. Device scheduling, GPS acquisition, banners and map rendering remain frontend responsibilities. Manual waypoints are flagged track points; their optional pick-list value is a `WaypointType` enum (CHECKPOINT, OBSERVATION, REST or OTHER), stored as `waypoint_type`. Waypoints bypass automatic sampling. `POST /patrols/{id}/gps` accepts `{available}` and preserves patrol state while GPS is unavailable. Location uploads restore GPS availability.

Patrol transitions and point writes lock the patrol row. Repeated start/end requests return the saved state. Upload retries use the unique patrol/timestamp key; a matching automatic point can be upgraded to a waypoint without replacing its coordinates. Device timestamps are truncated to PostgreSQL microsecond precision before validation and persistence. Timestamps must be ordered within patrol bounds, and future timestamps are rejected. Batch retries may repeat sampled-out automatic points following a matching saved anchor; they never insert historical points.

Today and date-range boundaries use Asia/Colombo. Coverage includes never-visited sectors, derives neglect from the park setting and orders neglected sectors first. GET `/patrols/history` returns completed patrols with distance in metres and duration in seconds, newest scheduled date first; GET `/patrols/{id}/track` provides replay points in timestamp order. Live responses expose the last recorded location/time and consider it offline after five minutes without an accepted patrol request. GPS-status requests can serve as heartbeats during GPS loss.

Sector configuration is exposed at `/parks/{id}/sectors`; updates do not retroactively remap historical points. Sector deletion is rejected when track points reference it. `PUT /parks/{id}/coverage-settings` accepts `{neglectDays}` for a manager's own park. GET `/reports/coverage?from=YYYY-MM-DD&to=YYYY-MM-DD` uses inclusive park-local dates and returns every sector with its recorded point count, distinct patrol count and latest visit within the range. Missing or reversed dates are rejected. `format=csv` downloads UTF-8 CSV with escaped fields and spreadsheet-formula protection; the default is JSON.

### Device registry contract (SEN-01)

Collars and camera traps are simulated, so registering them only creates records. Animals are registered first at `/parks/{id}/animals`; a `COLLAR` then references an `animalId` from the same park, and a `CAMERA` requires `lat`/`lng`. Fields that do not belong to the device type are ignored. `code` is unique across all parks, `expectedIntervalMin` is 1–10080, and a device's type cannot change after registration. There is no delete, because later fixes, alerts and images reference devices. A Manager can write only to their own park, and an Admin can write to any park.

### Alert rule contract (SEN-03)

A park has at most one alert rule per zone type, so rules are addressed by zone type: `PUT /parks/{id}/alert-rules/{zoneType}` creates or replaces the rule and `DELETE` removes it. `cooldownMin` is 0–1440 (0 means no cool-down) and `ackSlaMin` is 1–1440. A zone type without a rule raises no zone-breach alert.

### Collar ingest and simulator contract (SEN-04)

`POST /ingest/collar-fixes` takes `{collarCode, lat, lng, recordedAt, batteryPct}` with an `X-Api-Key` header that must equal `wildx.ingest-api-key` (`INGEST_API_KEY`); a missing or wrong key, or no configured key, returns 401. A new fix returns 201 and updates the collar's `last_seen_at` and `battery_pct` when it is the newest fix. A repeated collar and timestamp returns 200 with `stored: false` and changes nothing. Missing fields, coordinates out of range, battery outside 0–100 or a future timestamp return 400; an unknown or non-collar code returns 404.

The simulator replaces real collars in the demo. `POST /parks/{id}/simulator/collar-fixes` takes `{collarCode, scenario, lat, lng, zoneId}` and sends every generated fix through the same ingest logic, returning `{sent, stored, duplicates}`. Scenarios: `SINGLE_FIX`, `LOW_BATTERY` (battery 10), `DUPLICATE` (the same fix twice) and `NOT_MOVING` (seven hourly fixes over the last 6 h within about 30 m) use `lat`/`lng`; `WALK_INTO_ZONE` (six fixes over 25 min ending at the zone's vertex average) and `NIGHT_WALK_INTO_ZONE` (the same walk moved into 18:00–06:00 Asia/Colombo) use `zoneId`. The collar and zone must belong to the park.

### Zone breach alerts (SEN-05, SEN-06)

Every stored collar fix (not a duplicate) is checked against all zones of the collar's park. Each zone that contains the fix and whose type has an alert rule is handled separately, so overlapping zones can raise one alert each. The alert copies the rule's severity, stores the fix position and the fix time as `occurred_at`, starts `OPEN`, and gets `sla_due_at` = now + the rule's `ackSlaMin`. No alert is raised when the same animal already has an alert for the same zone whose `occurred_at` is less than `cooldownMin` before or after the fix time; a cool-down of 0 never suppresses. When the fix time in Asia/Colombo is between 18:00 and 06:00 the severity goes up one level, and `CRITICAL` stays `CRITICAL`.

`GET /alerts?status=` returns the caller's park alerts, newest `occurred_at` first, optionally filtered by status, with the collar code, animal name and zone name.

### Notifications (CMN-07, SEN-07)

`NotificationService` (owned by UC3) is the shared way to notify users: `notifyUsers(userIds, title, body, link)` stores one `notification` row per user. `GET /me/notifications` returns `{unreadCount, notifications}` with the caller's latest 50 notifications, newest first; `unreadCount` counts every unread one and drives the badge. `POST /notifications/{id}/read` marks the caller's own notification read and keeps the first `read_at` on repeats; another user's notification returns 404. Both endpoints are for every role except Admin.

For SEN-07, an on-duty ranger is a ranger with an `ACTIVE` patrol in the park, taken from `PatrolMonitorService.live`; the `app_user.on_duty` column is not used. Each raised alert sends every such ranger one notification, e.g. title "New HIGH zone breach alert", body "Gemunu (COL-001) entered Kumbukgaha farmland at 22:05" (Asia/Colombo time) and link `/ranger/alerts`. The SMS fallback (CMN-08) is added once UC4's `SmsService` exists.

### Alert acknowledge and resolve (SEN-08, SEN-10)

Rangers, supervisors and managers can act on alerts of their own park; an alert from another park returns 404. `POST /alerts/{id}/acknowledge` moves an `OPEN` alert to `ACKNOWLEDGED` and records `acknowledged_by_id` and `acknowledged_at`; repeating it on an `ACKNOWLEDGED` alert keeps the first values. `POST /alerts/{id}/resolve` with `{disposition}` (`CONFLICT_AVERTED`, `CONFLICT_OCCURRED`, `NO_ACTION`, `FALSE_ALARM`) moves an `OPEN` or `ACKNOWLEDGED` alert to `RESOLVED` and records `resolved_at` and the disposition; resolving an `OPEN` alert also records the resolver and time as the acknowledgement. Acting on a `RESOLVED` alert returns 400. Both return the alert, and alert responses include `acknowledgedByName`, `acknowledgedAt`, `resolvedAt` and `disposition`. Dispatching a responder (CMN-06) arrives with UC2's `DispatchService`, which resolves the alert through the same resolve logic when a dispatch completes.

### Alert escalation (SEN-09)

Each park lists its escalation steps in `escalation_step`, ordered by `step_no`; the seed gives Yala 1 = `SUPERVISOR` and 2 = `MANAGER`, and a park without steps never escalates. `AlertEscalationJob` runs every 60 s and escalates each `OPEN` alert whose `sla_due_at` has passed. Each alert is escalated in its own transaction under the alert row lock and is skipped when it is no longer `OPEN`, so an acknowledge or resolve always wins. Escalating notifies every active user of the park with the role of step `escalation_level + 1` (e.g. title "Escalated HIGH zone breach alert", body "Gemunu (COL-001) in Kumbukgaha farmland is not acknowledged since 22:05", link `/dashboard/alerts`), then adds 1 to `escalation_level` and moves `sla_due_at` on by `ack_sla_min`. After the last step the alert is not escalated again. Alert responses include `escalationLevel`. Users are listed through `AuthService.activeUserIds(parkId, role)`. Alerts without a zone are described by animal and collar code, or by device code, e.g. "Gemunu (COL-001) is not acknowledged since 22:05".

### Device health and mortality alerts (SEN-11, SEN-12)

`DeviceHealthJob` runs every 60 s and checks each device that has reported at least once (`last_seen_at` set) in its own transaction; a failing device does not stop the others. A `DEVICE_HEALTH` alert (`MEDIUM`, ack SLA 60 min) is raised when `last_seen_at` is older than 3 × `expected_interval_min` or `battery_pct` is below 15. A `MORTALITY` alert (`CRITICAL`, ack SLA 15 min) is raised for a collar when it has a fix at least 6 h before its latest fix and every fix from that one to the latest is within 50 m of the latest fix. A device never gets a second alert of the same type while an earlier one is `OPEN` or `ACKNOWLEDGED`. These alerts have no zone, use the collar's latest fix (or the camera's location) as position and the detection time as `occurred_at`, escalate like zone breaches, and notify on-duty rangers, e.g. "COL-001 battery is at 10%", "COL-001 has not reported since 21:00" or "Gemunu (COL-001) has moved less than 50 m in 6 h".

### Camera traps (SEN-13, SEN-14, SEN-15)

`POST /ingest/camera-images` is multipart with `cameraCode`, `capturedAt` and `image`, protected by the same `X-Api-Key` as collar ingest through the shared `ApiKeyGuard`. Only JPEG and PNG are accepted, checked by the file's first bytes, up to 5 MB (`spring.servlet.multipart.max-file-size`; larger returns 413). The file is stored under `wildx.upload-dir` (`UPLOAD_DIR`, default `./uploads`) with a generated name, and `file_path` holds the path relative to that folder; stored paths can never point outside it. A new image returns 201, starts `PENDING` and updates the camera's `last_seen_at`; the same camera and `capturedAt` returns 200 with `stored: false`; a future `capturedAt` returns 400 and an unknown or non-camera code returns 404.

`GET /parks/{id}/camera-images?status=` returns the park's images newest first, grouped into bursts: images of the same camera where each is at most 1 minute after the previous one. Managers and Admins see every status; an LEL only ever sees `RESTRICTED` images. `POST /parks/{id}/camera-images/{imageId}/tag` (Manager only) takes `{status, species, animalCount}` with status `TAGGED` (species and animalCount ≥ 1 required), `EMPTY`, `UNIDENTIFIABLE` or `RESTRICTED`, and records `reviewed_by_id` and `reviewed_at`; re-tagging is allowed. Changing an image to `RESTRICTED` raises one `HUMAN_DETECTED` alert (`CRITICAL`, ack SLA 15 min) at the camera's location with the capture time as `occurred_at`, linked through `camera_image_id`, which escalates like other alerts and notifies on-duty rangers with e.g. "Suspected poacher on CAM-001 at 22:05" and never the image.

`GET /parks/{id}/camera-images/{imageId}/file?reason=` returns the image to Managers and Admins, and to an LEL only when it is `RESTRICTED` (otherwise 404). Viewing a `RESTRICTED` image requires a non-blank `reason` (otherwise 400), writes an `audit_log` row (user, action `VIEW_RESTRICTED_IMAGE`, entity `camera_image`, id, reason) and is sent with `Cache-Control: no-store`. No other role can open camera images, so restricted images never reach unauthorised users (NFR-06). Alert responses include `cameraImageId`.

For demos, `POST /parks/{id}/simulator/camera-images` with `{cameraCode, count}` (1–10, Manager or Admin) generates placeholder JPEGs 20 s apart, ending now, and sends them through the same upload logic.

Every path starts with `/api/v1` and needs a JWT, except where a row says **public** or **api-key**. Roles are enforced with `@PreAuthorize`.

| Module | Endpoint | Who |
|---|---|---|
| Auth | `POST /auth/login` → `{token, user}` | public |
| Admin | `GET/POST/PUT /admin/parks`, `GET/POST/PUT /admin/users` | ADMIN |
| Park config | `GET/POST/PUT/DELETE /parks/{id}/sectors\|zones\|incident-types\|segments` | MANAGER (writes), staff (reads) |
| UC3 | `GET/POST/PUT /parks/{id}/animals` `{name, species}`, `GET/POST/PUT /parks/{id}/devices` `{type, code, expectedIntervalMin, animalId, lat, lng}` | ADMIN, MANAGER (writes), staff (reads) |
| UC3 | `GET /parks/{id}/alert-rules`, `PUT/DELETE /parks/{id}/alert-rules/{zoneType}` `{severity, cooldownMin, ackSlaMin}` | MANAGER (writes), staff (reads) |
| UC1 | `GET/POST /routes`, `POST /patrols` (assign), `GET /patrols?status=&date=` | MANAGER, SUPERVISOR |
| UC1 | `GET /me/patrols` | RANGER |
| UC1 | `POST /patrols/{id}/start` `{at}`, `POST /patrols/{id}/end` `{at}` | RANGER, idempotent |
| UC1 | `POST /patrols/{id}/points` `[{lat, lng, accuracyM, recordedAt, isWaypoint, note}]` | RANGER, batch upsert |
| UC1 | `GET /patrols/{id}/track`, `GET /monitor/live`, `GET /monitor/coverage` | SUPERVISOR, MANAGER |
| UC2 | `POST /incidents` (multipart: `data` JSON + `photo`), `GET /incidents?status=&type=&severity=`, `GET /incidents/{id}`, `PATCH /incidents/{id}` (severity), `POST /incidents/{id}/dismiss` | RANGER creates, SUPERVISOR/MANAGER triage |
| Shared | `POST /dispatches` `{sourceType, sourceId, responderId}`, `GET /me/dispatches`, `POST /dispatches/{id}/acknowledge\|complete\|decline` | — |
| Shared | `GET /responders?lat=&lng=`, which returns on-duty rangers sorted by distance | — |
| Shared | `GET /me/notifications` → `{unreadCount, notifications}`, `POST /notifications/{id}/read` | any except ADMIN |
| UC3 | `GET /alerts?status=` | staff |
| UC3 | `POST /alerts/{id}/acknowledge`, `POST /alerts/{id}/resolve` `{disposition}` | RANGER, SUPERVISOR, MANAGER |
| UC3 | `GET /parks/{id}/camera-images?status=`, `GET /parks/{id}/camera-images/{imageId}/file?reason=` (audited if restricted) | MANAGER, ADMIN, LEL (restricted only) |
| UC3 | `POST /parks/{id}/camera-images/{imageId}/tag` `{status, species, animalCount}` | MANAGER |
| UC3 sim | `POST /ingest/collar-fixes` `{collarCode, lat, lng, recordedAt, batteryPct}`, `POST /ingest/camera-images` (multipart `cameraCode`, `capturedAt`, `image`) | **api-key** |
| UC3 sim | `POST /parks/{id}/simulator/collar-fixes` `{collarCode, scenario, lat, lng, zoneId}`, `POST /parks/{id}/simulator/camera-images` `{cameraCode, count}` | ADMIN, MANAGER |
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
- If the fix is inside a zone, create an alert from the rule for that zone's type unless one was raised for the same animal and zone within the cool-down of the fix time. A zone type without a rule raises no alert. A fix time at night raises severity one level.
- A scheduled job escalates unacknowledged alerts after each SLA period through the park's escalation steps (Supervisor, then Manager for Yala).
- A second scheduled job (`DeviceHealthJob`) raises device-health and mortality alerts, never while an earlier alert of the same type for the device is still open or acknowledged.

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

Secrets go in `backend/.env` (git-ignored; `backend/.env.example` lists the keys: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `INGEST_API_KEY`, `UPLOAD_DIR`). Spring loads it through `spring.config.import`. Frontend `.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1`.

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
