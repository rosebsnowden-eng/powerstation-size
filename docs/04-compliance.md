# 04 - Compliance gates

This document is the operational form of the pre-launch due diligence already completed for this
project. The gates below are the conditions that must hold before money is spent or a page is
published. They exist because an earlier project in this niche failed after paying for tooling
before reading the terms it depended on.

**Current status: site is live at powerstationsize.com.** These gates describe implementation
checks, not a legal certification. Gate E domain is registered. Affiliate approval and Gate F spending limits are still
outstanding and require actions only the site operator can take. Public legal pages identify the
site by name, domain, and `hello@powerstationsize.com`.

## Gate A - No price tracking

**Satisfied.**

The project does not provide price history, price-drop alerts, or historical price curves. This
is a product-scope decision, not a claim about every program's terms or possible exceptions.
Check and retain the applicable current agreement before enabling an affiliate integration.

What the code does instead:

- `price_usd_list` stores a manufacturer list price with a date, not a marketplace price.
- `meta.affiliate_approved` gates brand-program links. While false, the validator rejects any record
  containing a non-null `affiliate_links.brand_program`.
- Amazon Associates is a separate channel: `meta.amazon_tag` plus `affiliate_links.amazon`. Amazon
  URLs must include that tag. Marketplace prices are still not stored.
- No dependency on any price-history service exists in `package.json`, and none should be added.

What must not happen later: adding a price-comparison widget, a "watch this price" feature, an
Amazon price feed, or any script that polls a marketplace price.

## Gate B - CPAP content is treated as medical-adjacent

**Satisfied in copy. Requires ongoing discipline.**

A portable power station is not a medical device. Writing that it will safely carry someone through
a night of therapy is an unproven medical claim, and the failure mode is a person harmed during an
outage.

Rules enforced in the current copy:

1. Every CPAP surface states that the site is not medical advice and that a station is not a
   substitute for the battery the equipment manufacturer specifies.
2. CPAP with and without a heated humidifier are two separate device entries in
   `src/data/devices.ts`. They are never merged into one default.
3. Runtime is presented as an estimate with the formula visible.
4. Banned phrases, absent from the codebase and to stay absent: FDA approved backup, life support,
   will keep you breathing, safe for therapy, guaranteed overnight.
5. No first-person testing claims. The site does not say it ran a machine overnight, because it has
   not.
6. No `MedicalDevice` or `Review` schema on CPAP pages. `FAQPage` is the only structured data used.
7. Missing inrush data is not proof of no surge. Never recommend shortening prescribed therapy,
   testing until failure, or changing humidifier settings without provider or clinician guidance.

Adding a CPAP page means re-reading this gate first.

## Gate C - No unverified specification ships

**Satisfied, with a short database by design.**

Every published number must be readable on the manufacturer page named in its `source_url`, with a
`verified_at` date. `scripts/validate-data.mjs` checks required fields and stops the build when a
record is incomplete or still carries placeholder text. It cannot verify that a manufacturer
actually published a number; source verification remains a separate editorial task.

Consequences that are visible in the current database:

- Seven models in the original candidate list are absent, because their storefront pages returned
  only navigation markup or a 404 when fetched. They stay absent until a human reads the spec table.
- Several fields are null on present records, because the manufacturer does not publish them on the
  page used as the source. Null renders as a dash, never as an estimate.
- Two peak figures are labelled in `notes` as marketing boost ratings rather than inverter surge
  ratings, because that is what the manufacturer page calls them.

The temptation to fill the table with plausible numbers is the single largest risk to this site.
Plausible numbers are indistinguishable from verified ones until a reader checks.

## Gate D - Calculator formula and disclaimers

**Satisfied.**

The formula is the corrected one: duty cycle applied per device, inverter efficiency as a divisor,
a reserve margin multiplier, and a separate surge check against peak output. It is not the simpler
and wrong capacity-times-1.2 approach from the earliest planning notes.

Every results surface carries a standing notice covering:

- estimates rather than guarantees, with the reasons named
- no electrical advice, and a warning against backfeeding through wall or dryer outlets; household
  circuit connections require an approved, code-compliant transfer or isolation system
