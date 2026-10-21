# 03 - Design system

## Design read

Stated once, in the language the design skill asks for:

> Reading this as: a consumer utility landing page for US homeowners and CPAP users researching
> backup power, with a trust-first language, leaning toward Tailwind utilities plus a system sans
> stack and static states.

## Dials

The skill maps brief types to three numeric dials. The brief here matches its "trust-first /
regulated" row, which is the row that governs: this site touches medical-adjacent content and
electrical safety, so decorative expression is capped by design.

| Dial | Value | Reason |
|---|---|---|
| `DESIGN_VARIANCE` | 4 | Trust-first row. Left-aligned and asymmetric enough to avoid a centered template, symmetric enough to read as a utility rather than a brand exercise. |
| `MOTION_INTENSITY` | 2 | Trust-first row, and there is nothing on the page that motion would clarify. No scroll animation, no parallax, no reveal choreography. |
| `VISUAL_DENSITY` | 5 | Trust-first row. Spec tables and formulas need room, but the page is a tool rather than an editorial spread. |

Motion 2 means what it says: hover and active states only. There is no `scroll` listener, no
scroll-trigger library, and no animation that runs on its own. Allowed transitions are the 120 ms
button press, the 180 ms meter fill, the 180 ms accordion chevron, and the 180 ms result tick on
the hero number. All of those honor `prefers-reduced-motion`.

## Scope boundary

The design skill excludes several page types from its remit, and this project contains two of them:

| Surface | Skill applies? | What happens instead |
|---|---|---|
| Homepage | Yes | Skill rules apply: hero discipline, eyebrow restraint, no repeated layout families. |
| Guide pages | Yes | Skill rules apply to layout; prose stays plain. |
| Calculator | Partly | Multi-step forms and result dashboards are outside the skill's remit. Authored as a conventional accessible form with a real tablist, with the skill applied only to presentation. |
| Comparison table | No | Data tables are outside the skill's remit. A plain semantic table. |
| Station detail pages | No | Generated spec views. Plain definition lists. |

The skill instructs that when a brief falls outside its scope, that should be said explicitly
rather than force-applied. This table is that statement.

## Palette

Forest green plus a single amber accent, on a neutral ink scale. Both light and dark modes are
defined from the start and selected by `prefers-color-scheme`.

The skill bans a specific family of colors as the default reach for consumer-facing briefs: warm
cream backgrounds with brass, clay, and oxblood accents. That family is not used here. The neutrals
are cool-leaning rather than warm, and the accent is a saturated amber used for one thing only.

| Token group | Role |
|---|---|
| `ink-50` to `ink-950` | Neutrals: backgrounds, text, borders. Cool-leaning greys with a slight green cast. |
| `moss-100` to `moss-700` | Primary action and brand mark. Dark green, deliberately desaturated. |
| `amber-accent-100` to `amber-accent-700` | Single accent. Used for the focus ring and for out-of-stock or shortfall warnings. Nothing decorative. |
| `danger-100` to `danger-700` | Reserved for genuine error states. Not currently used on any page. |

**Color consistency lock.** One accent, used identically everywhere. There is no second accent, no
gradient, and no color that appears on one page and not another.

## Wordmark

The public lockup is stacked type, not a letter in a square: `POWERSTATION` over `SIZE`, with a
two-prong plug sitting where the I would be. It is a utility mark for this domain, not a copy of
BackupPowerHub's H-plus-plug. Favicon is the plug drawing. Motion stays at intensity 2: the mark
does not animate.

## Shape

One radius system, applied without exception:

- Cards and panels: `--radius-card`, 16px
- Buttons, inputs, selects: `--radius-control`, 10px
- Quick-start chips: 16px, matching the card radius

That rule is written down here precisely because a mixed system is only acceptable when the rule is
documented and followed.

## Typography

Body copy is Source Sans 3. Display figures on the instrument panel use Fraunces. Numerals use
IBM Plex Mono with `tabular-nums`. All three are loaded from Google Fonts in `Base.astro`. That is
a departure from the original "no webfont" brief: the privacy page discloses the third-party font
request, and the fonts can later be self-hosted without changing the type roles.

Small text on light backgrounds uses `ink-500` or darker. `ink-400` fails WCAG AA on `ink-50` and
is reserved for labels on the dark instrument panel.

Numerals render in a monospace stack with `tabular-nums`. This matters more than it looks: a column
of capacities and prices that shifts width as you scroll reads as unreliable, and readers comparing
a table of watt-hours are doing exactly that.

## Layout families

The homepage uses four distinct families, which satisfies the skill's requirement that a page of
this length not repeat one pattern:

1. Left-aligned hero with a spec-derived figure strip
2. Two-column calculator: input column, sticky result column
3. Three-column explanatory text, no cards, divided by space
4. Numbered step list, then a disclosure list for questions

There is no zigzag image-and-text alternation anywhere, because there are no images to alternate.

## Em-dash ban

The skill bans the em-dash character outright, in every visible string, including headlines, body
copy, button labels, and alt text. `scripts/audit-copy.mjs` scans the source tree for em-dashes and
en-dashes used as separators and fails if it finds any. Plain hyphens and hyphens in ranges are
permitted.

## Images

Marketing surfaces still ship no stock photography and no fake product screenshots. Model pages and
the calculator picker use manufacturer packshots stored in `public/images/stations/`, named by
record id. Those files are product photography, not decorative campsite stock, and each model page
still names the specification source URL separately from the image.

If additional photography is added later, the correct sources remain manufacturer press assets used
with permission, or original photographs. Decorative lifestyle imagery still does not belong in the
hero.
