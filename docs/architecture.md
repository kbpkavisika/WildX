# WildX – Architecture

Technical design for [requirements.md](requirements.md). Requirement IDs (`PAT-05`, `CMN-04` …) are referenced throughout.
Guiding rule: **simplest thing that satisfies the requirement.** This is a prototype. Do not add layers, services or libraries that this document does not list without agreeing it with the team first.

---

## 1. Overview

```
 Phone browser (ranger / villager)          Desktop browser (manager / CLO / researcher)
            │                                           │
            └──────────────┬────────────────────────────┘
                           │ HTTPS JSON (JWT)
                 ┌─────────▼──────────┐   ┌──────────────────────┐   Simulators (curl / script)
                 │  Next.js frontend  │   │ Expo ranger app      │   collar fixes, camera images,
                 └─────────┬──────────┘   │ SQLite outbox        │   inbound SMS  ── X-Api-Key ──┐
                           │              └──────────┬───────────┘                               │
                           │ REST /api/**            │ REST /api/** (JWT)                        │
                 ┌─────────▼─────────────────────────▼────────────────────────────────────────▼┐
                 │  Spring Boot monolith  (controllers → services → JPA)   │
                 │  @Scheduled jobs: escalation, device health             │
                 └─────────┬───────────────────────────┬───────────────────┘
                           │                           │
                     PostgreSQL                  ./uploads (photos/images)
```

- The system is **one backend, one web frontend and one ranger mobile app** (`mobile/`). There are no microservices, no message broker and no WebSockets.
- **Real-time behaviour uses polling.** The dashboard polls every 15 s and notifications are polled every 30 s, which meets NFR-04.
- The **external systems are simulated** through REST endpoints protected by a static API key (§7).

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | Spring Boot 4.1, Java 25, Maven | Already scaffolded in `backend/` |
| Persistence | Spring Data JPA + PostgreSQL | `ddl-auto=create` resets the application's tables on every backend startup, followed by demo seeding. No migrations tool. Custom queries use the Criteria API only (no raw SQL/JPQL) |
| Validation | `spring-boot-starter-validation`, `zod` (frontend) | `@Valid` on request DTOs. The frontend parses every API response with a zod schema |
| Auth | `spring-boot-starter-security` + `spring-boot-starter-security-oauth2-resource-server` | Stateless HS256 JWT access token issued by our own `/api/v1/auth/login`, valid 12 h. Claims: `sub` (user id), `role`. The current park is read from `app_user.park_id` on every request, so switching park needs no new token. No refresh tokens, cookies or sessions, and no external IdP |
| Boilerplate | Lombok | `@Getter @Setter` on entities, and Java `record` for DTOs |
| Frontend | Next.js 16 (App Router), React 19, TypeScript | ⚠ Read `frontend/AGENTS.md`, because Next 16 APIs differ from older versions |
| Styling | Tailwind CSS 4 | Mobile-first: write the base styles for phones and add `lg:` styles for the desktop dashboard |
| Maps | `leaflet` + `react-leaflet`, OpenStreetMap tiles | Load map components with `dynamic(..., { ssr:false })` |
| Geometry | Hand-written `GeoUtil` (point-in-polygon, haversine) | **No PostGIS.** Polygons are stored as GeoJSON text |
| Mobile | Expo SDK 57 (React Native, TypeScript), `expo-router` | Ranger role only, in `mobile/`. Same React Query, Zustand, zod and react-hook-form as the web |
| Mobile storage | `expo-sqlite` (outbox table and `kv-store` for the query cache), `expo-secure-store` (JWT) | Offline outbox (CMN-04) |
| Mobile device | `expo-location` + `expo-task-manager` (background GPS), `expo-image-picker` (camera), `expo-network`, `expo-file-system`, `expo-crypto` | Background tracking needs a development build |
| Mobile maps and look | `react-native-maps` with an OpenStreetMap `UrlTile`, `@expo-google-fonts/geist`, `lucide-react-native` | Styled with `StyleSheet` from DESIGN.md tokens in `mobile/src/lib/theme.ts` |

The project adds **no other dependencies** without team agreement. Phone camera and GPS use native browser features: `<input type="file" accept="image/*" capture="environment">` and `navigator.geolocation.watchPosition`.

## 3. Key technical decisions

