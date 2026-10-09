---
version: alpha
name: WildX
description: Calm, field-ready interface for wildlife operations in Udawalawe National Park — patrols, incidents, sensors, alerts and community reports.
colors:
  primary: "#1F4D43"
  primary-hover: "#173B33"
  on-primary: "#FFFFFF"
  secondary: "#D5EE9B"
  secondary-soft: "#E9F1DA"
  tertiary: "#FF7A59"
  tertiary-deep: "#E8603F"
  neutral: "#FFFFFF"
  surface: "#FFFFFF"
  surface-muted: "#F6F6F3"
  surface-sunken: "#F2F1EE"
  surface-form: "#F7F8F4"
  line: "#E4E7E0"
  line-strong: "#DADDD4"
  ink: "#16201B"
  ink-body: "#3B433E"
  ink-muted: "#6B726C"
  ink-faint: "#9AA19B"
  positive: "#2F7A2E"
  positive-bg: "#E8F6E6"
  positive-line: "#BFE3B9"
  negative: "#B42E22"
  negative-bg: "#FDECEA"
  negative-line: "#F3C1BA"
  responding: "#C2410C"
  butter: "#FCE98C"
  orchid: "#F8D6F3"
  online: "#3DBE6B"
  map-land: "#E6EED9"
  map-ground: "#F4F6EF"
  map-water: "#CFE2E6"
  map-water-label: "#3B6A74"
  track-1: "#1F4D43"
  track-2: "#E8603F"
  track-3: "#6A4FB6"
  track-4: "#A87A00"
typography:
  page-title:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: 600
    lineHeight: 38px
    letterSpacing: -0.02em
  hero-number:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: -0.03em
  metric:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: 500
    lineHeight: 34px
    letterSpacing: -0.02em
  wordmark:
    fontFamily: Geist
    fontSize: 23px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.03em
  card-title:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: 500
    lineHeight: 28px
  form-title:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
  nav:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: 400
    lineHeight: 20px
  body:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  label:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
  field-label:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 500
    lineHeight: 18px
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
rounded:
  xs: 6px
  sm: 8px
  field: 10px
  md: 12px
  lg: 14px
  xl: 18px
  full: 9999px
spacing:
  base: 4px
  space-1: 4px
  space-2: 8px
  space-3: 12px
  space-4: 16px
  space-5: 20px
  space-6: 24px
  space-7: 28px
  sidebar-width: 248px
components:
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: 24px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 0 20px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-small:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 0 18px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 0 16px
  button-quiet:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: 0 12px
  icon-button:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.full}"
    size: 40px
  nav-item:
    backgroundColor: transparent
    textColor: "{colors.ink-body}"
    typography: "{typography.nav}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 0 14px
  nav-item-active:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: 44px
  nav-subitem:
    backgroundColor: transparent
    textColor: "{colors.ink-body}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    height: 38px
    padding: 0 12px
  nav-subitem-active:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: 38px
  count-badge:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    height: 22px
  chip-positive:
    backgroundColor: "{colors.positive-bg}"
    textColor: "{colors.positive}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 2px 6px
  chip-negative:
    backgroundColor: "{colors.negative-bg}"
    textColor: "{colors.negative}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 2px 6px
  chip-neutral:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink-body}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 2px 6px
  chip-done:
    backgroundColor: "{colors.secondary-soft}"
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 2px 6px
  filter-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: 0 12px
  filter-pill-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    height: 32px
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    height: 40px
    width: 280px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    height: 40px
    padding: 0 12px
  schedule-item-patrol:
    backgroundColor: "{colors.butter}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px
  schedule-item-maintenance:
    backgroundColor: "{colors.orchid}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px
  chart-bar:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.lg}"
  chart-bar-highlight:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
  avatar:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    size: 36px
  avatar-small:
    backgroundColor: "{colors.secondary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: 28px
  map-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    width: 340px
    padding: 12px 8px
  map-list-row-selected:
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.md}"
    padding: 12px
  logo-tile:
    backgroundColor: "{colors.primary}"
    rounded: 10px
    size: 34px
---

# WildX

## Overview

WildX is the operations console for a national park team (park managers, rangers, vet unit). It replaces the old SWCAMS screen, which crammed too much onto one page, with a calm, airy layout modelled on modern SaaS dashboards: a white canvas, a left sidebar, and a few large, bordered cards per page.

The personality is **calm, field-ready and specific**. It should feel like a quiet control room, not an alarm panel: one deep green brand colour, one lime "you are here" accent, and a single coral highlight for the thing that needs attention. Copy reads like a ranger's radio call: short, concrete, no filler.

Screens designed so far (`docs/prototypes/`):

