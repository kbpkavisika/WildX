# WildX – Requirements

Smart Wildlife Conservation & Anti-Poaching Monitoring System for the Department of Wildlife Conservation, Sri Lanka.
This is a prototype for SE3070 Case Study 1 (Phase 2). It keeps the design from the Phase 1 submission and applies the fixes from [Design_Critique_Y3S2_WE_13.md](Design_Critique_Y3S2_WE_13.md).
Technical design is in [architecture.md](architecture.md).

**Priority:** **M** = Must (needed for the demo), **S** = Should, **C** = Could (only if time allows).
**IDs:** `CMN-*` are shared, `PAT-*` are UC1, `INC-*` are UC2, `SEN-*` are UC3 and `COM-*` are UC4. Use these IDs in commits, PRs and tests.

---

## 1. Scope

- There is one responsive web app (Next.js). Rangers and villagers use it on a phone, and managers use it on a desktop. There is no separate native app.
- Each park is configured separately, so it has its own sectors, zones, incident types, alert rules and boundary segments. Adding a park or hazard type needs no code change (fixes W4).
- The collar feed, camera trap network and SMS gateway are **simulated** through HTTP endpoints. No real hardware or telco integration is built.

**Out of scope:** native apps, real SMS/telco integration, automatic image recognition, route optimisation, multi-tenant hosting, and fully offline map tiles for a whole park.

## 2. Actors

| Actor | Role | Main device |
|---|---|---|
| Ranger | Patrols, reports incidents, responds to dispatches and alerts | Phone |
| Patrol Supervisor | Monitors patrols, triages incidents, and is the second step of escalation | Desktop / phone |
| Park Manager | Plans routes, configures the park, is the final step of escalation, and views reports | Desktop |
| Community Liaison Officer (CLO) | Validates community reports and dispatches responders to conflicts | Desktop / phone |
| Law Enforcement Liaison (LEL) | Views restricted (suspected poacher) images | Desktop |
| Admin | Manages parks and users | Desktop |
| Villager | Reports sightings or crop damage through the web form or SMS. Does not log in | Phone / feature phone |
| *Collar Service, Camera Trap Network, SMS Gateway* | External systems (simulated) | – |

The villager reporting page is **part of the system**, not an external actor (fixes W8).

## 3. Business use cases and ownership

| UC | Name | Owner | Includes |
|---|---|---|---|
| UC1 | Manage & Monitor Ranger Patrols | Dev 1 (Heshani) | Plan/assign routes, start/track/end patrols, waypoints, live monitoring, coverage |
| UC2 | Report & Manage Incidents | Dev 4 (Dahanayaka) | Report incident, triage, assign/dispatch, resolve, incident types |
| UC3 | Monitor Sensors & Generate Alerts | Dev 2 (Prabodhana) | Collar ingest, zone breach alerts, escalation, camera-trap review, device health |
| UC4 | Manage Community Conflict Reports | Dev 3 (Hewagama) | Villager web/SMS report, CLO validation, dispatch, villager feedback, hotspots |

Each UC owns its own analytics report, which is the last requirement in its section. **Dispatch Responder** is one shared function that UC2, UC3 and UC4 all use (fixes W5 and W6).

---

## 4. Common requirements (CMN)

Each common requirement has one owner, shown in brackets. The other devs use it but do not change it without agreement.

| ID | Requirement | Pri |
|---|---|---|
| CMN-01 | Users log in with email and password. The system restricts each route and screen by role (§2). *(UC1)* | M |
| CMN-02 | An Admin can create, edit and deactivate parks and users, and assign each user a role and a park. *(UC1)* | M |
| CMN-03 | A Park Manager can define sectors as polygons for their park by pasting GeoJSON. *(UC1)* | M |
| CMN-06 | **Dispatch Responder** (shared): a supervisor, manager or CLO assigns a responder to an incident, alert or conflict report. The responder is notified and can then Acknowledge it, Complete it with an outcome, or Decline it. *(UC2)* | M |
| CMN-07 | In-app notifications: each user has a notification list. The app polls it while online and shows an unread badge. *(UC3)* | M |
| CMN-08 | SMS fallback: a High or Critical dispatch or alert sent to a ranger who has been offline for more than 5 minutes is also sent by SMS (simulated). *(UC4)* | S |
| CMN-09 | Mobile UI rules: text contrast of at least 4.5:1, tap targets of at least 48 px, pick-lists instead of free typing, and a large primary action button on each screen. *(all)* | M |
| CMN-10 | Language switch on ranger and villager screens: English, Sinhala and Tamil. *(UC4)* | S |
| CMN-11 | Shared layout for all screens: the same WildX branding, navigation and persona (fixes W26). *(all)* | M |