| # | Decision | Why / trade-off |
|---|---|---|
| D1 | A responsive web app serves every role, and rangers also get an Expo mobile app | The web stays online only. The mobile app adds offline work and locked-screen GPS for rangers. Pure mapping code is ported from `frontend/lib` rather than shared, because the two apps build separately |
| D2 | Geometry is stored as GeoJSON in `TEXT` columns and checked in Java | No PostGIS install is needed. The data volumes are prototype-sized |
| D3 | Polling replaces WebSockets/SSE | It is simpler and works through any proxy. 15–30 s of latency is acceptable |
| D4 | **Dispatch** is one table with a polymorphic `(source_type, source_id)` | UC2, UC3 and UC4 all reuse one "Dispatch Responder" (CMN-06) |
| D5 | Incident types, alert rules, zones, sectors and segments are per-park data | A new park or hazard type needs no code change (fixes W4) |
| D6 | A validated community report **is** the conflict case, with no separate table | Its lifecycle is linear, so a second table would add nothing |
| D7 | Waypoints are track points with `is_waypoint=true` | There is one location model, with no duplicated GPS fields (fixes W12) |
| D8 | Files are stored on local disk (`wildx.upload-dir`), and the DB holds only the path | No object store is needed for the prototype |
| D9 | The JWT is kept in `localStorage` | This is acceptable for the prototype, and the trade-off against XSS exposure is noted |
| D10 | The SMS gateway is simulated: outbound SMS is only logged | Swapping in a real provider later only touches `SmsService` |
| D11 | Mobile writes go through a SQLite outbox and are replayed in order | Nothing typed in the field is lost. Every replayed endpoint is idempotent, so a resend after a lost response stores nothing twice (§6 Offline replay) |

## 4. Backend structure

The backend keeps the existing layer packages under `com.wildx.wildx` and adds `controller` and `dto`. **Prefix each class name with its module** so the four devs rarely edit the same file.

