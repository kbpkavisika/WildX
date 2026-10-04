# WildX

## Overview

WildX is the operations console for a national park team (park managers, rangers, vet unit). It replaces the old SWCAMS screen, which crammed too much onto one page, with a calm, airy layout modelled on modern SaaS dashboards: a white canvas, a left sidebar, and a few large, bordered cards per page.

The personality is **calm, field-ready and specific**. It should feel like a quiet control room, not an alarm panel: one deep green brand colour, one lime "you are here" accent, and a single coral highlight for the thing that needs attention. Copy reads like a ranger's radio call: short, concrete, no filler.

Screens designed so far (`docs/prototypes/`):

- **Dashboard** (`dashboard.html`): park activity metrics, a human–elephant conflict bar chart and the patrol schedule.
- **Patrols · Active** (`active-patrols.html`): a full-bleed live map of teams in the field, with a floating "In the field" list.
- **Patrols · All** (`all-patrols.html`): a filterable table of every patrol, with a New patrol action. The add form opens inline above the table.

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

- **Shell.** A 248px sidebar with a 1px `line` right border, then a fluid column holding a top bar and the main area. The two wrap on narrow screens, with the sidebar stacking above.
- **Top bar.** 16px × 28px padding, bottom border, a 280px search field with a `⌘ K` hint on the left, and 40px circular icon buttons (Help, Notifications) on the right. There is no user menu here: the user lives at the bottom of the sidebar.
- **Main.** Padded `space-7` (28px), with a `space-5` (20px) gap between blocks, capped at 1240px. The Active patrols map page drops the cap and lets the map grow to fill all remaining height (minimum 640px).
- **Page header.** Title and subtitle on the left, the primary action (48px button) on the right.
- **Cards.** Padded 22px × 24px, with an 18px gap inside. Rows of cards use flex-wrap with weighted bases (e.g. `3 1 420px` beside `2 1 340px`) so they reflow to one column without breakpoints.
- **Metric strip.** An auto-fit grid of 180px-minimum cells, split by 1px `line` dividers under a top rule.
- **Tables.** CSS grid rows (`1.7fr 0.8fr 1fr 1.4fr 1.1fr 0.9fr 0.9fr 36px`) with 12px row padding and `#F0F1EC` row dividers. They scroll horizontally below 980px.
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

