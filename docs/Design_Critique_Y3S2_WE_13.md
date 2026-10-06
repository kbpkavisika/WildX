# Design Critique – Smart Wildlife Conservation & Anti-Poaching Monitoring System (Y3S2_WE_13)

**Reviewed against:** SE3070 Assignment 1 – Case Study 1. Page numbers refer to the team's PDF.

---

## 1. Strengths

| # | Strength |
|---|---|
| S1 | The intro (p3) names four business use cases that map to the brief and treats offline operation as a core constraint. |
| S2 | The use case diagram (p4) covers all human actors and models external systems (SMS Gateway, GPS, Collar Network, Camera Traps) as actors. |
| S3 | "Configure Species & Risk Parameters" and "Manage Parks & Patrol Areas" address per-park flexibility. |
| S4 | The UC3 scenario (p15–18) is thorough, covering alert cool-down, night-time severity, SLA escalation, mortality and device-health alerts, and audited poacher images. |
| S5 | The UC4 scenario (p22–24) adds duplicate detection, boundary-segment geocoding, reporter feedback and hotspot detection. |
| S6 | The UC3 sequence diagram (p14) uses `ref`, `alt`, `opt`, `par` and `loop` correctly, with consistent boundary/control/entity stereotypes. |
| S7 | The UC1 scenario (p8–9) handles storage-full, GPS-loss and sync-failure exceptions without data loss. |
| S8 | The UC1 and UC3 dashboards show status as text plus colour, last-known locations, neglected sectors, SLA countdowns and triage shortcuts. |
| S9 | The storyboards use realistic Sri Lankan scenarios, including feature-phone SMS reporting for villagers. |

---

## 2. Weaknesses

| Code | Issue | Why it is a weakness |
|---|---|---|
| W1 | The use case diagram's four business use cases (p4) replace "Report & Manage Incidents" from the intro (p3) with analytics. | One assigned business use case is missing, and the numbering no longer traces across artefacts. |
| W2 | No use case lets a Park Manager plan or assign patrol routes (p4). | Route assignment is required by the brief but has no use case, flow or UI. |
| W3 | UC2 covers only reporting (p29–30), while its wireframe shows statuses and dispatch (p33). | The UI is not backed by any behavioural design. |
| W4 | Incident types are hard-coded as PoachingIncident and WildlifeIncident subclasses (p5). | New hazard types per park would need code changes, which breaks the flexibility requirement. |
| W5 | Step-level and optional behaviours such as Start/End Patrol and Record Manual Waypoint are modelled as «include» (p4). | This is functional decomposition, and it contradicts the diagram's own note that «include» means mandatory. |
| W6 | Analytics has nine includes, including Export/Share Reports, plus include chains (p4). | This forces every analysis to export, and include chains model control flow, which use case diagrams don't express. |
| W7 | Actors are linked directly to sub use cases such as Acknowledge Alert and Capture Report Location (p4). | It blurs which use case each actor initiates. |
| W8 | Patrol Supervisor and Law Enforcement Liaison are missing from the diagram, and the community app is listed as an external actor (p15, p22). | The actor set is inconsistent, and the app is part of the system, not external to it. |
| W9 | No controller, boundary or service class used in the four sequence diagrams exists in the class diagram. | Static and dynamic views describe different systems. |
| W10 | Sequence diagram messages such as `createPatrol` and `escalate` are not operations on the class diagram's classes. | The design cannot be implemented consistently. |
| W11 | Several things the scenarios and screens depend on have no class to hold them, e.g. boundary segments (UC4 hotspots), park sectors (UC1 coverage), collar location history, alert rules and dispatch records (p5). | Without these classes the system has nowhere to keep this data, so results like "Kumbukgaha boundary: 12 conflicts this month" or "Sector 4B not patrolled for 9 days" cannot be produced. |
| W12 | Only Incident has `syncStatus`, and Waypoint duplicates the GPSLocation attributes. | Other offline data has no sync state, and location is modelled twice. |
| W13 | In the UC1 sequence diagram, the GPS Service appears to create and save the Patrol (p6, msgs 11–13). | An external location service should not create domain objects. |
| W14 | The UC1 `alt` divider places sync success and dashboard notification inside [No Network] (p6). | The flow is logically contradictory. |
| W15 | UC1 location updates have no offline guard, no `loop`, no waypoint step, and use an invalid "Network Restored" box (p6). | It misses the offline requirement and is not valid UML. |
| W16 | The UC2 sequence diagram uses general boxes like "Mobile App" and "Central Server" instead of boundary/control/entity objects. The manager only sees a new incident after clicking "View incidents" (p29). | It doesn't match the style of the other three diagrams. The system never alerts the manager, so a critical snare can go unnoticed until someone happens to check. |
| W17 | In both UC1 and UC2, the online path sends straight to the server without saving locally first. | Data is lost if the connection drops mid-send. |
| W18 | The UC3 sequence diagram cites non-existent "FR-CL" requirements, hard-codes `loop(1,3)`, and omits the SMS fallback (p14). | The references dangle, and the diagram doesn't match its scenario. |
| W19 | The UC4 fragments don't enclose their messages, and the advisory SMS flow is missing (p21). | The conditional logic is ambiguous and incomplete. |
| W20 | The UC1 and UC2 scenarios lack a trigger, priority and step-referenced extensions, and UC2 has no actors. | Flows are untraceable and inconsistent with UC3/UC4. |
| W21 | The UC1 main flow interleaves Park Manager steps 13–15 with ranger steps (p7–8). | It implies a sequence between independent actors. |
| W22 | UC4 assumes free-text SMS parsing with no defined format or language (p23, p28). | Sinhala, Tamil or English free text can't be geocoded reliably. |
| W23 | All wireframes are desktop dashboards, and no ranger or villager mobile screen exists. | The brief's priority user, the field ranger, has no designed UI. |
| W24 | The UC4 wireframes are copies of the UC3 sensor dashboard (p26–27). | UC4 has no UI at all. |
| W25 | The UC2 storyboard shows reporting from a laptop at the station, then "continues the patrol" (p34). | It contradicts the brief's field-reporting requirement and the storyboard itself. |
| W26 | The UC2 screens use different branding, navigation and persona, and show an unmodelled LoRa mesh (p32–33). | This breaks consistency, and the UI promises infrastructure the design lacks. |
| W27 | The UC1 low-fi and hi-fi disagree on sync status, and a snare is logged as a waypoint (p10–12). | The iterations conflict, and the waypoint/incident boundary is blurred. |
| W28 | No outdoor HCI is designed: contrast, large targets, minimal typing, sync indicator or localisation. | These are exactly the usability conditions the brief stresses. |
| W29 | Diagrams are illegible in the PDF, and the p13 Drive link may be truncated. | The submission can't be assessed standalone. |
| W30 | The intro contains garbled sentences (p3). | This reduces the credibility of the bid. |