```
com.wildx.wildx
├─ config/      SecurityConfig (JWT, CORS), DataSeeder
├─ constant/    Roles, AppConstants (night hours, thresholds)
├─ controller/  AuthController, UserController, Park*Controller,
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
- Every list is scoped to the caller's current park (`app_user.park_id`), loaded through `AuthService.current`.

## 5. Database design (PostgreSQL)

All tables have `id BIGSERIAL PK` and the audit columns `created_at`, `modified_at` (`TIMESTAMPTZ`), `created_by`, `modified_by` (user id from the JWT, `NULL` for unauthenticated or system writes). Entities get them by extending `model/Auditable` (Spring Data JPA auditing). Location columns are always `lat DOUBLE, lng DOUBLE`. Geometry columns hold GeoJSON `TEXT`. Enums are stored as `VARCHAR` (`@Enumerated(STRING)`).

`dispatch` links to `incident`, `alert` or `community_report` through `(source_type, source_id)`, with no foreign key (D4).

**Shared / UC1**

| Table | Columns |
|---|---|
| `park` | name, code UNIQUE, boundary_geojson, neglect_days (7), duplicate_window_min (120), hotspot_threshold (5) |
| `sector` | park_id FK, name, polygon_geojson |
| `app_user` | park_id FK (current park), name, email UNIQUE, phone, password_hash, role, language (`en`/`si`/`ta`), active, on_duty, last_lat, last_lng, last_seen_at |
| `user_park` | user_id FK, park_id FK — PK(user_id, park_id): the extra parks a Manager manages (CMN-12) |
| `patrol_route` | park_id FK, name, path_geojson (LineString), archived |
| `patrol` | route_id FK, ranger_id FK, scheduled_date, status (`PLANNED/ACTIVE/COMPLETED/CANCELLED`), started_at, ended_at, gps_available, last_contact_at |
| `track_point` | patrol_id FK, lat, lng, accuracy_m, recorded_at, sector_id FK NULL, is_waypoint, note, waypoint_type — UNIQUE(patrol_id, recorded_at) |
| `notification` | user_id FK, title, body, link, read_at |
| `dispatch` | source_type (`INCIDENT/ALERT/COMMUNITY_REPORT`), source_id, responder_id FK, assigned_by FK, status (`ASSIGNED/ACKNOWLEDGED/COMPLETED/DECLINED`), assigned_at, acknowledged_at, completed_at, outcome, note |

**UC2**

| Table | Columns |
|---|---|
| `incident_type` | park_id FK, name, default_severity, active |
| `incident` | client_id VARCHAR(36) UNIQUE NULL (UUID from the mobile outbox), park_id FK, type_id FK, reporter_id FK, patrol_id FK NULL, lat, lng, location_source (`GPS/MANUAL`), sector_id FK NULL, description, photo_path, severity, status (`NEW/ASSIGNED/RESOLVED/DISMISSED`), occurred_at (device time; up to 2 min ahead of the server is saved as server time, more is rejected), resolution_note |

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
- `Role`: RANGER, MANAGER, CLO, RESEARCHER (the Manager is the highest authority in a park; "staff" below means every role except RESEARCHER, who only reads reports)
- `Severity`: LOW, MEDIUM, HIGH, CRITICAL
- Disposition: CONFLICT_AVERTED, CONFLICT_OCCURRED, NO_ACTION, FALSE_ALARM

## 6. REST API

### Patrol backend contract

Patrol APIs use the existing JWT roles and scope every read/write to the caller's current park. Requests are checked against the active database user so deactivated users or outdated role/park claims cannot continue using patrol APIs.

Route paths are GeoJSON LineStrings. Sector polygons support holes; exterior boundaries are included and hole boundaries excluded. Overlapping sectors resolve to the lowest sector ID. Geometry input is validated before persistence.

The backend accepts validated timestamped tracking batches and samples automatic points when 60 seconds or 50 metres have passed since the previous accepted point. First points are always recorded; new out-of-order points are rejected. Device scheduling, GPS acquisition, banners and map rendering remain frontend responsibilities. Manual waypoints are flagged track points whose `lat`/`lng` is the ranger's GPS position or a point the ranger tapped on the map (then `accuracyM` is null); their optional pick-list value is a `WaypointType` enum (CHECKPOINT, OBSERVATION, REST or OTHER), stored as `waypoint_type`. Waypoints bypass automatic sampling. `POST /patrols/{id}/gps` accepts `{available}` and preserves patrol state while GPS is unavailable. Location uploads restore GPS availability.

Patrol transitions and point writes lock the patrol row. Repeated start/end requests return the saved state. Upload retries use the unique patrol/timestamp key; a matching automatic point can be upgraded to a waypoint without replacing its coordinates. Device timestamps are truncated to PostgreSQL microsecond precision before validation and persistence. Timestamps must be ordered within patrol bounds, and future timestamps are rejected. Batch retries may repeat sampled-out automatic points following a matching saved anchor; they never insert historical points.

Today and date-range boundaries use Asia/Colombo. Coverage includes never-visited sectors, derives neglect from the park setting and orders neglected sectors first. GET `/patrols/history` returns completed patrols with distance in metres and duration in seconds, newest scheduled date first; GET `/patrols/{id}/track` provides replay points in timestamp order. Live responses expose the last recorded location/time and consider it offline after five minutes without an accepted patrol request. GPS-status requests can serve as heartbeats during GPS loss.

GET `/rangers` (Manager) lists the active rangers of the caller's park for the assign pick-list. Sector configuration is exposed at `/parks/{id}/sectors`; updates do not retroactively remap historical points. Sector deletion is rejected when track points reference it. `PUT /parks/{id}/coverage-settings` accepts `{neglectDays}` for a manager's own park. GET `/reports/coverage?from=YYYY-MM-DD&to=YYYY-MM-DD` uses inclusive park-local dates and returns every sector with its recorded point count, distinct patrol count and latest visit within the range. Missing or reversed dates are rejected. `format=csv` downloads UTF-8 CSV with escaped fields and spreadsheet-formula protection; the default is JSON.

### Device registry contract (SEN-01)

Collars and camera traps are simulated, so registering them only creates records. Animals are registered first at `/parks/{id}/animals`; a `COLLAR` then references an `animalId` from the same park, and a `CAMERA` requires `lat`/`lng`. Fields that do not belong to the device type are ignored. `code` is unique across all parks, `expectedIntervalMin` is 1–10080, and a device's type cannot change after registration. There is no delete, because later fixes, alerts and images reference devices. A Manager can write only to their own park.

### Alert rule contract (SEN-03)

A park has at most one alert rule per zone type, so rules are addressed by zone type: `PUT /parks/{id}/alert-rules/{zoneType}` creates or replaces the rule and `DELETE` removes it. `cooldownMin` is 0–1440 (0 means no cool-down) and `ackSlaMin` is 1–1440. A zone type without a rule raises no zone-breach alert.

### Collar ingest and simulator contract (SEN-04)

`POST /ingest/collar-fixes` takes `{collarCode, lat, lng, recordedAt, batteryPct}` with an `X-Api-Key` header that must equal `wildx.ingest-api-key` (`INGEST_API_KEY`); a missing or wrong key, or no configured key, returns 401. A new fix returns 201 and updates the collar's `last_seen_at` and `battery_pct` when it is the newest fix. A repeated collar and timestamp returns 200 with `stored: false` and changes nothing. Missing fields, coordinates out of range, battery outside 0–100 or a future timestamp return 400; an unknown or non-collar code returns 404.

The simulator replaces real collars in the demo. `POST /parks/{id}/simulator/collar-fixes` takes `{collarCode, scenario, lat, lng, zoneId}` and sends every generated fix through the same ingest logic, returning `{sent, stored, duplicates}`. Scenarios: `SINGLE_FIX`, `LOW_BATTERY` (battery 10), `DUPLICATE` (the same fix twice) and `NOT_MOVING` (seven hourly fixes over the last 6 h within about 30 m) use `lat`/`lng`; `WALK_INTO_ZONE` (six fixes over 25 min ending at the zone's vertex average) and `NIGHT_WALK_INTO_ZONE` (the same walk moved into 18:00–06:00 Asia/Colombo) use `zoneId`. The collar and zone must belong to the park.

### Zone breach alerts (SEN-05, SEN-06)

Every stored collar fix (not a duplicate) is checked against all zones of the collar's park. Each zone that contains the fix and whose type has an alert rule is handled separately, so overlapping zones can raise one alert each. The alert copies the rule's severity, stores the fix position and the fix time as `occurred_at`, starts `OPEN`, and gets `sla_due_at` = now + the rule's `ackSlaMin`. No alert is raised when the same animal already has an alert for the same zone whose `occurred_at` is less than `cooldownMin` before or after the fix time; a cool-down of 0 never suppresses. When the fix time in Asia/Colombo is between 18:00 and 06:00 the severity goes up one level, and `CRITICAL` stays `CRITICAL`.

`GET /alerts?status=` returns the caller's park alerts, newest `occurred_at` first, optionally filtered by status, with the collar code, animal name and zone name.

### Offline replay (CMN-04, NFR-02)

The mobile outbox may send the same write twice when a response is lost, so every endpoint it uses is idempotent:
- `POST /patrols/{id}/start|end` take the tap time `{at}` and return the saved state on repeats.
- `POST /patrols/{id}/points` upserts on `(patrol_id, recorded_at)`.
- `POST /incidents` takes an optional `clientId` (UUID) in `data`. A repeated `clientId` from the same reporter returns the incident already stored, with no second photo and no second notification. A `clientId` used by another reporter returns 409.
- `POST /dispatches/{id}/acknowledge` on an `ACKNOWLEDGED` dispatch, `complete` on a `COMPLETED` one and `decline` on a `DECLINED` one return the saved dispatch unchanged. Any other move out of a closed state still returns 400.
- `POST /alerts/{id}/acknowledge|resolve` on a `RESOLVED` alert return it unchanged (§ Alert acknowledge and resolve).

### Notifications (CMN-07, SEN-07)

`NotificationService` (owned by UC3) is the shared way to notify users: `notifyUsers(userIds, title, body, link)` stores one `notification` row per user. `GET /me/notifications` returns `{unreadCount, notifications}` with the caller's latest 50 notifications, newest first; `unreadCount` counts every unread one and drives the badge. `POST /notifications/{id}/read` marks the caller's own notification read and keeps the first `read_at` on repeats; another user's notification returns 404. Both endpoints are for every role.

For SEN-07, an on-duty ranger is a ranger with an `ACTIVE` patrol in the park, taken from `PatrolMonitorService.live`; the `app_user.on_duty` column is not used. Each raised alert sends every such ranger one notification, e.g. title "New HIGH zone breach alert", body "Gemunu (COL-001) entered Kumbukgaha farmland at 22:05" (Asia/Colombo time) and link `/ranger/alerts`. For `HIGH` and `CRITICAL` alerts, `AlertNotifier` also sends the SMS fallback (CMN-08) through UC4's `SmsService` to each of those rangers who is offline (no patrol contact for more than 5 minutes) and has a phone number, with the text "WildX Alert [SEVERITY]: " followed by the notification body.

### Alert acknowledge and resolve (SEN-08, SEN-10)

Rangers and managers can act on alerts of their own park; an alert from another park returns 404. `POST /alerts/{id}/acknowledge` moves an `OPEN` alert to `ACKNOWLEDGED` and records `acknowledged_by_id` and `acknowledged_at`; repeating it on an `ACKNOWLEDGED` alert keeps the first values. `POST /alerts/{id}/resolve` with `{disposition}` (`CONFLICT_AVERTED`, `CONFLICT_OCCURRED`, `NO_ACTION`, `FALSE_ALARM`) moves an `OPEN` or `ACKNOWLEDGED` alert to `RESOLVED` and records `resolved_at` and the disposition; resolving an `OPEN` alert also records the resolver and time as the acknowledgement. Acknowledging or resolving a `RESOLVED` alert returns it unchanged, so an offline replay is safe. Both return the alert, and alert responses include `acknowledgedByName`, `acknowledgedAt`, `resolvedAt` and `disposition`. Dispatching a responder (CMN-06) arrives with UC2's `DispatchService`, which resolves the alert through the same resolve logic when a dispatch completes.

### Alert escalation (SEN-09)

Each park lists its escalation steps in `escalation_step`, ordered by `step_no`; the seed gives Yala 1 = `MANAGER`, and a park without steps never escalates. `AlertEscalationJob` runs every 60 s and escalates each `OPEN` alert whose `sla_due_at` has passed. Each alert is escalated in its own transaction under the alert row lock and is skipped when it is no longer `OPEN`, so an acknowledge or resolve always wins. Escalating notifies every active user of the park with the role of step `escalation_level + 1` (e.g. title "Escalated HIGH zone breach alert", body "Gemunu (COL-001) in Kumbukgaha farmland is not acknowledged since 22:05", link `/dashboard/alerts`), then adds 1 to `escalation_level` and moves `sla_due_at` on by `ack_sla_min`. After the last step the alert is not escalated again. Alert responses include `escalationLevel`. Users are listed through `AuthService.activeUserIds(parkId, role)`. Alerts without a zone are described by animal and collar code, or by device code, e.g. "Gemunu (COL-001) is not acknowledged since 22:05".

### Device health and mortality alerts (SEN-11, SEN-12)

`DeviceHealthJob` runs every 60 s and checks each device that has reported at least once (`last_seen_at` set) in its own transaction; a failing device does not stop the others. A `DEVICE_HEALTH` alert (`MEDIUM`, ack SLA 60 min) is raised when `last_seen_at` is older than 3 × `expected_interval_min` or `battery_pct` is below 15. A `MORTALITY` alert (`CRITICAL`, ack SLA 15 min) is raised for a collar when it has a fix at least 6 h before its latest fix and every fix from that one to the latest is within 50 m of the latest fix. A device never gets a second alert of the same type while an earlier one is `OPEN` or `ACKNOWLEDGED`. These alerts have no zone, use the collar's latest fix (or the camera's location) as position and the detection time as `occurred_at`, escalate like zone breaches, and notify on-duty rangers, e.g. "COL-001 battery is at 10%", "COL-001 has not reported since 21:00" or "Gemunu (COL-001) has moved less than 50 m in 6 h".

### Camera traps (SEN-13, SEN-14, SEN-15)

`POST /ingest/camera-images` is multipart with `cameraCode`, `capturedAt` and `image`, protected by the same `X-Api-Key` as collar ingest through the shared `ApiKeyGuard`. Only JPEG and PNG are accepted, checked by the file's first bytes, up to 5 MB (`spring.servlet.multipart.max-file-size`; larger returns 413). The file is stored under `wildx.upload-dir` (`UPLOAD_DIR`, default `./uploads`) with a generated name, and `file_path` holds the path relative to that folder; stored paths can never point outside it. A new image returns 201, starts `PENDING` and updates the camera's `last_seen_at`; the same camera and `capturedAt` returns 200 with `stored: false`; a future `capturedAt` returns 400 and an unknown or non-camera code returns 404.

`GET /parks/{id}/camera-images?status=` returns the park's images newest first, grouped into bursts: images of the same camera where each is at most 1 minute after the previous one. Managers see every status. `POST /parks/{id}/camera-images/{imageId}/tag` (Manager only) takes `{status, species, animalCount}` with status `TAGGED` (species and animalCount ≥ 1 required), `EMPTY`, `UNIDENTIFIABLE` or `RESTRICTED`, and records `reviewed_by_id` and `reviewed_at`; re-tagging is allowed. Changing an image to `RESTRICTED` raises one `HUMAN_DETECTED` alert (`CRITICAL`, ack SLA 15 min) at the camera's location with the capture time as `occurred_at`, linked through `camera_image_id`, which escalates like other alerts and notifies on-duty rangers with e.g. "Suspected poacher on CAM-001 at 22:05" and never the image.

`GET /parks/{id}/camera-images/{imageId}/file?reason=` returns the image to Managers. Viewing a `RESTRICTED` image requires a non-blank `reason` (otherwise 400), writes an `audit_log` row (user, action `VIEW_RESTRICTED_IMAGE`, entity `camera_image`, id, reason) and is sent with `Cache-Control: no-store`. No other role can open camera images, so restricted images never reach unauthorised users (NFR-06). Alert responses include `cameraImageId`.

For demos, `POST /parks/{id}/simulator/camera-images` with `{cameraCode, count}` (1–10, Manager) generates placeholder JPEGs 20 s apart, ending now, and sends them through the same upload logic.

### Alert report (SEN-16)

`GET /reports/alerts?from=YYYY-MM-DD&to=YYYY-MM-DD` covers the alerts of the caller's park raised (`created_at`) on those Asia/Colombo days, inclusive; missing or reversed dates and formats other than `json`/`csv` return 400. The JSON response is `{from, to, total, medianAcknowledgeMinutes, medianResolveMinutes, rows}` with one row per alert type and zone (`{type, zoneId, zoneName, count, medianAcknowledgeMinutes, medianResolveMinutes}`; alerts without a zone share one row per type with no zone), highest count first. Time to acknowledge is `acknowledged_at` minus the raise time and time to resolve is `resolved_at` minus the raise time; medians are in minutes with one decimal, use only alerts that have the value, and are `null` when none do. `format=csv` downloads `type,zone,count,median_acknowledge_minutes,median_resolve_minutes` with an `ALL` totals row first, using the same escaping and spreadsheet-formula protection as the coverage report.

### Parks (CMN-12)

A Manager manages every park in `user_park` plus their current park; every other role has only `app_user.park_id`. `GET /parks` returns the caller's parks by name as `{id, name, code, neglectDays}`. `POST /parks` `{name, code}` (Manager) creates a park with escalation step 1 = `MANAGER`, adds it to the caller's parks and makes it current; a duplicate code returns 409. `POST /parks/{id}/switch` (Manager) makes a park the caller manages current and returns the user, or 403. Manager notifications and escalation go to every active Manager of the park, current or not.

### User management (CMN-02)

There is no self sign-up: the Park Manager creates the accounts of their current park, and every new user joins that park (a new Manager also manages it). `POST /users` needs a password of 8–100 characters; on `PUT` a blank password keeps the current one. A duplicate email returns 409. A user in another park returns 404. `DELETE /users/{id}` does not remove the row, because patrols, dispatches and audit logs reference users: it sets `active = false`, so the user can no longer log in, and `PUT` with `active: true` restores them. A Manager cannot deactivate or demote themselves. The list returns the park's users, including Managers who manage it while another park is current, (active first, then by name) with `{id, name, email, phone, role, parkId, parkName, active}`. The former `ADMIN` role was removed; on startup any leftover `ADMIN` rows become deactivated Managers.

Every path starts with `/api/v1` and needs a JWT, except where a row says **public** or **api-key**. Roles are enforced with `@PreAuthorize`.

| Module | Endpoint | Who |
|---|---|---|
| Auth | `POST /auth/login` → `{token, user}` | public |
| Users | `GET/POST /users`, `PUT/DELETE /users/{id}` `{name, email, phone, password, role, active}` | MANAGER (own park) |
| Parks | `GET /parks`, `POST /parks` `{name, code}`, `POST /parks/{id}/switch` | staff (list), MANAGER (create, switch) |
| Park config | `GET/POST/PUT/DELETE /parks/{id}/sectors\|zones\|incident-types\|segments` | MANAGER (writes), staff (reads) |
| UC3 | `GET/POST/PUT /parks/{id}/animals` `{name, species}`, `GET/POST/PUT /parks/{id}/devices` `{type, code, expectedIntervalMin, animalId, lat, lng}` | MANAGER (writes), staff (reads) |
| UC3 | `GET /parks/{id}/alert-rules`, `PUT/DELETE /parks/{id}/alert-rules/{zoneType}` `{severity, cooldownMin, ackSlaMin}` | MANAGER (writes), staff (reads) |
| UC1 | `GET/POST /routes`, `PUT /routes/{id}` `{name, pathGeojson}`, `DELETE /routes/{id}` (archives: hidden from the list and from assigning, past patrols keep it), `POST /patrols` `{routeId, rangerIds, scheduledDate}` (one Planned patrol per ranger, returns the list), `PUT /patrols/{id}` `{routeId, rangerId, scheduledDate}` and `DELETE /patrols/{id}` (Planned patrols only, otherwise 400; the date cannot be in the past), `GET /patrols?status=&date=` | MANAGER |
| UC1 | `GET /me/patrols` (today's patrols, plus the ranger's active patrol if it started on an earlier day, listed first) | RANGER |
| UC1 | `POST /patrols/{id}/start` `{at}`, `POST /patrols/{id}/end` `{at}` | RANGER, idempotent |
| UC1 | `POST /patrols/{id}/points` `[{lat, lng, accuracyM, recordedAt, isWaypoint, note}]` | RANGER, batch upsert |
| UC1 | `GET /patrols/{id}/track`, `GET /monitor/live`, `GET /monitor/coverage` | MANAGER |
| UC2 | `POST /incidents` (multipart: `data` JSON with optional `clientId` + `photo`), `GET /me/incidents`, `GET /incidents?status=&type=&severity=`, `GET /incidents/{id}` (both include `responderName` from the latest dispatch that was not declined), `PATCH /incidents/{id}` (severity), `POST /incidents/{id}/dismiss` | RANGER creates, MANAGER triages |
| Shared | `POST /dispatches` `{sourceType, sourceId, responderId}`, `GET /me/dispatches`, `POST /dispatches/{id}/acknowledge\|complete\|decline` | — |
| Shared | `GET /responders?lat=&lng=`, which returns the park's active rangers: on-patrol rangers sorted by distance first, then the rest as offline. `GET /dispatches/{id}` and `GET /dispatches?sourceType=&sourceId=` only return a ranger's own dispatches, and staff only see dispatches in their park | — |
| Shared | `GET /me/notifications` → `{unreadCount, notifications}`, `POST /notifications/{id}/read` | staff |
| UC3 | `GET /alerts?status=` | staff |
| UC3 | `POST /alerts/{id}/acknowledge`, `POST /alerts/{id}/resolve` `{disposition}` | RANGER, MANAGER |
| UC3 | `GET /parks/{id}/camera-images?status=`, `GET /parks/{id}/camera-images/{imageId}/file?reason=` (audited if restricted) | MANAGER |
| UC3 | `POST /parks/{id}/camera-images/{imageId}/tag` `{status, species, animalCount}` | MANAGER |
| UC3 sim | `POST /ingest/collar-fixes` `{collarCode, lat, lng, recordedAt, batteryPct}`, `POST /ingest/camera-images` (multipart `cameraCode`, `capturedAt`, `image`) | **api-key** |
| UC3 sim | `POST /parks/{id}/simulator/collar-fixes` `{collarCode, scenario, lat, lng, zoneId}`, `POST /parks/{id}/simulator/camera-images` `{cameraCode, count}` | MANAGER |
| UC4 | `POST /public/reports` (multipart), `GET /public/reports/{ref}`, `GET /public/parks/{id}/segments` | **public** |
| UC4 sim | `POST /ingest/sms` `{from, body}` → `{reply}` | **api-key** |
| UC4 | `GET /community-reports?status=`, `POST /community-reports/{id}/validate` `{severity}`, `POST /community-reports/{id}/invalidate` `{reason}`, `GET /community/hotspots` | CLO, MANAGER |
| Reports | `GET /reports/coverage\|incidents\|alerts\|conflicts?from=&to=` (`&format=csv`) | MANAGER, RESEARCHER |
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
- A scheduled job escalates unacknowledged alerts after each SLA period through the park's escalation steps (Manager for Yala).
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
│  │  ├─ alerts/  images/  devices/  simulator/   # UC3 (simulator = demo collar and camera data)
│  │  ├─ community/                            # UC4
│  │  ├─ reports/                              # all four reports, tabs
│  │  ├─ settings/            # sectors, zones/ (zones and alert rules, UC3), incident types, segments (GeoJSON paste)
│  │  └─ users/               # MANAGER: user management (CMN-02)
│  └─ report/                 # PUBLIC villager form; [ref]/page.tsx = status
├─ components/                # Map (Leaflet), StatusBadge, SeverityBadge, BigButton, PickList, DispatchDialog
├─ hooks/                     # one React Query hook per screen/resource (use-active-patrols.ts)
├─ lib/
│  ├─ api/client.ts           # apiGet(path, zodSchema): base URL, JWT header, ApiError, response parsing
│  ├─ api/<resource>.ts       # one fetcher per endpoint + its zod response schema
│  ├─ <feature>/mappers.ts    # pure response → view mapping (types.ts, store.ts for UI state)
│  ├─ auth/store.ts           # Zustand session store (token + user) persisted to localStorage
│  ├─ enums.ts                # const objects mirroring backend enums
│  ├─ patrols/tracking.ts     # GPS sampling rule (60 s / 50 m); hooks/use-patrol-tracker.ts runs watchPosition from the ranger layout
│  └─ i18n.ts                 # { en, si, ta } dictionaries + useT()
```