- **Dashboard** (`dashboard.html`): park activity metrics, a human–elephant conflict bar chart and the patrol schedule.
- **Patrols · Active** (`active-patrols.html`): a full-bleed live map of teams in the field, with a floating "In the field" list.
- **Patrols · All** (`all-patrols.html`): a filterable table of every patrol, with a New patrol action. The add form opens inline above the table.
- **Patrols · Routes**: the park's patrol routes, with a New route form that draws the path on a map.
- **Patrols · Coverage**: a full-bleed map of sectors, with neglected sectors highlighted and a floating "Sectors" list.
- **Patrol replay**: one completed patrol's track on a map, with a slider that scrubs through it.
- **Analytics · Coverage**: patrol coverage per sector for a date range, as a table with a CSV download.
- **Ranger patrols**: the phone screen behind the ranger's Patrols tab, listing today's patrols.
- **Ranger patrol**: the phone screen for one patrol, with its route map, Start and End, waypoints and the No GPS banner.
- **Ranger mobile app**: the same ranger screens as a native Expo app. Every write goes straight to the server.
- **Sign in** (`sign-in.html`): a bordered xl split card with a park photo panel and the email and password form.
- **Alerts** (`alerts.html`): an alert map, the alert queue with status filters, the selected alert's detail with Acknowledge, Resolve and Dispatch, and the user's notifications.
- **Ranger alerts** (`ranger-alerts.html`): the phone screen behind the ranger's Alerts tab, with the park's open alerts, large Acknowledge and Resolve buttons, and the ranger's notifications.
- **Devices** (`devices.html`): every collar and camera trap of the park with its health, and inline forms to register an animal or a device.
- **Simulator** (`simulator.html`): the demo tool that sends test collar fixes and camera images through the real ingest, in place of real hardware.
- **Camera traps** (`camera-review.html`): the image review queue grouped into bursts, the selected image with its tag form, and the reason prompt for a restricted image.
- **Zones and rules** (`zones.html`): the park's high-risk zones on a map and in a list, the inline zone form with a GeoJSON boundary, and the alert rule for each zone type.
- **Alert report** (`alert-report.html`): alert counts by type and zone with the median times to acknowledge and resolve for a date range, and a CSV download.

### Voice

- Lead with the thing, then the detail, joined by a middle dot: `Night patrol · Hambegamuwa`, `K. Bandara · 2 min ago`.
- Use 24-hour times (`19:00 – 23:00`) and write dates as `8 Oct, 2026` or `Fri, 9 Oct`. Use numerals for counts.
- Status words say what the state means for the user: "On schedule", "1 offline", "Overdue", "Responding".
- Sentence case everywhere. No exclamation marks, no emoji.

## Colors

The palette is mostly white and ink, with green as the identity and very little else.

- **Primary — Pine `#1F4D43`.** The brand. It fills the primary button, the logo tile and the avatar, and is the first patrol track on the map. White text on it. Hover is `#173B33`.
- **Secondary — Lime `#D5EE9B`.** "You are here": the active nav pill (ink text on it) and the leaves of the logo. Lime soft `#E9F1DA` marks today in calendars and fills "Completed" chips and initials avatars.
- **Tertiary — Coral `#FF7A59`.** The single highlight per card: one chart bar, the alert count badge, the notification dot. Never decoration. White text on coral is only 2.6:1, so labels on it stay 12px+ semibold, or use ink. Coral deep `#E8603F` is the 6px lip under the highlighted bar.
- **Neutrals.** `surface` white for page, sidebar, header and cards. `surface-muted #F6F6F3` for quiet controls inside cards. `surface-sunken #F2F1EE` for inactive chart bars, kbd hints and the selected list row. `surface-form #F7F8F4` behind inline forms. `line #E4E7E0` for every 1px border, and `line-strong #DADDD4` for input borders and the sub-nav guide.
- **Ink.** `ink #16201B` for headings and values. `ink-body #3B433E` for nav links and descriptions. `ink-muted #6B726C` for captions, counts and placeholders (4.8:1 on white). `ink-faint #9AA19B` only for the denominator in "12/13" and the average line.
- **Status.** Each chip uses a text, background and border trio:
  - positive `#2F7A2E / #E8F6E6 / #BFE3B9` for good news ("On schedule", "Active");
  - negative `#B42E22 / #FDECEA / #F3C1BA` for anything that needs action ("1 offline", "Overdue").
  - In compact lists, status is a 7px dot plus a coloured word: positive "On route", responding `#C2410C` "Responding", negative "Overdue".
- **Categories.** Butter `#FCE98C` for patrol items and orchid `#F8D6F3` for maintenance and vet work in the schedule. Both have a white icon tile and ink text.
- **Presence.** `online #3DBE6B` is only for the avatar dot and the pulsing "Live" dot. Never use it as text.
- **Map.** An OpenStreetMap base layer on ground `#F4F6EF`. Sectors and zones are drawn over it at 35% fill so the base map shows through: park land `#E6EED9` inside a dashed pine boundary, high-risk zones in `negative-bg` with a dashed `negative` outline. Patrol tracks use `track-1…4` (pine, coral deep, violet `#6A4FB6`, ochre `#A87A00`). Each track is always paired with a numbered marker, so colour is never the only cue.

## Typography

**Geist** (Google Fonts, weights 400/500/600/700) is the only typeface, with `system-ui` as the fallback.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| page-title | 32 / 38, −0.02em | 600 | One per page: "Dashboard", "Active patrols" |
| hero-number | 36 / 40, −0.03em | 600 | The headline figure of a chart card |
| metric | 28 / 34, −0.02em | 500 | Metric strip values |
| wordmark | 23 / 28, −0.03em | 600 | "WildX" next to the mark |
| card-title | 20 / 28 | 500 | Card headings. Never bold |
| form-title | 16 / 24 | 600 | Inline form heading |
| nav | 15 / 20 | 400 (500 active) | Sidebar items, page subtitle |
| body | 14 / 20 | 400 | Default text, table cells, sub-nav |
| label | 14 / 20 | 500 | Buttons, list item names |
| field-label | 13 / 18 | 500 | Form labels, quiet buttons, filter pills |
| caption | 12 / 16 | 400 | Meta lines, chips, counts, column headers |

Page subtitles are 15px `ink-body`, with the key figure in a 600-weight `ink` span: "**4 teams** in the field."

## Layout

