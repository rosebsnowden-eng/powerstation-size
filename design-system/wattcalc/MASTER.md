# Design System Master File

> This file previously shipped as a generated Insurance Platform template (orange `#EA580C`,
> Atkinson Hyperlegible, "Contact Sales"). That palette and copy do not apply to WattCalc.
> Follow `docs/03-design-system.md` and `src/styles/global.css`. Page-level notes in
> `design-system/wattcalc/pages/` may still override layout details for a single surface.

**Project:** WattCalc
**Category:** Consumer utility / portable power calculator

## Color

| Role | Token | Hex |
|---|---|---|
| Ink scale | `ink-50` to `ink-950` | cool greys with a green cast |
| Primary | `moss-700` | `#2f5c3a` |
| Accent | `amber-accent-500` | `#d4901f` |
| Danger | `danger-600` | `#b23c35` |

One accent. No cream/brass/oxblood default palette. Light and dark both come from `prefers-color-scheme`.

## Type

- Body: Source Sans 3
- Display figures: Fraunces
- Numerals: IBM Plex Mono, `tabular-nums`

Loaded from Google Fonts today. Self-host later if the privacy cost of the third-party request is no longer acceptable.

## Shape and motion

- Card radius 16px, control radius 10px
- Motion intensity 2: hover/active only, plus 180 ms meter, chevron, and result-tick transitions
- Density 5: data-first, no decorative illustration on marketing surfaces

## Contrast

Small text on light backgrounds uses `ink-500` or darker (`ink-400` on `ink-50` fails AA).