- **Role guard:** each top-level layout redirects the user to `/login` if their role does not match. The backend is the real enforcement.
- **Logout** is client-only, because the JWT is stateless: it clears the auth store and the React Query cache and redirects to `/login`. There is no logout endpoint, and the discarded token stays valid until it expires.
- **Data fetching** goes through React Query (`useQuery`/`useMutation`, with `refetchInterval` for polling). `lib/api/*` only sends requests and returns the zod-validated raw response. Mapping and business logic live in separate mapper/service functions.
- **Client state** (auth user, UI and filter state) lives in Zustand stores. Server data stays in React Query, not in Zustand.
- **Status and severity** are always shown as **text plus a colour**, never colour alone.
- **Mobile UI:** use `min-h-12` (48 px) for tap targets and the `text-base`/`text-lg` text sizes. The primary action is a full-width button pinned to the bottom of the screen.

## 8a. Mobile app structure (ranger)

```
mobile/
├─ app.config.ts                 # permissions, background location, maps key
└─ src/                          # imported as @/*
   ├─ app/                       # expo-router
   │  ├─ _layout.tsx             # fonts, React Query (persisted), DB init, sync engine, login/ranger guard
   │  ├─ login.tsx               # Sign in; only RANGER may continue
   │  └─ (ranger)/
   │     ├─ _layout.tsx          # header (logo + Log out), sync bar, stack, bottom nav: Patrols, Report, Tasks, Alerts
   │     ├─ index.tsx            # my patrols today
   │     ├─ report.tsx           # report incident
   │     ├─ tasks.tsx            # my dispatches + my incidents
   │     ├─ alerts.tsx           # open alerts + notifications
   │     ├─ patrol/[id].tsx      # map, Start/End, Waypoint, Report incident
   │     └─ dispatch/[id].tsx    # Acknowledge, Complete, Decline
   ├─ components/                # ui/ (DESIGN.md primitives), layout/, map/, sync/, one folder per feature
   ├─ hooks/                     # one React Query hook per screen/resource
   └─ lib/
      ├─ api/                    # client.ts + one module per resource with its zod schema (ported from frontend)
      ├─ auth/                   # session store (expo-secure-store) and sign-in form schema
      ├─ db/                     # opens wildx.db and creates the outbox table
      ├─ outbox/                 # repository (SQL), sync engine, pending overlay mappers
      ├─ tracking/               # background location task and the 60 s / 50 m rule
      ├─ <feature>/mappers.ts    # pure view mapping (ported from frontend)
      └─ theme.ts                # DESIGN.md tokens
```

