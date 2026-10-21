# Design System Master — PowerStation Size

Generated from [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), then overridden to keep the existing forest + amber trust theme. Do not apply the script's orange-on-dark palette; it mismatches this product.

## Product

- **Type:** Consumer sizing tool + affiliate comparison
- **Job:** Answer capacity, continuous watts, and inverter surge separately
- **Audience:** US homeowners, campers, CPAP users
- **Style:** Trust & Authority, light-first, dark-mode pair
- **Anti-patterns:** AI purple gradients, emoji as icons, competing H1s, hover-only actions

## Tokens (already in `src/styles/global.css`)

| Role | Token | Hex |
|---|---|---|
| Primary / CTA | `--color-moss-700` | `#2f5c3a` |
| Accent / focus | `--color-amber-accent-600` | `#b4751a` |
| Background | `--color-ink-50` / `--color-ink-950` | `#f4f7f4` / `#0b0e0c` |
| Body text | `--color-ink-900` | `#141815` |
| Muted | `--color-ink-500` | `#5f6c62` |
| Danger | `--color-danger-700` | `#8f2f2a` |

- Headings: Fraunces (`--font-display`)
- Body: Source Sans 3 (`--font-sans`)
- Figures: IBM Plex Mono (`--font-mono`, `.tabular`)
- Radius: card 16px, control 10px
- Motion: 180ms transform/opacity; respect `prefers-reduced-motion`

## Layout diagnosis (2026-10-10)

1. **Calculator job:** add devices → read hours/limit → optionally pick a model.
2. **Was wrong:** scenario chips and brand/model wall sat above the appliance grid, so the first viewport was not the task.
3. **Guides:** long-form stays ~68ch; data tables may use `max-w-6xl`.
4. **Index pages:** list-only brands/guides underuse cards and touch targets.

## Page rules

### Calculator / homepage

- Mode toggle first (runtime vs size).
- Appliance chips + load list next.
- One result surface (hours, verdict, buy).
- Brand/model picker only in runtime mode.
- Scenarios, solar constants, compare start collapsed or below.
- Visible labels on every input. Empty load has a next action.

### Guide / vs / methodology

- One H1. Prose measure 60–75 characters unless the page is a data table.
- Tables wrap in `overflow-x-auto`. Captions exist (sr-only ok).
- Meaningful images have alt text. Product thumbs next to a name may use empty alt.

### Brands / stations

- Brand index is a card grid, not a skinny list.
- Station table: hover row, sticky first column optional, no horizontal page scroll.
