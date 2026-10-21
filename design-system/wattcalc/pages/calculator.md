# Calculator Page Overrides

> **PROJECT:** WattCalc
> **Page Type:** Utility calculator
> Overrides MASTER.md. The generated Enterprise Gateway pattern does **not** apply.

## One job

Answer: how many hours (owned model) or how many watt-hours (sizing a new one).

## Layout

- Max width: 1280px for the tool, 65–75ch for supporting copy.
- Desktop: two columns. Left = inputs. Right = one sticky result panel (min 320px).
- Mobile: mode toggle, then inputs, then result. No decoration above the first control.
- Delete competing chrome: numbered “how it works” cards, four KPI tiles above the form, duplicate H1s.

## Flow

1. Mode: I already have a model / I need to size a new one. The toggle **hides** unused panels.
2. Runtime mode: brand → model photos → appliances → load rows.
3. Size mode: skip brand/model; appliances → load rows; result names the binding limit.
4. Solar, inverter, reserve, compare start collapsed.

## Result panel

- One number (hours or recommended Wh).
- One sentence verdict.
- Compact secondary stats under it.
- Meters / donut / compare are secondary.

## Anti-patterns for this page

- Results and inputs both screaming for attention
- Mode toggle that only changes a button class
- Unlabeled watts/hours fields
- Placeholders as the only label
- Empty white load rows with invisible text in dark mode