- **Outbox.** Table `outbox(id TEXT PK, user_id, kind, patrol_id, target_id, body, photo_uri, created_at, attempts, status, error)`. Kinds: `PATROL_START`, `PATROL_END`, `TRACK_POINT`, `INCIDENT`, `DISPATCH_ACK`, `DISPATCH_COMPLETE`, `DISPATCH_DECLINE`, `ALERT_ACK`, `ALERT_RESOLVE`. Each ranger write inserts a `PENDING` row first, and the screen confirms as soon as the row is saved. Incident photos are copied into the app's document folder and deleted once sent.
- **Sync engine.** Sends the signed-in ranger's `PENDING` rows oldest first, one at a time, with consecutive track points of one patrol batched into one `/points` call (at most 1000). It runs after each new row, when the network returns, when the app comes to the foreground and every 30 s while rows wait. A network error or 5xx stops the run and keeps the row. A 401 stops the run and keeps every row until the ranger signs in again. Any other 4xx marks the row `REJECTED` with the server message; the sync bar shows it until the ranger discards it.
- **Pending overlay.** Pure mappers merge the ranger's pending rows into server data, so offline actions show at once: a started patrol is Active, the walked track and waypoints show, reported incidents are listed as *Pending sync*, and acknowledged dispatches and alerts change state.
- **Offline reads.** The React Query cache is persisted to `expo-sqlite/kv-store`, so screens open offline with the last data. The session (token and user) is kept in `expo-secure-store`.
- **Tracking.** A background location task, defined at module scope, receives fixes while a patrol is active (with the Android foreground-service notification), keeps the 60 s / 50 m rule against the last recorded fix and inserts `TRACK_POINT` rows. The patrol screen shows the No GPS banner when location services are off or no fix has arrived for 90 s, and reports `POST /patrols/{id}/gps` while online.
- **Log out** keeps unsynced rows on the device. They are sent the next time the same ranger signs in.

