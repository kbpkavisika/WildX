# Ranger mobile app (Expo) with offline sync

Goal: a React Native (Expo SDK 57) app in `mobile/` for the **Ranger** role only. It covers every ranger step in requirements.md and makes all ranger writes work offline through a SQLite outbox (CMN-04, CMN-05, INC-04, NFR-03).

## Decisions (agreed with the user, 9 Oct 2026)

| # | Decision |
|---|---|
| M1 | Replays are made safe in the backend: incidents carry a client UUID (`clientId`, unique); repeating the same dispatch or alert action returns the saved state instead of 400 |
| M2 | Maps use `react-native-maps` with an OpenStreetMap `UrlTile` layer |
| M3 | Patrol GPS keeps running with the screen locked (`expo-location` background updates + `expo-task-manager`, Android foreground-service notification). Needs a development build |
| M4 | requirements.md, architecture.md and DESIGN.md are updated before code |

## Requirement IDs in scope

| ID | Mobile behaviour |
|---|---|
| CMN-01 | Email/password sign-in. Only `RANGER` may use the app |
| CMN-04 | Every ranger write goes to the SQLite outbox first, then syncs in order; replays never store twice |
| CMN-05 | Sync bar on every ranger screen: Online/Offline, items waiting, last sync time |
| CMN-06 | Acknowledge, Complete (outcome pick-list + note) or Decline a dispatch, offline too |
| CMN-07 | Notifications list polled while online, unread badge on the Alerts tab |
| CMN-09 | 48 px tap targets, pick-lists, ≥4.5:1 contrast, full-width primary action |
| CMN-11 | Same branding, header and bottom nav as the web ranger layout |
| PAT-03…08 | Today's patrols, route map, Start, 60 s / 50 m tracking, waypoints, No GPS banner, End |
| INC-02, 03, 05, 06, 10 | Report with pick-list, camera photo, auto GPS or tap-on-map, required-field highlight, linked to the active patrol by the server, my incidents and dispatches |
| INC-04 | Submit works offline; the report shows *Pending sync* until the server accepts it |
| SEN-07, 08, 10 | Open alerts list, Acknowledge, Resolve with a disposition, Open in maps |
| F1.2, F2.1, F2.3, F3.1 | Ranger flows end to end |

Out of scope: CMN-10 language switch (Should; the web ranger screens do not have it either), push notifications (polling stays, CMN-07), iOS-specific polish.

## Architecture

```
mobile/
├─ app/                         expo-router
│  ├─ _layout.tsx               fonts, providers, DB init, sync engine start
│  ├─ login.tsx
│  └─ (ranger)/
│     ├─ _layout.tsx            guard, header (logo + log out), sync bar, stack
│     ├─ (tabs)/_layout.tsx     bottom nav: Patrols, Report, Tasks, Alerts
│     ├─ (tabs)/index.tsx       my patrols today
│     ├─ (tabs)/report.tsx      report incident
│     ├─ (tabs)/tasks.tsx       my dispatches + my incidents
│     ├─ (tabs)/alerts.tsx      open alerts + notifications
│     ├─ patrol/[id].tsx
│     └─ dispatch/[id].tsx
├─ components/ ui/ layout/ map/ patrols/ incidents/ dispatch/ alerts/ notifications/ sync/
├─ hooks/                       one React Query hook per screen/resource
└─ lib/
   ├─ api/                      client + one module per resource (zod schemas, ported from frontend)
   ├─ db/                       SQLite open + schema
   ├─ outbox/                   repository (SQL), sync engine, pending overlay mappers
   ├─ tracking/                 background location task, sampling rule
   ├─ <feature>/mappers.ts      pure view mapping (ported from frontend)
   ├─ theme.ts                  DESIGN.md tokens
   └─ enums.ts constants.ts format.ts geo.ts
```

### Outbox (CMN-04)

SQLite table `outbox(id TEXT PK, user_id INT, kind TEXT, patrol_id INT NULL, target_id INT NULL, body TEXT, photo_uri TEXT NULL, created_at INT, attempts INT, status TEXT, error TEXT NULL)`.

