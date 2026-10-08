# WildX

Calm, field-ready interface for wildlife operations: patrols, incidents, sensors, alerts and community reports for a park team.

## Content fundamentals

- Write like a ranger's radio call: short, specific, no filler. "Night patrol · Hambegamuwa", not "Upcoming patrol event".
- Lead with the thing, then the detail, joined by a middle dot: `Collar check · Sudu Manika`, `19:00 – 23:00 · K. Bandara`.
- Times are 24-hour (`19:00`), dates read `8 Oct, 2026`, counts are numerals.
- Status chips say what it means for the user: "On schedule", "1 offline", "+1 today". Never just a bare percentage when a word is clearer.
- Sentence case everywhere. No exclamation marks, no emoji.

## Visual foundations

- **Ground.** Everything sits on `surface` (white). Separation comes from a 1px `line` border and `radius-xl` corners on each card, not shadows or tinted backgrounds.
- **One brand, one highlight.** `pine` is the brand and the only filled button colour. `lime` marks where you are (active nav). `coral` is the single thing to look at in a card — one bar, one badge — never decoration.
- **Status chips** pair a tint, a border and a text colour: `positive` / `positive-bg` / `positive-line` for good news, `negative` / `negative-bg` / `negative-line` for needs action. Radius `radius-xs`, caption size.
- **Schedule colours** are categories, not states: `butter` for patrols, `orchid` for maintenance and vet work, with a white icon tile and ink text.
- **Type.** Geist only. Page titles at `page-title`, card titles at `card-title` (weight 500, never bold), numbers at `metric` or `hero-number`. Body copy is `body` in `ink-body`; meta is `caption` in `ink-muted`.
- **Spacing.** Cards pad `space-6`, widgets sit `space-5` apart, the main column pads `space-7`.
- **Layout.** A 248px sidebar and a fluid content column capped near 1240px. Widgets wrap into one column on narrow screens; the sidebar stacks above.

## Navigation

Sidebar order: Dashboard, Patrols, Incidents, Sensors (with Collars and Camera traps nested under a hairline guide), Alerts (coral count badge), Community reports, Analytics. The park switcher sits under the logo; the signed-in user sits at the bottom.

## Iconography

Outline icons on a 24px grid, drawn at 18–20px, 1.8px stroke, round caps and joins, `currentColor`. Lucide-style shapes. Icon-only buttons are 40px circles on `surface` with a `line` border and always carry an `aria-label`.

## Logo

The mark is a `pine` tile (radius 10 at 34px) with two crossing `lime` leaves forming an X; the second leaf is at 60% so the overlap reads. The wordmark is "Wild" in `ink` and "X" in `pine`, set in Geist at `wordmark`. See `assets/Logos`.
