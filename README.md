# PowerStation Size

Live site: [https://powerstationsize.com](https://powerstationsize.com)

A portable power station sizing calculator and verified specification database.

The site answers one question: given the devices you need to run, how much capacity and how much
output do you need, and which of the two is your binding constraint. Capacity, continuous watts, and
inverter surge are checked separately. A boost rating (X-Boost, Power Lifting, SurgePad) does not
clear a motor start. It is a static site with a client-side calculator and no backend.

## Status

Live at `https://powerstationsize.com`, on the Cloudflare Pages project `powerstationsize`.
Canonical URLs live in `astro.config.mjs` and `src/data/site.ts`. See `docs/06-development.md`
for the existing direct-upload deployment command.

GA4 is optional and loads only after analytics consent. New calculator links use URL fragments;
legacy query links are migrated in the browser before Analytics starts. Public pages use the
brand, domain, and `hello@powerstationsize.com`, not an invented legal entity or location.
The operator must still confirm any jurisdiction-specific identity disclosure requirements,
the actual GA4 retention settings, and email handling practices.

Amazon Associates is live (`meta.amazon_tag`). Brand-program links stay off until
`meta.affiliate_approved` is true. Commissions do not change calculator output. See
`/disclosure/`. There is no price tracking or price-drop alert.

## Quick start

```bash
npm install
npm run dev      # localhost:4321
npm test         # unit tests for the calculation library
npm run build    # runs the data gate, then builds to dist/
npm run preview  # serve the built output
```

Requires Node 22.12 or newer. No test framework to install: the suite runs on Node's built-in runner.

## What is in the box

| Surface | What it does |
|---|---|
| `/calculator/` | Two modes: size a new system, or see how long a specific model runs your load. Device picker, scenario presets, per-device duty cycle and startup surge, capacity and peak checks, solar input limit checks, shareable link. |
| `/scenarios/` | Five hand-written worked loads, each with the limit that binds first and the models that clear it. |
| `/stations/` | Comparison table of verified models, a detail page per record, and a refrigerator verdict page per record. |
| `/brands/` | Four manufacturer hubs: EcoFlow, Jackery, BLUETTI, Anker SOLIX. Filtered spec tables, not reviews. |
| `/guides/` | Solar generator sizing, CPAP backup, camping, watts vs watt-hours, 1000Wh runtime, vs pages, and [surge versus boost](https://powerstationsize.com/guides/surge-vs-boost/). |
| `/methodology/` | The formulas, the constants, and what is deliberately not modelled. |
| `/about/`, `/privacy/` | Operator identity, funding, and data handling. |

Pages build from the verified station records in `src/data/power-stations.json` (79 models at last
count) and the device library in `src/data/devices.ts`. The calculator sizes a load, estimates
runtime for one model, and compares two models on the same load.

## Two things that are unusual here, on purpose

**The build fails on unverified data.** `scripts/validate-data.mjs` runs before every build and stops
it if any specification record is missing a source URL, a verification date, or a required number, or
if it contains an affiliate link while no program has been approved. `astro check` runs in the same
gate. The site's only real asset is that its numbers are traceable, so an untraceable number cannot
reach production.

**The calculator does two things, not one.** Sizing answers "how big", which is what most tools
cover. The runtime mode answers "how long will this unit last", which is the other half of the
question and the reason a reader who already owns a station has any use for the page. Both read from
the same tested library, so a change to the formula cannot leave the two modes disagreeing.

**The database is smaller than it could be.** Seventy-nine records, not every SKU in the
category. Models whose storefront pages returned only navigation markup or a 404 stay out until a
human reads the spec table and records the source. Several fields on the present records are null
because the manufacturer does not publish them, and they render as `n/a` rather than a guess.

## Documentation

| Document | Contents |
|---|---|
| [01-architecture.md](docs/01-architecture.md) | Stack, directory layout, rendering model, the build gate. |
| [02-data-contract.md](docs/02-data-contract.md) | Every field in both data files, and the rules for filling them. |
| [03-design-system.md](docs/03-design-system.md) | Design dials, palette, typography, and the scope boundary for the design skill. |
| [04-compliance.md](docs/04-compliance.md) | The six pre-launch gates, which are satisfied and which are outstanding. |
| [05-content-and-seo.md](docs/05-content-and-seo.md) | Verified target terms, sequencing, publishability rules, stop conditions. |
| [06-development.md](docs/06-development.md) | Commands, how to add a model or a device, testing, launch checklist. |
| [07-operations.md](docs/07-operations.md) | Weekly review, price refresh, handling a specification error. |
| [08-decisions.md](docs/08-decisions.md) | Why the plan was narrowed, why nulls are preferred to estimates, and the rest. |

## Source material

The research documents that informed this build (keyword and SERP exports, market analysis, the
pre-launch compliance review) sit in the parent directory alongside this application. They are input,
not output, and the narrower of the conflicting plans in them is the one implemented. `08-decisions.md`
explains that choice.

## A warning about the numbers

Device wattages are published engineering ranges, not measurements, and every runtime figure the site
produces is calculated rather than tested. Nothing here is medical or electrical advice. The
constraints are stated on the methodology page and on every results surface.
