# 01 - Architecture

## What this project is

A static site that answers one question well: how much portable power station capacity and output
does a given set of devices need. It is built as a single-purpose utility rather than a roundup
blog, because the sizing question is the only place where a small site can beat the large media
outlets that already dominate the generic "best power station" terms.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro 7 (static output) | Static pages with a client-side calculator and a small first-party analytics consent controller. |
| Styling | Tailwind 4 via `@tailwindcss/vite` | Utility classes plus CSS custom properties for design tokens. No runtime CSS. |
| Data | `src/data/power-stations.json` | One file drives the comparison table, the calculator's matching logic, and every model page. |
| Hosting | Cloudflare Pages (static) | Existing direct-upload project, deployed using Wrangler. |
| Analytics | GA4 (optional) | ID lives in `src/data/site.ts`; the tag loads only with explicit or remembered unexpired consent, and never with an empty ID. |

There is no database, no server, and no build-time network access. Every page is generated from
files in the repository.

## Directory layout

```
powerstation-site/
├── docs/                     this documentation set
├── scripts/
│   └── validate-data.mjs     build gate for the specification database
├── src/
│   ├── components/
│   │   ├── Calculator.astro  the interactive island
│   │   ├── Disclaimer.astro  standing legal notices
│   │   └── SpecTable.astro   comparison table
│   ├── data/
│   │   ├── devices.ts        device power library
│   │   ├── power-stations.json  verified specification database
│   │   ├── scenarios.ts      hand-written worked loads (scenario pages)
│   │   └── site.ts           identity, operator details, analytics IDs
│   ├── layouts/
│   │   └── Base.astro        shell, header, footer
│   ├── lib/
│   │   ├── calculate.ts      sizing and runtime math (pure functions)
│   │   └── catalog.ts        brand slugs, fridge load, JSON-to-spec mapping
│   ├── pages/                file-based routing
│   │   ├── brands/           /brands/ index and one hub per manufacturer
│   │   ├── scenarios/        /scenarios/ index and one page per scenario
│   │   └── stations/[id]/    spec page plus /refrigerator/ verdict
│   └── styles/
│       └── global.css        design tokens
└── astro.config.mjs
```

## Rendering model

Pages are static HTML. `Calculator.astro` ships a small `<script>` that reads JSON blobs embedded in
the page, so the device list never leaves the browser and there is no API to build or secure.

The client script contains no arithmetic. Every calculation lives in `src/lib/calculate.ts`, which is
imported by both the component and the test suite. This matters because the formulas are the product:
if the component re-implemented them, a change in one place would silently leave the tested version
and the shipped version disagreeing.

The calculator has two modes, and both call into the same library:

| Mode | Function | Question it answers |
|---|---|---|
| Size a new system | `sizeSystem()` | How much capacity and output do I need? |
| Runtime of a model | `runtimeFor()` | How long will a given unit run my load? |

Two further functions keep the catalog comparison in one place. `matchStations()` returns the models
that clear capacity, continuous output, and surge, smallest first, and separates the records whose
peak figure is a resistive boost so they are never presented as having cleared a motor start.
`catalogLimit()` names the limit that binds once nothing fits. It works by relaxation, testing each
constraint against real records, because comparing a load against the widest value of each field can
report a load as coverable when no single model covers it.

The runtime mode reports two figures: a duty-weighted average and a worst case where everything runs
at once. For a fridge at 35 percent duty those differ by roughly 2x, which is the difference between
a useful answer and a misleading one.

`getStaticPaths` in `src/pages/stations/[id].astro` generates one page per record in the
specification database at build time. Adding a verified station to the JSON adds a spec page, a
refrigerator verdict page, and a row on that brand's hub. The refrigerator pages call `runtimeFor()`
against the same estimated fridge load the calculator uses. A boost rating does not clear the
compressor.

## Scenario pages

`/scenarios/<id>/` renders a worked load: the device rows, the daily watt-hours, the recommended
capacity, and the models that clear every limit. The numbers are computed at build time by
`analyzeScenario()`, which calls the same `sizeSystem()`, `chargePlan()`, and `matchStations()` the
browser bundle imports. Nothing on those pages is transcribed by hand, so a static page cannot drift
from the live calculator, and the "open this load in the calculator" link reproduces the figures
exactly.

Scenarios are hand-written in `src/data/scenarios.ts`, and a row naming a device id that does not
exist throws at build time rather than silently shrinking the load. This is deliberately not a
generated page set: the device library is still mostly estimated wattages, and several hundred pages
built on estimates would be scaled misinformation. See `05-content-and-seo.md`.

## The build gate

`npm run build` runs `npm run validate:data` and `npm run check` before the Astro build. The
validator exits non-zero, stopping the build, when any record is missing a required field, carries
placeholder text, uses a source URL that is not absolute, has `output_peak_w` below
`output_continuous_w`, or contains an affiliate link while `meta.affiliate_approved` is false. The
type check runs in the same gate because a red `astro check` is a real defect that a passing build
would otherwise wave through.

## What is intentionally absent

- No client-side router, no state library, no component framework beyond Astro.
- No hand-built "product screenshots" or decorative illustrations.
- No price-tracking or price-history features. See `04-compliance.md` for why.
- No programmatic `how long will X run Y` pages. They were deferred pending a device power library
  with per-field sources.