## 5. UC1 – Manage & Monitor Ranger Patrols (PAT)

| ID | Requirement | Pri |
|---|---|---|
| PAT-01 | A Park Manager creates a patrol route for a park by giving it a name and a path (GeoJSON LineString or points clicked on the map). | M |
| PAT-02 | A Park Manager or Supervisor assigns a route to a ranger for a date, which creates a patrol with status *Planned* (fixes W2). | M |
| PAT-03 | A ranger sees today's assigned patrols and their route on a map. | M |
| PAT-04 | A ranger starts a patrol, which sets it to *Active* and records the start time. | M |
| PAT-05 | During an active patrol, the app records a GPS point every 60 s or every 50 m, whichever comes first. | M |
| PAT-06 | A ranger adds a manual waypoint with an optional note in one tap plus an optional pick-list choice. A waypoint is a track point with a flag, **not** an incident (fixes W27). | M |
| PAT-07 | When GPS is unavailable, the app shows a "No GPS" banner and keeps the patrol running. Tracking resumes when the signal returns. | M |
| PAT-08 | A ranger ends a patrol, which sets it to *Completed* and records the end time. | M |
| PAT-09 | The server maps every track point to the sector it falls in. | M |
| PAT-10 | A Supervisor or Manager sees active patrols on a map with each ranger's last known position and time. Rangers who are offline show as *last seen hh:mm*. | M |
| PAT-11 | Coverage view: every sector shows when it was last patrolled. Sectors not patrolled for more than the park's `neglectDays` setting are highlighted, e.g. "Sector 4B – 9 days". | M |
| PAT-12 | Patrol history: list completed patrols with their distance and duration, and replay a patrol's track on the map. | S |
| PAT-13 | Report: patrol coverage per sector for a chosen date range, as a table plus a CSV download. | S |

### UC1 user flows

**F1.1 Plan and assign (Manager, desktop):** Routes → New route → enter a name and draw or paste the path → Save → Assign → choose a ranger and a date → the patrol is *Planned*.

**F1.2 Run a patrol (Ranger, phone):** Home → My patrols → choose a patrol → **Start** → the map shows the route and the ranger's live position → the ranger taps **Waypoint** when needed → the ranger taps **Report incident** when needed (UC2) → **End patrol**.

**F1.3 Monitor (Supervisor, desktop):** Dashboard → Live patrols map, which refreshes automatically → click a ranger to see their track → Coverage tab → neglected sectors are listed first → assign a new patrol to a neglected sector (F1.1).

---

## 6. UC2 – Report & Manage Incidents (INC)

| ID | Requirement | Pri |
|---|---|---|
| INC-01 | A Park Manager manages the incident types for their park: name, default severity and active flag. Example types are Snare, Carcass, Illegal campsite, At-risk species sign and Human-wildlife conflict (fixes W4). | M |
| INC-02 | A ranger reports an incident by choosing the type from a pick-list, attaching a photo with the phone camera (optional), entering a short description and having the location captured automatically. | M |
| INC-03 | When GPS fails, the ranger taps the incident location on the map instead. | M |
| INC-05 | The form highlights missing required fields: type and location. | M |
| INC-06 | An incident is linked to the ranger's active patrol, if there is one. | S |
| INC-07 | When a High or Critical incident is submitted, the system notifies the park's Supervisors and Managers automatically, with no manual refresh needed (fixes W16). | M |
| INC-08 | Triage: Supervisors and Managers see an incident queue they can filter by status, type and severity. They can change the severity and either dispatch a responder (CMN-06) or dismiss the incident with a reason (fixes W3). | M |
| INC-09 | An incident moves through these statuses: `NEW → ASSIGNED → RESOLVED`, or `NEW → DISMISSED`. Completing the dispatch resolves the incident with an outcome note. | M |
| INC-10 | A ranger sees the incidents they have reported and the dispatches assigned to them. | M |
| INC-11 | Report: incidents by type, by sector and by month for a date range, with a map of incident points and a CSV download. | S |

### UC2 user flows

**F2.1 Report (Ranger, phone):** Patrol screen → **Report incident** → choose the type → take a photo or skip → the location fills in automatically, or the ranger taps the map → add a description → **Submit** → the app shows "Saved".

