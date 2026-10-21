# 06 - Development

## Requirements

- Node 22.12 or newer. Astro 7 enforces this in `package.json`.
- npm. No other global tooling.

## Commands

```bash
npm install            # install dependencies
npm run dev            # dev server on localhost:4321
npm test               # unit tests for the calculation library
npm run build          # validate data, then build to dist/
npm run preview        # serve the built output
npm run validate:data  # run the data gate alone
npm run audit:copy     # dash and claim-language audit
npm run check          # astro check, type checking
```

`npm run build` runs the data gate first and stops if it fails. There is no way to build around it
except by editing `package.json`, which the gate's own documentation asks you not to do.

## Adding a model to the database

1. Open the manufacturer's product page for the model.
2. Read the specification table. Do not use a retailer listing, a spec aggregator, or a review site.
3. Append a record to `stations` in `src/data/power-stations.json`.
4. Set `source_url` to the exact page you read and `verified_at` to today's date in `YYYY-MM-DD`.
5. Leave any field null that the page does not state. Do not convert units, do not estimate, do not
   copy a figure from a different model in the same family.
6. Leave `affiliate_links` values null unless `meta.affiliate_approved` is true.
7. Run `npm run validate:data`. Fix anything it reports.
8. Run `npm run build` and open the generated model page. Confirm the numbers match the source page.

If the product page renders only navigation markup when fetched, that is a JavaScript storefront and
you cannot read the specs from it. Try the manufacturer's own spec tab, a support PDF, or a regional
site. If none of those work, do not add the record. A missing model costs nothing; a wrong one costs
the site's credibility.

## Adding a device to the calculator

1. Append an entry to `devices` in `src/data/devices.ts`.
2. Set `typical_w` to a value from a manufacturer figure if one exists, and set `source_type` to
   `official` with the URL. Otherwise use a published engineering range and mark it `estimated`.
3. If the device has a motor or compressor, set `surge_w`. Without it, the device cannot be checked
   against a station's peak output.
4. Set `duty_cycle` honestly. A thermostat-controlled appliance cycles; a router does not.
5. Pick the right `group` so it appears in the correct section of the picker.

No other file needs to change. The picker, the presets, and the calculation all read the same array.

## Adding a page

Create a file under `src/pages/`. Wrap the content in `Base.astro` and pass a `title` and a
`description`. Use `Disclaimer.astro` with the `medical` or `electrical` prop on any page that
touches CPAP or home backup content.

Model pages are generated automatically from the database. Do not create them by hand.

## Testing

The calculation library has unit tests. They run on Node's built-in test runner, which strips
TypeScript types natively, so there is no test framework to install or configure.

```bash
npm test          # node --test 'test/**/*.test.ts'
npm run check     # astro check (type checking; needs the typescript devDependency)
```

`test/calculate.test.ts` covers the behaviours that a later edit could silently break:

- duty cycle reduces daily energy, so a cycling load recommends less capacity than a continuous one
- inverter efficiency divides, so a lower efficiency raises the recommendation rather than lowering it
- a surge above a station's peak is reported as the binding constraint
- a continuous overload is reported when the surge check passes
- an empty device list yields zero, not `NaN` or `Infinity`
- the duty-weighted runtime exceeds the worst-case runtime, and they converge at 100 percent duty
- the documented outage scenario still produces 585 Wh daily and an 826 Wh recommendation

That last test is a tripwire on the numbers quoted in `docs/05` and the README. If the formula
changes, the test fails before the documentation goes stale.

Unit tests do not replace the check that matters most, which is whether the numbers on a page match
the manufacturer source. The full verification sequence is:

1. `npm test` passes.
2. `npm run validate:data` passes.
3. `npm run audit:copy` passes.
4. `npm run build` completes and the page count matches the number of database records plus the
   static pages.
5. Load `/calculator/`, add a device, and confirm the recommended watt-hours change in the expected
   direction when you raise the stated wattage.
6. Switch to the runtime mode and confirm the average figure exceeds the worst-case figure for a load
   with a duty cycle below 1.
7. Check one model page against its source URL by hand.

## Deployment

The site is a Cloudflare Pages **Direct Upload** project on the same account as aigiftradar
(`rosebsnowden@gmail.com`). Wrangler cannot convert Direct Upload to Git later; leave it as
upload until a GitHub repo exists, then create a new Git-connected project the same way
aigiftradar was rebuilt.

| Item | Value |
|---|---|
| Project | `powerstationsize` |
| Preview | https://powerstationsize.pages.dev/ |
| Production deploy | `npx wrangler pages deploy dist --project-name=powerstationsize --branch=main` |
| Build locally first | `npm run build` (Node 22+, output `dist`) |
| Custom domains | `powerstationsize.com` and `www.powerstationsize.com` attached; apex serves the live site |
| Email | Cloudflare Email Routing, `hello@powerstationsize.com` → `rosebsnowden@gmail.com` |

`site` in `astro.config.mjs` and `src/data/site.ts` both use `https://powerstationsize.com`. Keep
them identical, or the sitemap and canonical URLs will drift.

### Custom-domain maintenance

The site is already live. Do not recreate DNS records as a prerequisite for a content deployment.
The records below describe the expected Pages setup if domain troubleshooting is needed. Check
the current dashboard state before making changes; the deployment token may not have DNS-write
permissions.

In **DNS → Records** for `powerstationsize.com`:

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `@` | `powerstationsize.pages.dev` | Proxied |
| CNAME | `www` | `powerstationsize.pages.dev` | Proxied |

Use the Pages custom-domain screen to inspect validation and certificate status. Verify both the
custom domain and the unique deployment URL after each production upload.

Email obfuscation (Scrape Shield) should stay **off**, same as aigiftradar, so
`hello@powerstationsize.com` is readable in the page source.

Outbound "send as hello@" is not configured. Cloudflare Email Routing only receives. Do not add
Resend or a paid mailbox until Gate F (first affiliate approval) allows it.

## Before launch checklist

- [x] `src/data/site.ts`: site name, domain, and contact email (`hello@powerstationsize.com`)
- [x] `astro.config.mjs` and `src/data/site.ts`: `https://powerstationsize.com`
- [x] Confirm `/robots.txt` sitemap URL matches that domain (build output)
- [x] Confirm `/terms/`, `/privacy/`, and `/disclosure/` are linked from the footer
- [x] Add the GA4 ID to `src/data/site.ts`, or leave it empty to ship without analytics
- [x] Gate GA4 on optional consent and provide a footer withdrawal control
- [x] Use fragment-based calculator links and migrate legacy query parameters before analytics
- [x] `npm run validate:data` and `node scripts/audit-copy.mjs` both pass (2026-10-08 UTC)
- [x] `npm run build` succeeds (2026-10-08 UTC)
- [x] Read the CPAP guide once more against gate B in `04-compliance.md` (2026-10-08 UTC)
