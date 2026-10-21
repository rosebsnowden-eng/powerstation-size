# 05 - Content plan and SEO

## The correction this plan reflects

Earlier planning documents for this project described a 150 page, 90 day content pipeline. That plan
was revised after a closer look at the keyword data, and the revision is what governs. The short
version: the export files used to justify the larger numbers were "all keywords" reports rather than
phrase-match reports, so their totals included adjacent categories like camping lanterns, traditional
generators, and solar panels. Those figures are not this site's addressable market.

The plan below uses only terms that were individually checked, with volume and difficulty recorded
per term.

## Verified target terms

| Page | Primary term | Volume | Difficulty | Intent |
|---|---|---:|---:|---|
| `/calculator/` | power station calculator | 110 | 6 | Informational |
| `/calculator/` | portable power station calculator | 90 | 8 | Informational |
| `/guides/cpap-backup-power/` | battery backup for cpap | 480 | 16 | Info / commercial |
| `/guides/cpap-backup-power/` | cpap battery backup | 1,900 | 20 | Info / commercial |
| `/guides/solar-generator-sizing/` | what size solar generator do i need | 140 | 3 | Informational |

Two things are worth stating plainly about this table. The calculator terms have low difficulty and
low volume: they are an entry point and a link magnet, not a traffic engine. The CPAP terms carry the
real commercial intent, and they are also where the liability sits, which is why the compliance rules
for that page are the strictest on the site.

## Sequencing

The order is deliberate and differs from the original plan.

**First, three pages.** The calculator, the CPAP decision page, and the solar sizing guide, plus the
legal pages. Amazon Associates links may appear on the calculator and the CPAP picks once
`meta.amazon_tag` is set. Brand-program links stay off until `affiliate_approved` is true.

**Then, one brand application.** One program, on one network. Approval terms saved to disk before any
link goes live.

**Then, expansion, in this order:**

1. Camping content. Real commercial volume at difficulty in the low 30s, which is harder than the
   CPAP terms but achievable once the site has some standing.
2. Home backup content, but only after a narrower phrase-match export confirms the term pool is not
   mostly traditional generators and home battery systems. The earlier export was contaminated with
   both.
3. Programmatic runtime pages that vary the *appliance*, and only once the device power library has
   per-field sources. Several hundred pages built on estimated wattages is scaled misinformation.
   Per-station refrigerator pages are a different case: the appliance is one estimated load, and the
   variable is a verified station record.

**Explicitly not doing:** a head-on push on `best portable power station`. That term is held by large
media outlets and brand sites with domain authority this site does not have and will not have for
some time.

## What makes a page publishable

A page ships when all of these are true:

1. Every specification on it comes from the database, and every database record has a source URL.
2. It contains at least one original table or calculation that a reader could not get from a
   manufacturer product page.
3. It answers one of: how much capacity, how much output, or what it will not do.
4. Every internal link points at a page that exists.
5. Affiliate links, if any, are to approved programs, are five or fewer, and have disclosure adjacent
   to the button.

## Scenario pages

`/scenarios/` holds five hand-written worked loads: a CPAP night without the humidifier, the same
night with it, a fridge outage with router and lights, a camping day, and a power tool off grid. Each
one exists because the calculator alone has a cold start problem. A reader arriving from search has to
know which rows to add before they get any answer, and a scenario hands them a plausible load plus the
reasoning behind it.

Three rules keep this from becoming the page farm the sequencing section rules out:

1. Every scenario is written by hand and can be defended. There is no template that expands into more.
2. Each page states which limit binds before it names a model. The answer to "what size" is incomplete
   without "and here is what fails first".
3. The device library is still mostly estimated wattages. Scenario pages inherit that limitation and
   say so. When a row's source is an engineering range rather than a measurement, the page must not
   present the result as a measurement.

These pages are a middle path on the programmatic question below: a handful of static pages a human
wrote, each answering one question, rather than hundreds generated from a template.

## Brand hubs and refrigerator pages

`/brands/` is four manufacturer tables, not four review sections. Adding a verified station adds a
row on the hub, a spec page, and a refrigerator verdict page.

`/stations/<id>/refrigerator/` answers whether that unit starts an estimated full-size fridge
(150 W running, 1,200 W startup, 35 percent duty). The fridge wattage is an engineering range and
is labelled as such. The station figures are manufacturer specs. A boost rating does not clear the
compressor. This is the one programmatic template that is allowed before the device library has
per-field sources, because the variable that changes per URL is a verified station, not an
estimated appliance.

`/guides/camping-power-station/` and `/guides/cpap-backup-power/` are decision pages: they size a
load with the same library as the calculator, then name three verified stations with Amazon links.
They still use `matchStations()` so the picks cannot drift from the tool. They are not first-hand
reviews.

`/guides/surge-vs-boost/` is the cross-brand table of which peak figures are inverter surge and
which are resistive boost.

## Structured data

`FAQPage` on the calculator page, and `Article` on guides. Nothing else.

`Review` and `MedicalDevice` markup are specifically excluded. Review markup implies first-hand
testing this site does not perform, and medical device markup on a page about a camping battery
would be a false claim in machine-readable form.

## Internal linking

Every page links to the calculator, because the calculator is the only page that converts a reader
into someone who has made a decision. The guides link to model pages, and model pages link back to
the calculator with the reader's likely load in mind. Scenario pages link out both ways: to the
calculator with the load prefilled, and to the model pages of the units that clear it.

## Measurement

Four numbers reviewed weekly, recorded rather than remembered:

1. Pages published
2. Indexation rate, from Search Console
3. Organic sessions, from GA4
4. Affiliate commissions

The first three months should be expected to produce roughly nothing in the fourth column. Stating
that in advance is the point: the failure mode for a site like this is not a bad algorithm month, it
is abandoning the plan in week six because revenue is zero when it was always going to be zero.

## Success and stop conditions

Success at 90 days: the calculator is indexed and receiving impressions, the CPAP page has drawn no
complaints and no takedowns, at least one brand program is paying commission, and the specification
database has zero known errors.

Stop conditions, decided in advance so the decision is not made emotionally:

- At 90 days, if published pages are indexed at under 50 percent and traffic has not moved, the
  niche thesis is wrong. Keep the tooling, change the subject.
- If the four main brand programs cut commissions below 3 percent together, the revenue model is
  broken even if the traffic is fine.
- If the specification database cannot be kept accurate, stop publishing new pages until it can.
  A single wrong capacity figure is a worse outcome than a thin site.