**F2.2 Triage and dispatch (Supervisor, desktop):** A notification arrives saying "New High incident: Snare, Sector 3" → open the incident queue → open the incident and view its photo and map → adjust the severity → **Dispatch** → choose a ranger from the list, sorted by distance → the ranger is notified.

**F2.3 Respond (Ranger, phone):** Notifications → open the dispatch → **Acknowledge** → go to the location shown on the map → **Complete** with an outcome from a pick-list plus a note → the incident becomes *Resolved*.

---

## 7. UC3 – Monitor Sensors & Generate Alerts (SEN)

| ID | Requirement | Pri |
|---|---|---|
| SEN-01 | Admins and Managers register devices: **collars**, which are linked to an animal (name, species), and **camera traps**, which have a location. Each device has an expected reporting interval. | M |
| SEN-02 | A Park Manager defines high-risk **zones** as polygons with a type: Farmland, Road, Village buffer or Restricted. | M |
| SEN-03 | A Park Manager configures an **alert rule** for each zone type with a severity, a cool-down period (minutes) and an acknowledgement SLA (minutes). | M |
| SEN-04 | Collar ingest endpoint: the system accepts a fix (collar code, latitude, longitude, timestamp, battery). It rejects malformed fixes and ignores duplicates, where a duplicate has the same collar and timestamp. | M |
| SEN-05 | When a stored fix falls inside a zone, the system creates a **Zone breach** alert with the rule's severity, unless an alert for the same animal and zone was raised within the cool-down period. | M |
| SEN-06 | A breach between 18:00 and 06:00 raises the severity by one level. | S |
| SEN-07 | A new alert appears in the dashboard alert queue and on the map. All on-duty rangers of the park are notified (CMN-07), with SMS fallback (CMN-08). | M |
| SEN-08 | A ranger or manager **acknowledges** an alert, and the system records who acknowledged it and when. A manager can dispatch a specific responder (CMN-06). | M |
| SEN-09 | Escalation: an alert not acknowledged before its SLA deadline is escalated to the Patrol Supervisor(s), and then to the Park Manager after another SLA period. The number of steps comes from data, so the loop count is not hard-coded (fixes W18). | M |
| SEN-10 | A user resolves an alert with a disposition: *Conflict averted*, *Conflict occurred*, *No action required* or *False alarm*. | M |
| SEN-11 | Device health: the system raises an alert when a device has not reported within 3× its expected interval, or reports battery below 15%. | S |
| SEN-12 | Mortality/immobility: when a collar moves less than 50 m in 6 h, the system raises a **Critical** alert. | S |
| SEN-13 | Camera upload endpoint: the system accepts an image with a camera code and capture time, and drops duplicates (same camera and capture time). | M |
| SEN-14 | The image review queue lets reviewers tag each image with a species and count, or mark it *Empty* or *Unidentifiable*. Images from the same camera within 1 min are shown as one burst. | M |
| SEN-15 | A reviewer marks an image as **Restricted** when it shows a suspected poacher. Only the Manager, LEL and Admin can see restricted images. The system raises an alert, and every view of the image is written to the audit log with the user, the time and a reason. | M |
| SEN-16 | Report: alert counts by type and zone, plus the median time to acknowledge and median time to resolve. | S |
| SEN-17 | A Park Manager can send an advisory SMS broadcast for an alert to the registered villager numbers near the affected boundary segment. | C |

### UC3 user flows

**F3.1 Zone breach (system → Ranger):** The simulator POSTs a collar fix → the fix is stored → the system finds that it falls inside the "Kumbukgaha farmland" zone → there is no recent alert, so it creates an alert with severity High (raised because it is night-time) → the alert appears on the dashboard and on-duty rangers are notified → a ranger taps **Acknowledge**, then travels to the site → **Resolve** with the disposition "Conflict averted".

**F3.2 Escalation:** No one acknowledges the alert within the SLA → the escalation job notifies the Supervisor → still no acknowledgement → the Manager is notified → the Manager dispatches a specific ranger.

**F3.3 Camera review (Manager, desktop):** Image review → the queue shows bursts → the Manager tags each one with a species and count, or marks it Empty → for a suspected poacher, marks it **Restricted** → the system raises an alert, and the image is now visible only to the Manager, LEL and Admin, with each view audited.

---

## 8. UC4 – Manage Community Conflict Reports (COM)