## 9. Configuration and local setup

Secrets go in `backend/.env` (git-ignored; `backend/.env.example` lists the keys: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `INGEST_API_KEY`, `UPLOAD_DIR`, `CORS_ORIGINS`). `CORS_ORIGINS` is a comma-separated list of allowed browser origins and defaults to `http://localhost:3000`. Spring loads it through `spring.config.import`. Frontend `.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1`.

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

The ranger mobile app reads `EXPO_PUBLIC_API_URL` from `mobile/.env.local` (`mobile/.env.example` lists the keys; for example `http://10.0.2.2:8080/api/v1` on the Android emulator, or the computer's LAN address on a phone). Background GPS needs a development build; an Android build also needs `GOOGLE_MAPS_API_KEY` for `react-native-maps`:

```bash
cd mobile && npx expo run:android
```

**Database reset and seed data:** Every backend startup recreates the application's tables through Hibernate (`ddl-auto=create`), deleting existing application data before the ordered seeders run. Restarting only the frontend does not reset the database.

`config/DataSeeder` creates Yala and Udawalawe, with staff for every role, named animals, collars and cameras, every zone type, alert rules, incident types and boundary segments. The Yala Manager manages both parks. Existing Yala logins (`ranger@wildx.lk`, `manager@wildx.lk`, `clo@wildx.lk`, `researcher@wildx.lk`, `kasun@wildx.lk`, `nimal@wildx.lk`, `saman@wildx.lk`) remain available. Udawalawe accounts use a `udawalawe.` email prefix. Every seeded account uses the demo password `password`.

`config/PatrolSeeder` adds sectors, routes, active online/offline patrols, planned and cancelled assignments, completed patrols over the previous weeks, GPS tracks and observation waypoints for both parks. `config/CommunityDataSeeder` adds web and SMS reports covering every report status, duplicates linked to their originals, closed outcomes and enough validated conflicts to demonstrate hotspots. `config/OperationalDataSeeder` runs last and adds linked incidents, collar fixes, alerts, dispatches and read/unread notifications. Operational timestamps are relative to startup so the dashboard and date-range reports have useful data. `repository/SeedHistoryRepository` uses Criteria updates to preserve historical audit dates for seed records, keeping report dates and response durations consistent with their lifecycle timestamps. Historical health alerts are resolved, with at most one unresolved alert per device and type. Notification links respect the recipient's role.

Simulation scripts live in `docs/sim/*.http` (IntelliJ/VS Code REST client) and send a fix inside the farmland zone, a camera image and an SMS.

## 10. Testing

- Backend: unit tests with ≥80% coverage on new code; focus on `GeoUtil`, `SmsParser`, alert rules, escalation and the duplicate check.
- Frontend: Vitest with React Testing Library and jsdom provides unit tests for application logic, API contracts, hooks, components and pages. `npm run test:coverage` enforces at least 80% statements, branches, functions and lines across `app/`, `components/`, `hooks/` and `lib/`, excluding only `.d.ts` declarations. These tools and the V8 coverage provider are development dependencies. Also manually run each flow in requirements.md at 360 px.
- Mobile: `npx tsc --noEmit` and `npx expo lint` pass; run F1.2, F2.1 and F2.3 with airplane mode on, then off, and check that each write syncs once.

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