---

## 3. Suggested Improvements

| Resolves | Suggestion | Justification |
|---|---|---|
| W1 | Restore "Report & Manage Incidents" as one of the four business use cases, and keep analytics as a separate supporting use case that draws data from all four. | This restores the assigned use case while still showing that every use case feeds analytics. |
| W2, W3 | Add "Plan & Assign Patrol Route" and "Triage / Assign / Resolve Incident" use cases. | They cover the missing route-management and incident-management halves. |
| W5, W6 | Make optional behaviours «extend», drop step-level includes and chains, and use one shared included "Dispatch Responder". | This gives correct UML semantics and shows real reuse. |
| W7 | Link actors only to the use cases they initiate. | It clarifies responsibility. |
| W8 | Separate Patrol Supervisor, add Law Enforcement Liaison, and treat the community app as a system boundary. | This makes actors consistent across all artefacts. |
| W9, W10 | Add the controller and boundary classes used in the sequence diagrams, and align every message to a class operation. | Static and dynamic views then match and can be implemented. |
| W4 | Replace incident subclasses with a per-park configurable IncidentType. | Parks can add hazards without code changes. |
| W11 | Add Sector, BoundarySegment, PositionFix, AlertRule, Dispatch, AuditLog and Device classes. | They give the system somewhere to store the data that coverage, hotspot and escalation features need. |
| W12 | Add an abstract SyncableRecord for all offline data, and use GPSLocation everywhere. | It gives uniform offline handling and removes duplicated location data. |
| W13–W15 | Let PatrolController create patrols, add a tracking `loop` with a waypoint `opt`, fix the `alt` divider, and use a `ref` for sync. | This corrects responsibilities and makes the UML valid. |
| W17 | Always save locally first, then sync through a shared "Synchronize Pending Data" sequence diagram. | It is offline-first by design and loses no data. |
| W16, W3 | Use boundary/control/entity lifelines in UC2, push critical incidents to the dashboard automatically, and add a triage/dispatch phase. | It matches the team's style, alerts managers immediately, and covers the full use case. |
| W18 | Add a requirements list or remove the FR refs, drive the loop from configured escalation, and add the SMS fallback. | The diagram then aligns with its scenario and keeps escalation configurable. |
| W19 | Widen the UC4 fragments and add the advisory SMS `opt`. | This gives valid fragments and complete flows. |
| W20, W21 | Use the UC3/UC4 template for all scenarios, and split the manager monitoring flow out of UC1. | Scenarios become consistent and traceable. |
| W22 | Define a structured, multilingual SMS keyword format with an auto-reply. | Parsing becomes reliable, and villagers get feedback. |
| W23, W28 | Add ranger mobile wireframes for each use case with high contrast, 48 dp targets, pick-lists, a sync bar and a language switch. | This designs for the brief's priority user and conditions. |
| W24 | Replace the UC4 wireframes with a CLO review queue, a villager app screen and an SMS help card. | It gives UC4 the UI it currently lacks. |
| W25, W27 | Redraw the UC2 storyboard as mobile field reporting, align low-fi and hi-fi data, and log snares as incidents. | This makes the storyboards and iterations consistent with the brief. |
| W26 | Unify all screens under SWCAMS branding, navigation and persona, and drop the mesh or model it. | It meets the consistency heuristic and matches the design. |
| W29, W30 | Embed legible diagrams, verify links, and proofread the intro. | The submission becomes self-contained and credible. |