- the meaning of "solar generator": a battery with an optional solar input, which does not generate
  power

The calculator runs in the browser without submitting an input form. New share links and internal
calculator links encode state in the URL fragment. Anyone with the link can read it, and scripts
on the page can access it. Legacy query links reach the host in the initial request, then
`public/privacy.js` moves calculator parameters into the fragment before optional GA4 initialization.
Analytics page location and referrer are configured without queries or fragments. This cannot
undo historical collection or remove legacy URLs from provider logs.

GA4 stays unloaded until explicit consent or a non-expired remembered acceptance. The footer
allows withdrawal; rejecting removes accessible GA cookies and reloads if a tag was loaded.
The browser preference expires after 180 days. Test this using `test/privacy.test.ts` and browser
network inspection. Google Fonts remain external and are disclosed separately.

Do not mark the site universally compliant: the operator's actual jurisdiction and any required
identity disclosures remain to be confirmed. Verify GA4 property retention and enhanced-measurement
settings, provider retention, and email handling in the relevant accounts; do not infer them from
the measurement ID or promise automatic deletion without an implemented process.

## Gate E - Domain and affiliate approval

**Domain done. Affiliate approval still outstanding.**

The live domain is `powerstationsize.com` (registered 2026-10-07, Hostinger, expires 2027-10-07).
It contains `powerstation` and no brand name. Canonical URLs in `astro.config.mjs` and
`src/data/site.ts` use `https://powerstationsize.com`.

Remaining operator steps:

1. Do not register a domain containing a brand name: no `ecoflow`, `bluetti`, `jackery`, `anker`,
   `solix`, or `resmed`. BLUETTI's program explicitly prohibits trademark bidding and ad links to
   brand domains; other programs are likely to contain similar terms that only become visible after
   login.
2. The domain should describe the tool. Words like `watt`, `runtime`, `powerstation`, or
   `calculator` are appropriate. Words like `deals`, `lowestprice`, and `official` are not.
3. Publish three genuinely useful pages, plus the legal pages, with no affiliate links, then apply to
   one brand program on one network. Awin and Impact commonly reject or hold new sites with little
   content, so this is not automatic.
4. After approval, save the program terms as a PDF or screenshot before adding any link. Do not add
   the link before that.
5. `meta.affiliate_approved` in `src/data/power-stations.json` flips to `true` only after a program
   has approved the site and its terms are on file.
6. `site.affiliateLive` is derived from that approval flag and non-empty record links. It is not
   an independent toggle. Update the disclosure page with program names and required wording in
   the same release that first publishes approved links.

Until step 5, every model page renders an explicit note that no purchase link is listed because
programs must approve the site first. That note is generated, not hand-written, so it cannot be
forgotten on a new page.

## Gate F - Spending cap

**Outstanding, but nothing in this build spends money.**

Permitted before a first program approval: one year of a domain, free static hosting, and the free
Google account for analytics and search console. Nothing in this repository requires a paid service.

Not permitted before approval: price-history subscriptions, annual keyword tool subscriptions, paid
email platforms, simultaneous applications to several affiliate networks, or inventory purchases.

## Advertising claims

Two claims need care because regulators have acted on both in this product category:

**Solar generator.** The term implies the device generates electricity. It does not. The site uses
the phrase because it is what people search for, and explains what the device is the first time the
phrase appears on any page.

**Whole-home backup.** Writing that a unit powers most of a home, without stating the wattage
ceiling and the requirement for a transfer switch, repeats a manufacturer claim that is misleading
on its own. The site does not repeat it.

## FTC disclosure

Required on every page carrying an affiliate link, and on the page footer. The wording used here
says a commission may be earned, that it does not affect the specifications or the calculator
output, and that no payment is accepted for placement. The Amazon Associates statement is added only
if an Amazon link is actually present.

## Privacy obligations

Live at launch, not later: a privacy page covering analytics, email, and affiliate cookies; a
contact email that a human monitors; and the statement that the calculator does not transmit
device data. Public pages identify the site by its name and domain. They do not collect a
personal mailing address.

The site name, contact email, and analytics ID live in `src/data/site.ts`.
