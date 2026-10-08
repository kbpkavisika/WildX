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
- **Sign in** (`sign-in.html`): a bordered xl split card with a park photo panel and the email and password form.
- **Alerts** (`alerts.html`): an alert map, the alert queue with status filters, the selected alert's detail with Acknowledge, Resolve and Dispatch, and the user's notifications.

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
- **Map.** Ground `#F4F6EF`, park land `#E6EED9` inside a dashed pine boundary, water `#CFE2E6` with labels in `#3B6A74`, roads as 5px white strokes. Patrol tracks use `track-1…4` (pine, coral deep, violet `#6A4FB6`, ochre `#A87A00`). Each track is always paired with a numbered marker, so colour is never the only cue.

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
- The **only shadow** is on elements floating over the map: the "In the field" panel uses `0 8px 24px rgba(22, 32, 27, 0.08)`. Legend and zoom controls over the map use a border only.
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
  - Order: logo, then the park switcher (bordered 12px button: map icon tile, "Udawalawe NP / 30,821 ha", chevron), then the nav, then the user card pinned to the bottom above a top border (pine avatar with lime initials and an online dot, name, role, up/down chevron).
  - Nav items are 44px pills with a 20px icon and 12px gap. The active item gets the lime fill and 500 weight.
  - Expandable groups (Patrols → Active patrols, All patrols; Sensors → Collars, Camera traps) are buttons that expand and collapse their children on click, with a chevron pointing up when open and down when closed. Groups start open. Their children are indented 24px behind a 1px `line-strong` guide, as 38px items with a right-aligned muted count. The active child gets the lime pill, and its parent turns ink at weight 500.
  - Alerts carries a coral count badge.
- **Buttons.**
  - Primary: pine, 48px tall in page headers, 40px in forms, with a leading plus icon for create actions.
  - Secondary: white with a `line` border.
  - Quiet: 32px `surface-muted` with a border, for Today, Filter, Full map and more-options.
  - Icon-only buttons always have an `aria-label`.
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
- **Patrols table (All patrols).**
  - Filter pills (All / Active / Scheduled / Completed with counts; the active pill is ink-filled).
  - Columns: Patrol (route name + `PT-` ID), Leader (28px initials avatar + ranger name), Schedule (day, then the actual start – end time once started), Distance (covered km for completed patrols, otherwise —), Status chip (Active positive, Scheduled neutral, Completed done, Cancelled neutral), and a more-options button.
- **Sign in.**
  - A centred card (max 1120px, xl radius, 12px padding, `line` border) that wraps into two equal panels and stacks on phones.
  - Left: a lg-radius photo panel with a `page-title` tagline at the top and a white xs-radius "Udawalawe NP · 30,821 ha" location chip at the bottom.
  - Right: a 380px form with the logo, a "Sign in" `page-title` and a 15px `ink-body` subtitle, a `line` divider, Work email and Password fields ("Forgot password?" link beside the password label), a "Keep me signed in on this device" checkbox in pine, a full-width 48px primary button and a centred "New to WildX? Create an account" line.
  - A focused input gets a pine border and a 3px `lime-soft` ring. A failed sign-in shows a negative caption above the button.
- **New patrol form.**
  - An inline panel on `surface-form` with an lg radius, a "New patrol" title and a close button.
  - Fields: route, ranger (both pick-lists) and date. Missing fields are outlined in negative red with a caption below.
  - Cancel and Create patrol buttons, right-aligned.
- **Alerts page.**
  - A pulsing **Live** chip sits next to the title. The subtitle counts open alerts and those escalated past their acknowledge time. Zones and rules and Report are secondary buttons on the right; there is no primary action, because sensors raise alerts.
  - The alert map is a 360px card in `map-ground`. High-risk zones are drawn in `negative-bg` with a 1.5px dashed `negative` outline. Each listed alert has a 24px numbered marker on a 3px white stroke, in its status colour; the selected marker gets the 18px halo. The legend sits bottom-left (Open, Acknowledged, Resolved, High-risk zone); the map zooms by scroll or pinch, with no zoom buttons. The map shows only the alerts in the current filter.
  - Below the map, the alert queue (`3 1 420px`) sits beside a column (`2 1 340px`) holding the alert detail and the notifications.
  - The queue has filter pills (Open, Acknowledged, Resolved, All with counts; Open by default) and lists alerts newest first. Each row is a button: the numbered marker, a "Type · zone" title (or "Type · device code" without a zone), a "Gemunu (COL-001) · Today · 22:05" caption, a severity chip (High and Critical negative, Low and Medium neutral) and a status dot + word. The selected row uses the `surface-sunken` fill.
  - Status words and colours: Open and Escalated (open and escalated at least once) in negative, Acknowledged in responding, Resolved in positive.
  - The alert detail card shows the title as `card-title`, the severity chip and status, then a fact list: Device, Occurred, Acknowledge by (with "overdue" once passed), Escalation ("Escalated 1 time"), Acknowledged (name · time) and Resolved (time · outcome). Without a selection it says "Select an alert to see its detail."
  - Rangers, supervisors and managers get Acknowledge (primary, 40px) while the alert is open and Resolve (secondary) until it is resolved. Managers and supervisors also get Dispatch ranger (secondary), which opens the shared dispatch form inline. A resolved alert has no actions.
  - The resolve form is an inline panel on `surface-form` with an lg radius and a "Resolve alert" `form-title`. The four outcomes (Conflict averted, Conflict occurred, No action required, False alarm) are 48px radio rows; the checked row gets a pine border and the lime-soft ring. A missing choice is outlined in negative red with a caption. Cancel and Resolve alert are right-aligned.
  - The notifications card has a "Notifications" `card-title` with a coral count badge for unread ones (hidden at 0). Each row shows the title (600 and ink when unread, with a pine dot and the word "New"), the body in `ink-body` and the time as a muted caption. Selecting a row marks it read and opens its link.

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