- **Shell.** A 248px sidebar with a 1px `line` right border, then a fluid column holding a top bar and the main area. From 768px up the sidebar is sticky and exactly one viewport tall: its nav scrolls on its own when it runs out of room, so the user card stays pinned and visible at the bottom on a laptop screen. Below 768px the two stack, with the sidebar above.
- **Top bar.** 16px × 28px padding, bottom border, a 280px search field with a `⌘ K` hint on the left, and 40px circular icon buttons (Help, Notifications) on the right. There is no user menu here: the user lives at the bottom of the sidebar.
- **Main.** Padded `space-7` (28px), with a `space-5` (20px) gap between blocks. It fills the full width of the column, with no max-width cap, so wide screens are not left with empty space on the right. The Active patrols map page also lets the map grow to fill all remaining height (minimum 640px).
- **Page header.** Title and subtitle on the left, the primary action (48px button) on the right.
- **Cards.** Padded 22px × 24px, with an 18px gap inside. Rows of cards use flex-wrap with weighted bases (e.g. `3 1 420px` beside `2 1 340px`) so they reflow to one column without breakpoints.
- **Metric strip.** An auto-fit grid of 180px-minimum cells, split by 1px `line` dividers under a top rule.
- **Tables.** CSS grid rows (`1.7fr 1.4fr 1.1fr 0.9fr 0.9fr 36px` for patrols) with 12px row padding and `#F0F1EC` row dividers. They scroll horizontally below 760px.
- **Forms.** An auto-fit grid of 200px-minimum fields with a 16px gap. Actions are right-aligned.
- **Spacing scale.** 4 · 8 · 12 · 16 · 20 · 24 · 28px on a 4px base.

## Elevation & Depth

WildX is flat. Depth comes from 1px `line` borders and white space, not shadows or tinted page backgrounds.

- Cards, inputs, controls and the sidebar all use a 1px border with no shadow.
- The **only shadow** is on floating elements: the "In the field" panel over the map and the modal both use `0 8px 24px rgba(22, 32, 27, 0.08)`. Legend and zoom controls over the map use a border only.
- The highlighted chart bar gets a solid `0 6px 0` coral-deep lip, which reads as a raised tab rather than a blur.
- Map markers sit on a 3px white stroke. A selected track gets a 5px stroke, full opacity and an 18px halo at 20% of its colour; unselected tracks drop to 3px at 50%.

## Shapes

Corners are soft and consistent by size. The bigger the element, the rounder the corner.

| Token | Radius | Use |
|---|---|---|
| xs | 6px | Status chips, kbd hint |
| sm | 8px | Quiet buttons, filter pills, calendar arrows, zoom group |
| field | 10px | Inputs, search, sub-nav items, map legend, logo tile |
| md | 12px | Buttons, nav pills, schedule items, list rows |
| lg | 14px | Chart bars, map panel, inline form |
| xl | 18px | Cards, the map container |
| full | 9999px | Avatars, top-bar icon buttons, count badges, status dots |

**Iconography.** Outline icons on a 24px grid, drawn at 18–20px (14px in small controls), 1.8px stroke with round caps and joins, in `currentColor`. They are Lucide-style.

**Logo.** A 34px pine tile (10px radius) holding two crossing lime leaves that form an X. The second leaf is at 60% opacity so the overlap reads. The wordmark is "Wild" in ink and "X" in pine, set in Geist at `wordmark`.

## Components

