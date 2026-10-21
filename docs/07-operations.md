# 07 - Operations

## The weekly review

Four numbers, recorded every week without exception. The recording matters more than the values in
the first three months, because the point is to have a trend line when the numbers are still small
and it is tempting to stop looking.

| Number | Source | What it tells you |
|---|---|---|
| Pages published | the repository | Whether the production rate is real |
| Indexation rate | Search Console | Whether Google is accepting the pages at all |
| Organic sessions | GA4 | Whether anyone is arriving |
| Commissions | affiliate dashboards | Whether any of it converts |

## Price and specification refresh

Manufacturer list prices move, and a stale price is the most likely way an accurate page becomes an
inaccurate one.

- Prices are stored with a `price_updated` date. The data gate warns when any price is more than 30
  days old.
- Refresh prices monthly by opening each `source_url` and reading the current figure. Update
  `price_usd_list` and `price_updated` together.
- Refresh more often around major sale periods, which is when list prices and sale prices diverge
  most and when the risk of publishing a misleading number is highest.
- Availability changes faster than price. A model that goes out of stock or is discontinued should
  have its `availability` field updated in the same pass, because recommending an unavailable unit
  wastes the reader's time and ours.

## Handling a specification error

A wrong number is the most serious failure this site can produce. The procedure:

1. Confirm the error against the manufacturer page named in `source_url`. If the manufacturer
   changed the specification, the record is stale rather than wrong.
2. Correct the record and update `verified_at`.
3. Leave a note in the record's `notes` field describing what changed and when, so a future reader
   can see the correction rather than wondering why a number moved.
4. If the error was published and someone reported it, reply to them. A correction notice on the
   page is not required, but an acknowledgement to the person who found it is what keeps people
   reporting instead of leaving.

## Re-verification cadence

| Cadence | Action |
|---|---|
| Monthly | Refresh prices and availability for every record. |
| Quarterly | Re-read the full specification table for every record, not just the price. Manufacturers revise capacity and output figures without changing the model name, and an unannounced revision is exactly the case the source URL exists to catch. |
| On report | Immediately, whenever a reader disputes a figure. |

## Monitoring for silent breakage

Two failure modes do not announce themselves:

- **Broken source URLs.** A manufacturer retires a product page and the source link 404s. Nothing on
  the site breaks visually, but the traceability the whole project rests on is gone. A periodic link
  check on `source_url` values is the fix.
- **Sitemap drift.** Adding pages without resubmitting the sitemap means pages sit unindexed and the
  indexation number reads as a content problem when it is a plumbing problem.

## What to do when traffic is flat

At 90 days, evaluate against the stop conditions in `05-content-and-seo.md`, not against how the
work feels. The specific trap is responding to a flat quarter by publishing more pages faster, when
the likely cause is either that the pages are not good enough to index or that the niche thesis is
wrong. Publishing more of the same answers neither question.

## Backup and version control

The specification database is the asset. It should live in git from the first commit, and the
repository is the backup. There is no separate export to maintain.

## Compliance deployment: 2026-10-08 UTC

- Cloudflare Pages project: `powerstationsize`, production branch `main`.
- Deployment: `https://af99d723.powerstationsize.pages.dev`.
- Previous production deployment: `a1a0d3b2-604c-4b79-8618-699d358dbb17` (rollback reference).
- Command: `npx --no-install wrangler pages deploy dist --project-name=powerstationsize --branch=main --commit-dirty=true`.
- No Git commit was created. The deployment includes the local working-tree corrections.
- Validation: 49 tests passed; copy audit passed; Astro check reported zero errors, warnings, or
  hints; 183 pages built. All 79 catalog records passed validation, with 107 pre-existing warnings
  about unavailable price or weight fields. This did not re-verify manufacturer specifications.
- Browser verification passed on both local build and `https://powerstationsize.com`: no Google
  Analytics request before consent or after remembered rejection; a real Google tag loaded after
  acceptance and used a page location without query or fragment; withdrawal removed GA cookies
  and reloaded without the tag. Analytics collection requests were intercepted in the test browser
  rather than delivered to the property; this does not verify GA4 reporting in the account.
- Edited calculator loads round-tripped through new fragment links. Legacy query links migrated
  without losing the tested input. Privacy, terms, disclosure, About, methodology, CPAP guide,
  and CPAP scenario pages returned 200. Mobile consent controls were visible at 375 px without
  horizontal overflow, and no page JavaScript errors were observed.
- The production consent script matched `dist/privacy.js` byte-for-byte. The unique deployment
  served the revised policy, and both apex and `www` domains returned 200.

Still requires operator verification: actual operator identity/jurisdiction and any applicable
public-disclosure duties; GA4 property retention and enhanced-measurement settings; email and
provider retention practices; affiliate approval and program-specific disclosure wording before
monetization. Public copy no longer invents these facts or promises universal legal compliance.