- Kinds: `PATROL_START`, `PATROL_END`, `TRACK_POINT` (auto or waypoint), `INCIDENT`, `DISPATCH_ACK`, `DISPATCH_COMPLETE`, `DISPATCH_DECLINE`, `ALERT_ACK`, `ALERT_RESOLVE`.
- Every write inserts a row first, then wakes the sync engine. The UI shows success as soon as the row is saved ("Saved").
- The engine sends `PENDING` rows of the signed-in user oldest first. Consecutive `TRACK_POINT` rows of one patrol go as one `/points` batch (≤1000).
- Network error or 5xx: stop, keep the row, retry on reconnect, on app foreground, every 30 s while rows wait, and after every new row. 401: stop and keep everything until the ranger signs in again. Other 4xx: the server rejected it, so the row becomes `REJECTED` with the server message, shown under the sync bar with Discard; it is never silently dropped.
- Photos are copied into the app's document folder before the row is saved, and deleted after a successful send.
- Idempotency: start/end send the tap time `{at}` (already idempotent), track points use the unique `(patrol, recordedAt)`, incidents send `clientId` = the row id, and repeated dispatch/alert actions return the saved state (M1).
- Pending overlay: pure mappers merge pending rows into server data so the screens show the ranger's own offline actions (patrol Active, walked track, waypoints, *Pending sync* incidents, acknowledged dispatches and alerts).
- Read data is cached: the React Query cache is persisted to `expo-sqlite/kv-store`, so screens open offline with the last data.

### Tracking (PAT-05, PAT-07)

A background location task (defined at module scope) receives fixes, applies the existing 60 s / 50 m rule against the last recorded fix (kept in kv-store), inserts `TRACK_POINT` rows and triggers a sync. The patrol screen shows the No GPS banner when location services are off or no fix arrived for 90 s, and reports `/gps` while online.

## Backend changes (M1)

- `Incident.clientId` (`client_id VARCHAR(36)` UNIQUE, nullable for existing rows); `IncidentCreateRequest.clientId` (optional UUID). A repeated `clientId` from the same reporter returns the existing incident with 201 semantics and no second notification.
- `DispatchServiceImpl`: acknowledge on `ACKNOWLEDGED`, complete on `COMPLETED`, decline on `DECLINED` return the saved dispatch.
- `AlertServiceImpl.resolve` on `RESOLVED` returns the saved alert.
- Unit tests for each new branch; `./mvnw verify` green.

## New mobile dependencies (mobile/ only)

expo-router, expo-sqlite, expo-location, expo-task-manager, expo-image-picker, expo-file-system, expo-network, expo-secure-store, expo-crypto, expo-font, @expo-google-fonts/geist, react-native-maps, react-native-svg, lucide-react-native, @tanstack/react-query (+ persist-client, async-storage-persister), zustand, zod, react-hook-form, @hookform/resolvers.

## Tasks

1. **Docs** – requirements.md (scope, offline items active, mobile app), architecture.md (D1, stack, idempotency contract, `client_id`, §8 mobile structure, outbox, setup), DESIGN.md (Mobile app: header, sync bar, pending chip, tab bar, sign in on phone).
2. **Backend idempotency** – M1 changes + tests.
3. **Scaffold** – Expo app, app.config (permissions, background location, maps key env), theme tokens, Geist fonts, lint/tsc.
4. **UI kit** – Button/SecondaryButton/QuietButton/IconButton, Card, Chip, StatusDot, FactList, Field + TextField + Select (pick-list sheet), ChoiceRow, UnreadBadge, Logo, PageHeader, Notice lines, NoGpsBanner.
5. **Auth** – api client, SecureStore session store, sign-in screen, ranger-only guard, log out (warns when items wait).
6. **Offline core** – SQLite schema, outbox repository, network store, sync engine, sync bar, query cache persistence.
7. **Patrols** – list, patrol screen with map, Start/End/Waypoint through the outbox, background tracking, No GPS banner, overlay.
8. **Report incident** – type pick-list, camera photo, GPS or tap-on-map, validation, outbox, *Pending sync* in My incidents.
9. **Tasks and dispatch** – lists, dispatch screen, acknowledge/complete/decline through the outbox, location map, incident facts and photo.
10. **Alerts and notifications** – open alerts, acknowledge/resolve through the outbox, Open in maps, notifications with mark read, unread badge on the tab.
11. **Verify** – `npx tsc --noEmit`, `npx expo lint`, `npx expo export` bundle check, backend `./mvnw verify`, no comments, docs match code.
