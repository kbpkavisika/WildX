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