- **Sidebar.**
  - Order: logo, then the park switcher (bordered 12px button: map icon tile, "Udawalawe NP / 30,821 ha", chevron), then the nav, then the user card pinned to the bottom above a top border (pine avatar with lime initials and an online dot, the signed-in user's name and role, up/down chevron).
  - Clicking the user card toggles a "Log out" row directly above it: a 44px pill with a 20px log-out icon in `ink-body`, `surface-muted` on hover. Logging out returns to Sign in.
- **Ranger header.** The logo on the left and a 40px circular "Log out" icon button on the right.
  - Nav items are 44px pills with a 20px icon and 12px gap. The active item gets the lime fill and 500 weight.
  - Expandable groups (Patrols → Active patrols, All patrols, Routes, Coverage; Sensors → Collars, Camera traps) are buttons that expand and collapse their children on click, with a chevron pointing up when open and down when closed. Groups start open. Their children are indented 24px behind a 1px `line-strong` guide, as 38px items with a right-aligned muted count. The active child gets the lime pill, and its parent turns ink at weight 500.
  - Alerts carries a coral count badge.
  - Users (people icon) is the last item and only Park managers see it.
- **Buttons.**
  - Primary: pine, 48px tall in page headers, 40px in forms, with a leading plus icon for create actions.
  - Secondary: white with a `line` border.
  - Quiet: 32px `surface-muted` with a border, for Today, Filter, Full map and more-options.
  - Icon-only buttons always have an `aria-label`.
- **Modal.** Create and edit forms that open from a page header button (New route, Edit route, New user, Edit user) open in a modal, not inline. It is a native dialog centred over a backdrop of `ink` at 40%: white, lg radius, 24px padding, the floating shadow, full width up to 640px (560px for forms without a map) with a 16px gap to the screen edge, and scrolls inside when taller than the screen. A `form-title` heading sits top-left with a 32px quiet close (X) button top-right. Esc, the close button and Cancel close it; clicking the backdrop does not, so typed input is not lost. Focus moves into the modal and returns to the opening button.
- **Status chip.** Caption text, 2px × 6px padding, xs radius, with the tinted fill, border and text trio. Variants: positive, negative, neutral (Scheduled), done (Completed).
- **Metric cell.** A body-size label, then a `metric` value with an optional chip beside it.
- **Bar chart.** Six rounded bars in `surface-sunken` with the value inside at the top. One coral highlighted bar. A dotted `ink-faint` average line with a pine "Avg 6" tag. Month labels underneath, with the highlighted month in ink 600.
- **Schedule.** A week strip (today in a lime-soft circle), dashed day dividers, and butter or orchid items with a white 34px icon tile, a title, "time · owner", and a more button.
- **Live map (Active patrols).**
  - The map fills the card edge to edge.
  - Floating on top: the **In the field** panel top-right (340px, white, lg radius, the one shadow), the legend bottom-left (team position, track, incident, park boundary) and zoom +/− bottom-right.
  - Each panel row has a 24px numbered marker in the track colour, the patrol name (label), "leader · last ping" (caption, muted) and a status dot + word. The selected row uses the `surface-sunken` fill.
  - Incidents are red triangles with a white "!". An overdue team gets a dashed red ring around its marker.
  - A pulsing green **Live** chip sits next to the page title.
- **Incident queue.**
  - The incident queue card (`3 1 420px`) sits beside the incident detail card (`2 1 340px`), like the Alerts page; on a phone the detail drops below the queue.
  - Filter pills (New / Assigned / Resolved / Dismissed / All with counts) and Type and Severity pick-lists sit above the table. Columns: Incident (type name over the `INC-` code), Sector, Reported by, Reported, Severity chip and Status chip. Rows are grouped by status (New, Assigned, Resolved, Dismissed), newest reported first within each group. Under the status chip a muted caption (up to 2 lines, full text on hover) says who it was dispatched to ("To K. Bandara") while Assigned, the outcome once Resolved, or the reason once Dismissed. The table refreshes after each triage action. The table scrolls inside the card (at most 60% of the screen height) with its header row pinned, so the page itself does not scroll with it.
  - Selecting an incident's name selects its row (`surface-sunken` fill) and shows it in the detail card without leaving the page. Without a selection the card says "Select an incident to triage it."
  - The detail card has the incident title with its status chip and a 32px quiet Close button, the subtitle as a muted caption, then the triage block (Severity pick-list, Dispatch responder primary 40px and Dismiss incident secondary, or "This incident is closed."), the 280px location map and the incident facts with the photo.
  - The same card also renders on its own page (`/dashboard/incidents/{id}`) under an "Incidents" back link, for direct links.
  - The facts include **Coordinates** as "6.3800, 81.4800" (latitude, longitude, 4 decimals, like camera locations).
- **Incident maps** (location picker, incident detail, ranger dispatch and the incident report map) use the shared OpenStreetMap base layer (see Map) under the incident markers, with no sector outlines (the map still frames the park's sectors). On the report form, the picked point's coordinates show as a muted caption under the location hint.
- **Patrols table (All patrols).**
  - Filter pills (All / Active / Scheduled / Completed with counts; the active pill is ink-filled).
  - Columns: Patrol (route name + `PT-` ID), Leader (28px initials avatar + ranger name), Schedule (day, then the actual start – end time once started), Distance (covered km for completed patrols, with the duration as a muted caption below, e.g. "6.4 km" over "2 h 15 min"; otherwise —), Status chip (Active positive, Scheduled neutral, Completed done, Cancelled neutral), and a more-options button.
  - On a completed patrol the more-options button opens its replay. On other rows it is disabled.
- **Patrol replay.**
  - The title is the route name, with "PT-12 · K. Bandara · 8 Oct, 2026" as the subtitle and All patrols as a secondary link on the right.
  - A fact row in a card: Distance, Duration and Time ("06:10 – 08:25"), using the metric cell.
  - The map card (minimum 480px) shows the full track in `track-1` at 3px and 50%, plus the walked part up to the scrub point at 5px and full opacity. A numbered team marker sits at the scrub point. Waypoints are 18px white circles with a pine flag icon, and their note or type shows as a tooltip.
  - Under the map: a full-width range slider (pine thumb, `line-strong` track) with the scrub time at the left ("07:42") and the end time at the right.
  - A **Waypoints** list follows: "07:15 · Checkpoint · Waterhole clear" rows (time, type or "Waypoint", note), or "No waypoints on this patrol."
  - A patrol without track points shows "No track recorded for this patrol." in place of the map.
- **Routes.**
  - The subtitle counts the routes: "**3 routes** in this park." Managers get New route (primary 48px with a plus icon).
  - A table with grid rows (`2fr 1fr 1fr 80px`): Route (name), Length (km from the path), Points (how many path points it has) and, for managers, 32px quiet Edit and Delete icon buttons.
  - Edit opens the route form as a modal titled "Edit Kumbukgaha river trail" with the saved name and path, and Save changes in place of Create route.
  - Delete asks first: "Delete Kumbukgaha river trail? It can no longer be assigned. Past patrols keep it." The route then leaves the table.
  - **New route form**: a modal titled "New route". It has a Name field, then a 360px lg-radius map. Each click on the map adds a numbered path point, and the path is drawn in `track-1`. Undo and Clear quiet buttons sit above the map, with a muted "4 points · 2.1 km" caption. A Paste GeoJSON quiet button swaps the map for a textarea that takes a LineString. A missing name, or fewer than 2 points, is outlined in negative red with a caption. A server error shows in negative red above the buttons. Cancel and Create route are right-aligned.
- **Coverage.**
  - The subtitle counts neglected sectors: "**2 sectors** not patrolled for more than 7 days." (or "Every sector patrolled in the last 7 days.")
  - A full-bleed map like Active patrols. Sectors are filled with park land. A neglected sector is drawn like a high-risk zone (`negative-bg` fill with a 1.5px dashed `negative` outline), with its name as a label.
  - Floating top-right: a **Sectors** panel built like In the field. It lists neglected sectors first. Each row shows the sector name (label), "Last patrolled 30 Sep, 2026" or "Never patrolled" (caption, muted) and a status dot + word: negative "9 days", or positive "Today" or "2 days". Selecting a row zooms to the sector and uses the `surface-sunken` fill.
  - The legend sits bottom-left (Patrolled, Neglected, park boundary), with zoom +/− bottom-right.
- **Coverage report (Analytics).**
  - A third tab, Coverage, sits after Incidents and Conflicts. Its layout matches the Conflicts report: the title "Patrol coverage report", a subtitle with "**12 patrols** visited 4 of 6 sectors in this range.", Download CSV (primary) on the right, then From and To date fields.
  - One card holds a table: Sector, Track points, Patrols and Last visit ("Today · 07:42" or —). Sectors with 0 patrols show the count in negative red. An empty range says "No patrols recorded in this range."
- **Ranger patrols (phone).**
  - It sits in the ranger layout (Patrols tab active) and follows the mobile rules of Ranger alerts.
  - The subtitle reads "**2 patrols** today." (or "No patrols assigned for today.")
  - Each patrol is a card that works as a button: the route name (label), "Today · 06:00 start" or "06:10 – 08:25" once started (caption, muted) and a status chip (Scheduled neutral, Active positive, Completed done). An active patrol comes first. Tapping a card opens Ranger patrol.
- **Ranger patrol (phone).**
  - The title is the route name, with the status chip as a badge and "Today · K. Bandara" as the subtitle.
  - When GPS is lost during an active patrol, a **No GPS** banner sits under the header: a full-width lg-radius block in the negative trio with a satellite-off icon, "No GPS. Your patrol is still running." and a muted "Tracking resumes when the signal returns." line.
  - A 360px xl-radius map shows sectors, the planned route as a dashed `track-1` line, the walked track in solid `track-1`, waypoints as flag circles and the ranger's own position as the numbered team marker.
  - Under the map is a fact list: Started, Last point ("07:42 · 12 points sent") and Distance.
  - Stacked full-width 48px buttons. A scheduled patrol has Start patrol (primary). An active patrol has Add waypoint (primary), Report incident (secondary, opens the incident form) and End patrol (secondary). A completed patrol has no actions, only a positive "Patrol completed at 08:25." line.
  - Add waypoint opens an inline panel on `surface-form`, titled "Add waypoint" with the muted caption "Tap the map to choose the location." A 280px xl-radius map (like the incident location map) shows the waypoint as a flag circle, starting at the ranger's current position; tapping the map moves it. Without GPS and before a tap, the caption is negative: "Waiting for GPS. Tap the map to choose the location." and Save waypoint is disabled. It has an optional Type pick-list (Checkpoint, Observation, Rest, Other) and an optional Note textarea. Save waypoint and Cancel are stacked full width. After saving, a positive "Waypoint saved at 07:15." line shows.
  - End patrol asks for confirmation in place: "End this patrol now?" with End patrol (primary) and Keep going (secondary).
  - A failed action shows the server's message in negative red under the buttons.
- **Sign in.**
  - A centred card (max 1120px, xl radius, 12px padding, `line` border) that wraps into two equal panels and stacks on phones.
  - Left: a lg-radius photo panel with a `page-title` tagline at the top and a white xs-radius "Udawalawe NP · 30,821 ha" location chip at the bottom.
  - Right: a 380px form with the logo, a "Sign in" `page-title` and a 15px `ink-body` subtitle, a `line` divider, Work email and Password fields ("Forgot password?" link beside the password label), a "Keep me signed in on this device" checkbox in pine, a full-width 48px primary button and a centred muted "Accounts are created by your park manager." line. There is no self sign-up.
  - A focused input gets a pine border and a 3px `lime-soft` ring. A failed sign-in shows a negative caption above the button.
- **New patrol form.**
  - An inline panel on `surface-form` with an lg radius, a "New patrol" title and a close button.
  - Fields: route (pick-list), date, then a full-width Rangers field: the park's rangers as a wrapping row of checkboxes in pine, one per ranger name. Missing fields are outlined in negative red with a caption below ("Choose at least one ranger").
  - Cancel and Create patrol buttons, right-aligned. With more than one ranger checked the button reads "Create 3 patrols", one per ranger.
- **Alerts page.**
  - A pulsing **Live** chip sits next to the title. The subtitle counts open alerts and those escalated past their acknowledge time. Zones and rules and Report are secondary buttons on the right; there is no primary action, because sensors raise alerts.
  - The alert map is a 360px card in `map-ground`. High-risk zones are drawn in `negative-bg` with a 1.5px dashed `negative` outline. Each listed alert has a 24px numbered marker on a 3px white stroke, in its status colour; the selected marker gets the 18px halo. The legend sits bottom-left (Open, Acknowledged, Resolved, High-risk zone); the map zooms by scroll or pinch, with no zoom buttons. The map shows only the alerts in the current filter.
  - Below the map, the alert queue (`3 1 420px`) sits beside a column (`2 1 340px`) holding the alert detail and the notifications.
  - The queue has filter pills (Open, Acknowledged, Resolved, All with counts; Open by default) and lists alerts newest first. Each row is a button: the numbered marker, a "Type · zone" title (or "Type · device code" without a zone), a "Gemunu (COL-001) · Today · 22:05" caption, a severity chip (High and Critical negative, Low and Medium neutral) and a status dot + word. The selected row uses the `surface-sunken` fill.
  - Status words and colours: Open and Escalated (open and escalated at least once) in negative, Acknowledged in responding, Resolved in positive.
  - The alert detail card shows the title as `card-title`, the severity chip and status, then a fact list: Device, Occurred, Acknowledge by (with "overdue" once passed), Escalation ("Escalated 1 time"), Acknowledged (name · time) and Resolved (time · outcome). Without a selection it says "Select an alert to see its detail."
  - Rangers and managers get Acknowledge (primary, 40px) while the alert is open and Resolve (secondary) until it is resolved. Managers also get Dispatch ranger (secondary), which opens the shared dispatch form inline; after dispatching, a positive "Dispatched to K. Bandara." line replaces the form. A failed action shows the server's message in negative red under the buttons or in the form. A resolved alert has no actions.
  - A Human detected alert also shows View image (secondary, with a camera icon) under its facts for managers, even once resolved. It opens Camera traps on the All filter with that image selected, where a restricted image still asks for a reason.
  - The resolve form is an inline panel on `surface-form` with an lg radius and a "Resolve alert" `form-title`. The four outcomes (Conflict averted, Conflict occurred, No action required, False alarm) are 48px radio rows; the checked row gets a pine border and the lime-soft ring. A missing choice is outlined in negative red with a caption. Cancel and Resolve alert are right-aligned.
  - The notifications card has a "Notifications" `card-title` with a coral count badge for unread ones (hidden at 0). Each row shows the title (600 and ink when unread, with a pine dot and the word "New"), the body in `ink-body` and the time as a muted caption. Selecting a row marks it read and opens its link.
- **Ranger alerts (phone).**
  - It sits in the ranger layout (logo header, Alerts tab active in the bottom nav) and follows the mobile rules: 48px tap targets, 16px card padding, pick-lists and full-width 48px action buttons.
  - The subtitle counts open and acknowledged alerts: "**1 open**, 1 acknowledged."
  - The **Open alerts** card comes first and lists every open or acknowledged alert of the park, newest first; resolved alerts are left out. Each row shows the same title, caption, severity chip and status dot + word as the dashboard queue, without the number. Without alerts it says "No open alerts. You will be notified when one is raised."
  - Tapping a row opens it in place on the `surface-sunken` fill: a fact list (Occurred, Acknowledge by, Acknowledged) and stacked full-width buttons: Acknowledge (primary) while open, Resolve (secondary) until resolved, and Open in maps (secondary with a map icon), which opens the alert position in Google Maps in a new tab. Tapping the row again closes it.
  - Resolve opens the same outcome form as the dashboard, with Resolve alert and Cancel stacked full width. A failed action shows the server's message in negative red.
  - The **Notifications** card follows, the same as on the dashboard.
- **Ranger mobile app (Expo).**
  - It renders the ranger phone screens above (Ranger patrols, Ranger patrol, Report incident, Tasks, Ranger alerts) natively with the same tokens, Geist weights, copy and mobile rules. Nothing on it uses a colour, radius or size that is not in this file. The status bar area is white with dark icons.
  - **Header.** The Ranger header: logo left, 40px circular Log out icon button right, 16px × 12px padding, a 1px `line` bottom border.
  - **Writes.** Every action is sent to the server straight away. While sending, Submit report, Save waypoint, Start patrol and End patrol read "Submitting…", "Saving…", "Starting…" and "Ending…" and are disabled. On success a positive line confirms it ("Incident reported.", "Waypoint saved at 07:15.", "Acknowledged.", "Completed.", "Declined.", "Alert resolved."). On failure the server's message, or "Could not reach WildX. Try again." without a connection, shows as a negative notice and any form keeps what was typed.
  - **Offline incident reports.** When Submit report cannot reach the server, the form clears and the positive line reads "Saved on this phone. It will be sent when you're back online." A **Waiting to send** card then sits at the top of the Report screen, under the page header, and is hidden when nothing waits. Its title is "Waiting to send (2)". Each row is like a task row: the incident type as the label, a muted caption "Saved 07:42", and a neutral "Waiting" chip. A report the server refused shows a negative "Not accepted" chip, the server's message as a negative caption under it, and a 48px full-width secondary Discard button.
  - **Bottom nav.** Four equal tabs (Patrols, Report, Tasks, Alerts) over a 1px `line` top border on `surface`: each 48px minimum, a 20px icon over a `caption` label, 6px margin. The active tab gets the lime pill (md radius) with ink text at 500. Alerts carries the coral count badge (unread notifications) at the icon's top right, hidden at 0.
  - **Pick-lists.** A pick-list looks like an input (48px on ranger screens, field radius, `line-strong` border, a chevron-down icon right, muted placeholder "Choose a type"). Tapping it opens a modal from the bottom: white, lg radius, 16px gap to the screen edges, 16px padding, the floating shadow, over an `ink` 40% backdrop, with a `form-title` heading and the options as 48px choice rows (the checked row gets the pine border and lime-soft ring). Tapping a row picks it and closes the modal.
  - **Photo field.** A 48px full-width secondary button with a camera icon, "Take photo". Once taken, the photo shows at 4:3 in an lg-radius frame with Retake and Remove quiet buttons under it.
  - **Maps.** The same OpenStreetMap base layer, markers and track colours as the web, in an xl-radius bordered frame: 360px on Ranger patrol, 280px for the incident location and the dispatch location. Tapping the incident map moves the marker.
  - **Sign in.** The Sign in card stacks on the phone: the photo panel first (220px tall, lg radius, tagline and location chip), then the form. "Forgot password?" shows the muted line "Ask your park manager to reset it." under the password field. A user who is not a ranger gets the negative caption "This app is for rangers. Use the WildX web console." above the button.
- **Devices.**
  - The sidebar's Sensors → Collars item opens it. The subtitle counts collars and cameras and how many need attention: "**3 collars** and 2 cameras, 2 need attention." (or "all healthy" when none do).
  - Managers get Simulator (secondary link), New animal (secondary) and New device (primary 48px with a plus icon) on the right. Other roles only read the page.
  - Filter pills: All, Collars, Cameras with counts.
  - The table uses grid rows (`1.2fr 1.6fr 0.9fr 0.7fr 1.1fr 1fr`) and scrolls horizontally below 760px. Columns: Device (code, then "Collar" or "Camera" as a muted caption), Animal or location (animal name over its species for a collar, "6.3100, 81.4100" over "Camera location" for a camera), Reports every ("60 min"), Battery ("82%" or —), Last seen ("Today · 22:05" or "Never") and a Health chip.
  - Health chips: Reporting (positive); Low battery (negative, below 15%); Not reporting (negative, nothing for more than 3 × the reporting interval); No data yet (neutral, never reported).
  - New device and New animal open inline panels above the table, like the New patrol form, one at a time. New device asks for Type (pick-list), Code, Reports every (minutes, 1–10080), then Animal (pick-list of the park's animals) for a collar or Latitude and Longitude for a camera. When the park has no animals yet, a muted caption says "No animals yet. Add one with New animal first." New animal asks for Name and Species. Missing or invalid fields are outlined in negative red with a caption; a server error (such as a code already in use) shows in negative red above the buttons. Cancel and Register device (or Add animal) are right-aligned.
- **Simulator.**
  - Managers open it from the Devices page; it has Devices and Alerts as secondary links on the right. The subtitle says it sends test data through the real ingest.
  - Two cards side by side: Collar fixes (`3 1 420px`) and Camera images (`2 1 340px`).
  - Collar fixes: a Collar pick-list ("COL-001 · Gemunu") and the six scenarios as 48px radio rows with a muted one-line explanation each (Walk into zone, Night walk into zone, Single fix, Low battery, Not moving, Duplicate fix). The two walks show a Zone pick-list ("Kumbukgaha farmland · Farmland"); the other four show Latitude and Longitude fields. Send fixes is a 40px primary button.
  - Camera images: a Camera pick-list, an Images pick-list (1–10), a muted line explaining the burst, and Send images.
  - Without collars or cameras, a muted caption says "No collars yet. Register one on the Devices page." (or cameras). Other roles see "Only park managers can use the simulator."
  - After sending, a positive line beside the button reports the result: "Sent 6 fixes · 6 stored · 0 duplicates." or "Sent 3 images · 3 stored." Errors show in negative red in the same place.
- **Camera traps.**
  - The sidebar's Sensors → Camera traps item opens it. Managers can use it; other roles see "Only park managers can review camera images."
  - The subtitle counts the work: "**4 images** to review in 2 bursts." Managers get Simulator as a secondary link on the right.
  - The image queue (`3 1 420px`) sits beside the review card (`2 1 340px`). Filter pills: To review (the default), Tagged, Empty, Unidentifiable, Restricted and All, with counts.
  - Each burst has a "CAM-001 · Today · 21:40 – 21:42" label (one time for a single image) and a muted "3 images in 1 min" or "1 image" caption, then a grid of 4:3 image tiles (140px minimum) with the capture time and a status chip. The selected tile gets a 2px pine border and the lime-soft ring. A restricted tile never loads its picture: it shows a lock icon and "Restricted" in negative red on `surface-sunken`.
  - Status chips: To review (neutral), Tagged with the species and count, e.g. "Asian elephant · 2" (positive), Empty (neutral), Unidentifiable (neutral), Restricted (negative).
  - Without a selection the review card says "Select an image to review it." With one, it shows "CAM-001 · Today · 21:41" as `card-title`, the status chip, the image at 4:3 in an lg-radius frame, and a fact list: Camera, Captured (with seconds) and Reviewed (name · time, or —).
  - Managers get the **Tag image** panel on `surface-form`: "What is in the image?" with four 48px radio rows that each carry a muted explanation (Animals, Empty, Unidentifiable, Restricted). Animals adds Species and Count (1 or more) fields. The current tag is pre-selected, so re-tagging is allowed. Missing fields are outlined in negative red. Save tag is a 40px primary button; after saving, a positive "Saved." line appears and the tile chip updates.
  - A restricted image shows the lock placeholder instead of the picture and a **View restricted image** panel: a line saying every view is written to the audit log with your name, the time and the reason, a required Reason field ("Enter a reason") and View image. The picture then appears in place for that visit only; selecting it again asks again.

- **Zones and rules.**
  - It opens from Zones and rules on the Alerts page and from the sidebar's Settings → Zones and rules. Every staff role can read it; only managers get the actions. The subtitle counts the zones and the zone types that raise alerts: "**2 zones**, 3 of 4 zone types raise alerts." Managers get Alerts (secondary link) and New zone (primary 48px with a plus icon) on the right.
  - The zone map is a 360px card in `map-ground`, drawn like the Alerts map: every zone in `negative-bg` with a 1.5px dashed `negative` outline. The selected zone, or the outline being typed in the zone form, is drawn in pine at 12% fill with a 2px dashed pine outline, and the map fits to it. The legend sits bottom-left (High-risk zone, Selected or new zone); the map zooms by scroll or pinch, with no zoom buttons.
  - Below the map, the Zones card (`3 1 420px`) sits beside the Alert rules card (`2 1 340px`).
  - Each zone row is a button with the name (label), a "Farmland · 5 corners" caption and its type's rule as a severity chip plus "Acknowledge within 15 min", or a muted "No alert rule" when the type has none. Severity chips: High and Critical negative, Low and Medium neutral. Selecting a row uses the `surface-sunken` fill and highlights the zone on the map; selecting it again clears it. Managers get 32px quiet Edit and Delete icon buttons beside each row. Without zones it says "No zones yet."
  - New zone and Edit open an inline panel above the map, like the New patrol form, titled "New zone" or "Edit Kumbukgaha farmland": Name, Type (pick-list: Farmland, Road, Village buffer, Restricted) and a full-width Boundary (GeoJSON polygon) text area in a monospace font, with the muted caption "Longitude, latitude pairs. The last corner repeats the first. The outline shows on the map as you type." Missing or invalid fields are outlined in negative red with a caption ("Enter a name", "Paste a closed GeoJSON polygon"); a server error shows in negative red above the buttons. Cancel and Create zone (or Save changes) are right-aligned.
  - Delete asks first: "Delete Kumbukgaha farmland? Collars inside it will no longer raise alerts." A zone that already has alerts cannot be deleted, and a negative line says "Kumbukgaha farmland has alerts, so it cannot be deleted."
  - The Alert rules card has the muted caption "One rule per zone type. Breaches between 18:00 and 06:00 go up one level." and one row per zone type (Farmland, Road, Village buffer, Restricted): the type (label) with its severity chip over a "Cool-down 30 min · acknowledge within 15 min" caption, or "No rule, so these zones raise no alerts." Managers get a quiet Edit (or Add rule) button.
  - Edit and Add rule open the rule form in place of the row, one at a time, on `surface-form` with a "Village buffer rule" `form-title`: Severity (pick-list: Low, Medium, High, Critical), Cool-down (minutes, with the caption "0 to 1440. 0 raises an alert for every breach.") and Acknowledge within (minutes, 1 to 1440). Invalid numbers are outlined in negative red with "Enter 0 to 1440 minutes" or "Enter 1 to 1440 minutes". Remove rule (secondary with negative text, only for an existing rule, after a confirmation) sits on the left; Cancel and Save rule on the right. A server error shows in negative red above the buttons.

- **Alert report.**
  - The Analytics → Alerts tab opens it, after Incidents and Conflicts, and the Report button on the Alerts page links to it. Managers and researchers can use it; other roles see "Only park managers and researchers can see the alert report."
  - The subtitle counts the alerts: "**12 alerts** raised in this range." Download CSV (primary 48px with a download icon) is on the right; it downloads the server's CSV, with the ALL totals row first.
  - From and To date fields sit under the header, like the Incident report, covering the last six months by default. A reversed or empty range shows the error in negative red and loads nothing.
  - The Summary card has a muted caption "Times run from when each alert was raised, and count only alerts that got that far." and a metric strip: Alerts raised, Median time to acknowledge and Median time to resolve. Times show as "8.5 min" under an hour and "1.4 h" from an hour up, or "—" when no alert has the value yet.
  - The By type and zone card has a grid table (`1.2fr 1.6fr 0.7fr 1fr 1fr`) that scrolls horizontally below 640px: Alert type, Zone ("No zone" in muted text for device health, mortality and human detected alerts), Alerts, Median to acknowledge and Median to resolve, highest count first. Without alerts it says "No alerts raised in this range."

- **Users.**
  - The sidebar's Users item opens it, for Park managers only; other roles see "Only park managers can manage users." It lists the users of the manager's own park.
  - The subtitle counts the accounts: "**8 users**, 1 deactivated." New user (primary 48px with a plus icon) is on the right.
  - One card holds a grid table (`1.4fr 1.6fr 1.2fr 0.8fr 180px`) that scrolls horizontally below 760px: Name (with the phone as a muted caption, or none), Email, Role ("Park manager"), a Status chip (Active positive, Deactivated neutral) and 32px quiet Edit and Deactivate buttons. A deactivated user gets Edit only. The signed-in manager's own row has no Deactivate. Active users come first, then by name.
  - New user and Edit open a modal titled "New user" or "Edit K. Bandara": Name, Email, Phone (optional), Role (pick-list) and Password. New users join the manager's park. On edit the password is optional, with the muted caption "Leave blank to keep the current password.", and an "Active · can sign in" checkbox in pine. Missing or invalid fields are outlined in negative red with a caption ("Enter a name", "Enter a valid email", "Use at least 8 characters"); a server error (such as an email already in use) shows in negative red above the buttons. Cancel and Create user (or Save changes) are right-aligned.
  - Deactivate asks first: "Deactivate K. Bandara? They will no longer be able to sign in." Their history stays, and Edit can make them active again.

## Do's and Don'ts

- **Do** keep everything on white and separate with 1px `line` borders. **Don't** add drop shadows to cards or tint the page background.
- **Do** use at most one coral element per card. **Don't** use coral for decoration or for a second "important" thing.
- **Do** reserve lime for "where you are" (active nav, today). **Don't** use it as a button colour.
- **Do** keep card titles at weight 500. **Don't** bold them.
- **Do** pair every colour cue with a number, icon or word (track markers, status dots + text). **Don't** rely on colour alone.
- **Do** keep pages focused: one job per page, as with Active vs All patrols. **Don't** stack unrelated widgets or cram live detail (progress bars, IDs, vehicles) into compact lists.
- **Do** keep white text off coral unless it is 12px+ semibold. **Don't** use `online` green or `ink-faint` for readable text.
- **Do** write short, specific copy with middle-dot joins and 24-hour times. **Don't** use emoji, exclamation marks or title case.
- **Do** design each screen and state as its own static artboard. **Don't** build in-page interactivity into the design files.
