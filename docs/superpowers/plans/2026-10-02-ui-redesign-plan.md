# WattCalc UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform WattCalc's UI into a high-precision, dark "instrument control panel" dashboard style while keeping pure calculation logic, data validation gates, and compliance rules completely intact and passing.

**Architecture:** Extend `src/styles/global.css` with dark instrument panel design tokens, tactile chip styles, tabular monospace typography, and warning states. Overhaul `src/components/Calculator.astro` component template and its client-side script rendering methods to output color-coded progress meters, live Wh load row badges, dynamic SVG donut charts, and side-by-side comparison gauges.

**Tech Stack:** Astro 7 (SSG), Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript, Node.js test runner (`node --test`).

---

### Task 1: CSS Design Tokens & Global Style Enhancements

**Files:**
- Modify: `src/styles/global.css`
- Test: `npm test` & `npm run check`

- [ ] **Step 1: Check existing global CSS styling rules**

Read `src/styles/global.css` to verify existing CSS variables and Tailwind imports.

- [ ] **Step 2: Add Instrument Control Panel design tokens & utility classes**

Add custom CSS properties and classes for:
- `--color-instrument-bg`: `#0f1715`
- `--color-instrument-card`: `#16221f`
- `--color-instrument-border`: `rgba(255, 255, 255, 0.12)`
- Font settings: Monospace tabular numerals (`.tabular`)
- Tactile preset chip states (`.preset-chip`)
- Meter fill state colors (`.meter-fill.ok`, `.meter-fill.warn`, `.meter-fill.danger`)

- [ ] **Step 3: Run tests and audit scripts to ensure style additions breaking nothing**

Run: `npm test && npm run validate:data && npm run audit:copy`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "style: add instrument control panel design tokens and utility classes"
```

---

### Task 2: Component Structure Overhaul (`src/components/Calculator.astro`)

**Files:**
- Modify: `src/components/Calculator.astro`
- Test: `npm test` & `npm run validate:data`

- [ ] **Step 1: Update Calculator markup for Instrument Panel layout**

Update the HTML structure inside `src/components/Calculator.astro`:
- Enhance the top Mode Selector tab bar (`#mode-runtime` vs `#mode-size`).
- Style the Appliance Preset picker chips with custom SVG icons, power badges, and ARIA pressed attributes.
- Restructure the Load list (`#load-list`) container and Empty state placeholder (`#load-empty`).
- Enhance the Instrument Panel result container (`.instrument`), Hero runtime/capacity display, meters, and SVG donut chart container.
- Update Compare section (`#compare-grid`) side-by-side gauge layout.

- [ ] **Step 2: Verify HTML build**

Run: `npm run validate:data`
Expected: OK 29 station(s) validated

- [ ] **Step 3: Commit**

```bash
git add src/components/Calculator.astro
git commit -m "feat(ui): update Calculator component HTML markup for instrument panel"
```

---

### Task 3: Client Script Rendering Polish (`src/components/Calculator.astro` `<script>`)

**Files:**
- Modify: `src/components/Calculator.astro`
- Test: `npm test` & `npm run validate:data` & `npm run audit:copy`

- [ ] **Step 1: Update client-side script rendering methods**

In `src/components/Calculator.astro` `<script>` block:
- **`renderList()`**: Add live per-device daily energy badge (`Wh/day`) on each load row card.
- **`meter()`**: Render linear meter progress bars with status classes (`ok`, `warn`, `danger`).
- **`drawDonut()`**: Enhance the SVG donut chart rendering with dynamic color arcs and legend items.
- **`statusItem()`**: Render status badges with clear visual indicators.
- **`recalcRuntime()` & `recalc()`**: Ensure hero numbers transition with tick animations, update binding constraint warning alerts cleanly, and style compare card side-by-side gauge view.

- [ ] **Step 2: Run all verification commands**

Run: `npm test && npm run validate:data && npm run audit:copy`
Expected: ALL PASS (17 tests passing, data validated, copy audit clean).

- [ ] **Step 3: Commit**

```bash
git add src/components/Calculator.astro
git commit -m "feat(ui): refine client script rendering for instrument panel and compare cards"
```

---

### Task 4: Global Layout & Page Shell Alignment

**Files:**
- Modify: `src/layouts/Base.astro`
- Modify: `src/pages/index.astro`
- Test: `npm test` & `npm run validate:data` & `npm run audit:copy`

- [ ] **Step 1: Polish page container and background contrast**

Ensure `src/layouts/Base.astro` and `src/pages/index.astro` header, footer, and section backgrounds smoothly blend with the dark instrument panel component.

- [ ] **Step 2: Full verification suite**

Run: `npm test && npm run validate:data && npm run audit:copy`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Base.astro src/pages/index.astro
git commit -m "style: align layout shell and homepage sections with instrument panel UI"
```