| ID | Requirement | Pri |
|---|---|---|
| COM-01 | A Park Manager defines **boundary segments** for their park, each with a name, a short landmark **code** used in SMS (e.g. `KUMB`) and a centre point. | M |
| COM-02 | Villager web form at `/report`, which needs no login and is designed for phones: the villager chooses a report type (Elephant sighting / Crop damage / Other), the number of animals, an optional photo and an optional note, and enters a phone number. The location comes from GPS or from a landmark pick-list. | M |
| COM-03 | SMS format (fixes W22): `<TYPE> <LANDMARK> [COUNT]`, case-insensitive, with keywords accepted in English, Sinhala and Tamil (transliterated). Examples are `ELE KUMB 3` and `ALI KUMB 3`. See the keyword table in architecture.md §7.2. | M |
| COM-04 | Every SMS gets an automatic reply: either a reference code or a help message showing the correct format. | M |
| COM-05 | The system links each report to its boundary segment, using the landmark code or the segment nearest to the GPS point. Reports with no usable location go to the CLO queue marked *Needs location*. | M |
| COM-06 | Duplicate check: an open report on the same segment within the park's `duplicateWindowMin` is marked *Duplicate* and linked to the original report. No new case is created for it. | M |
| COM-07 | A new report appears in the CLO review queue and the CLO is notified. | M |
| COM-08 | The CLO validates a report and sets its severity, which makes it a conflict case, or marks it *Invalid* with a reason. | M |
| COM-09 | The CLO dispatches a responder (CMN-06), choosing from a ranger list sorted by distance to the segment. | M |
| COM-10 | When the responder completes the dispatch with an outcome, the case is closed and the villager is told the outcome automatically through the channel they used: SMS, or a status page found by reference code. | M |
| COM-11 | Hotspots: a boundary segment with at least `hotspotThreshold` validated reports in the last 30 days is flagged on the dashboard, e.g. "Kumbukgaha: 12 conflicts this month". | M |
| COM-12 | Report: conflict trend by month and by segment, with a CSV download. | S |
| COM-13 | An SMS help card showing the format, keywords and short code can be printed from the app. | C |

### UC4 user flows

**F4.1 Villager by SMS (feature phone):** The villager sends `ELE KUMB 3` to the short code → the system parses the message and links it to the Kumbukgaha segment → it stores the report, which is *New* → it auto-replies "WildX: Report R-1042 received. Rangers notified." If the message cannot be parsed, the reply shows the correct format.

**F4.2 Villager by web (smartphone):** Open `/report` → choose a language → choose the type → enter the count → the location is filled in automatically → **Send** → the page shows the reference code. The villager can check its status later at `/report/R-1042`.

**F4.3 Validate and dispatch (CLO):** Community queue → open the report and see its map, segment and any duplicates → **Validate**, choosing the severity → **Dispatch** the nearest ranger → the ranger completes the dispatch with an outcome → the villager gets an SMS or a status-page update → the hotspot counters update.

---

## 9. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-01 | Ranger screens work on a 360 px wide phone in Chrome for Android. Dashboards are designed for ≥1280 px but stay usable on a phone. |
| NFR-03 | No accepted field data is lost. |
| NFR-04 | Dashboard data is no more than 30 s old, refreshed by polling. |
| NFR-05 | Passwords are hashed with BCrypt, and every API except the public villager and simulator endpoints needs a JWT. |
| NFR-06 | Restricted images are never sent to a user who is not authorised to see them. |

## 10. On hold

Offline saving and syncing when the connection is available are on hold. They are not part of the current build and are removed from architecture.md.

| ID | Requirement | Pri |
|---|---|---|
| – | Ranger field work works offline: data is saved on the device first and synced later (fixes W17). This also covers offline start/tracking in PAT-04/PAT-05 and the offline steps of F1.2 and F2.1. | – |
| CMN-04 | Offline outbox: any ranger write made while offline is saved on the device and replayed automatically when the app is back online. A replayed write is never stored twice. *(UC2)* | M |
| CMN-05 | A sync bar is always visible on ranger screens and shows *Online/Offline*, the number of items waiting to sync, and the last sync time. *(UC2)* | M |
| INC-04 | An incident is saved locally first, so the "Submit" action works offline. The report is marked *Pending sync* until the server accepts it (fixes W17). | M |
| NFR-02 | The app shell for ranger pages loads offline after the first online visit. | – |
| NFR-03 (part) | A record replayed from the offline outbox is stored once only (idempotent). | – |

**Known limitation:** a browser cannot track GPS in the background when the screen is locked, so rangers keep the patrol screen open. A native app would be needed to remove this limitation.
