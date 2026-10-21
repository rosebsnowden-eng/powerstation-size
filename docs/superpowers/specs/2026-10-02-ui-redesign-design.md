# UI Redesign Specification: Instrumental Dashboard & Micro-Interactions

**Date**: 2026-10-02
**Project**: WattCalc (`powerstation-site/app`)
**Goal**: Elevate the UI/UX of WattCalc to a professional-grade "power station control panel" style dashboard while strictly adhering to compliance rules (`docs/04-compliance.md`) and design system constraints (`docs/03-design-system.md`).

---

## 1. Overview & Objectives

WattCalc is a trust-first utility for sizing portable power stations. The goal of this redesign is to make the tool look and feel like a high-precision electrical control panel without introducing fluff, unverified images, or heavy scroll animations.

### Core Enhancements
1. **Instrument Control Panel (Results Area)**:
   - High-contrast, dark instrument panel styling for calculation outputs.
   - Monospace tabular numerals (`font-variant-numeric: tabular-nums`) for all energy/power figures.
   - Dynamic SVG donut breakdown and status progress meters with color-coded warning states (Cyan/Emerald for cleared, Amber/Rose for bottlenecks).
2. **Tactile Preset Chips & Load Manager**:
   - Interactive preset buttons with subtle active depth, active indicator badges, and smooth state toggles.
   - Load table items formatted as clean row cards with real-time individual Wh contribution badges and responsive field layouts.
3. **Model Picker & Station Comparison Cards**:
   - Model selection grid featuring clean spec tags and verified surge clearance status.
   - A/B comparison grid formatted as side-by-side gauge cards clearly flagging binding limits and runtime ratios.
4. **Design System & Compliance Adherence**:
   - `DESIGN_VARIANCE`: 4 (clean asymmetric utility alignment).
   - `MOTION_INTENSITY`: 2 (hover/active micro-interactions and subtle value ticks only; no scroll-driven animation).
   - `VISUAL_DENSITY`: 5 (data-dense, readable, high-utility layout).
   - Em-dash prohibition maintained. Zero third-party unverified images added.

---

## 2. Component & Architecture Scope

### 2.1 CSS Design Tokens (`src/styles/global.css`)
- **Instrument Panel Tokens**:
  - `--color-instrument-bg`: `#0f1715` (Deep slate dark background)
  - `--color-instrument-card`: `#16221f` (Card backdrop inside instrument)
  - `--color-instrument-border`: `rgba(255, 255, 255, 0.12)`
  - `--color-instrument-text`: `#f0fdf4`
- **Meter State Colors**:
  - `ok`: Emerald green (`#4ade80`) / Cyan (`#38bdf8`)
  - `warn`: Amber accent (`#fbbf24`)
  - `danger`: Rose red (`#f87171`)
- **Typography**:
  - Tabular monospace font applied to all measurement displays (`.tabular`).

### 2.2 Calculator Island (`src/components/Calculator.astro`)
- **Mode Selector (Tab Bar)**:
  - Pill-style segmented toggle with crisp active indicator (`I already have a model` vs `I need to size a new one`).
- **Preset Chips (`.preset-chip`)**:
  - Card-like chips with custom SVG icons, power badges, pressed aria states, and subtle active transform.
- **Load Items (`.load-row`)**:
  - Restructured responsive card row with inputs for Appliance Label, Watts, Daily Hours, Duty Cycle dropdown, and Surge Watts.
  - Live Wh contribution badge displayed on each row.
- **Hero Output Gauge**:
  - Prominent runtime or required battery size figure with tick keyframe transition on update.
  - Instant binding constraint verdict banner (Clear vs Surge Blocked vs Continuous Overload vs Usable Capacity Limit).
- **Meters & Energy Mix (Donut)**:
  - Custom SVG donut chart with color-coded breakdown of load energy mix.
  - Enhanced linear meters comparing load against max verified models.
- **Compare Grid (`#compare-grid`)**:
  - Side-by-side gauge layout comparing Model A and Model B runtime and constraint status.

### 2.3 Global Shell (`src/layouts/Base.astro` & Pages)
- Polish container contrast, navigation bar, and dark mode background tone to blend seamlessly with the instrument panel.

---

## 3. Verification & Testing Strategy

1. **Unit Tests**: Run `npm test` to ensure pure calculation logic in `src/lib/calculate.ts` remains 100% intact.
2. **Data Gate**: Run `npm run validate:data` to verify spec database rules.
3. **Copy Audit**: Run `npm run audit:copy` to verify zero banned claims or em-dashes.
4. **Visual & Responsive Verification**: Test layout across mobile (375px) and desktop breakpoints.

---

## 4. Self-Review Checklist

- [x] Placeholder scan: No TODOs or placeholders in design spec.
- [x] Internal consistency: All styles follow `docs/03-design-system.md` constraints.
- [x] Scope check: Focused strictly on UI/UX redesign of `Calculator.astro`, `global.css`, and layout shell.
- [x] Ambiguity check: Class names, color tokens, and script update logic explicitly detailed.
