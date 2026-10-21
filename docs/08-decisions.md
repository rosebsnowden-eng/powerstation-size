# 08 - Decisions

A record of the choices that are not obvious from the code, and the reasoning, so they can be
revisited deliberately rather than relitigated by accident.

## The plan was narrowed, and the narrower version governs

**Context.** The research material for this project contains a genuine contradiction. One document
proposes a 150 page, 90 day content pipeline with a kill criterion measured in published pages. A
later analysis, and the pre-launch compliance review, both argue for three pages built carefully
first, with compliance gates cleared before any money is spent.

**Decision.** The narrower plan governs. The wider one is not implemented.

**Why.** The page-count figures in the earlier document rested on keyword exports that were "all
keywords" reports rather than phrase-match reports. Their totals included camping lanterns,
traditional generators, and solar panels, none of which this site addresses. A production target
derived from those totals would have been calibrated against a market that does not exist. The
later analysis checked individual terms and found the real opportunity is narrower and more
specific than the headline numbers suggested.

**Consequence.** The site is smaller than the original plan and the 90 day stop condition is about
whether the tool is useful and the specifications are right, not how many pages exist.

## The specification database is enforced by the build

**Decision.** `npm run build` runs a validation script first and fails on incomplete or placeholder
data. Every record needs a source URL and a verification date.

**Why.** An earlier attempt at a site in this space failed because it depended on data it did not
have permission to use. The corresponding risk here is different and subtler: not a legal problem but
a credibility one. A plausible-looking capacity figure that nobody verified is indistinguishable from
a correct one until a reader checks it, and at that point the site has taught its readers to distrust
it.

**Consequence.** The database is smaller than it could be. Seven models from the candidate list are
absent because their pages could not be read reliably. Several fields are null on the records that
are present. That is the intended trade.

## Null instead of an estimate

**Decision.** When a manufacturer page does not publish a figure, the field is null and renders as
"n/a". It is never filled from a retailer listing, an aggregator, or a conversion we performed
ourselves.

**Why.** A converted or borrowed figure carries the same visual authority as a verified one but none
of the traceability. The EcoFlow pages, for instance, state weight in kilograms only, and do not
list port counts at all. A three-line conversion would produce a complete-looking table built on
numbers no source supports.

**Consequence.** Some model pages look sparse. That is honest.

## Peak figures are labelled for what they are

**Decision.** Where a manufacturer's "peak" number is a boost or surge-pad rating for resistive
loads rather than an inverter surge rating, the record keeps the number and the note explains the
distinction.

**Why.** These figures are used in a surge check against motor startup, which is a different
electrical event. Using a resistive-load boost rating as if it were a surge rating would produce a
confidently wrong recommendation on exactly the use case, running a fridge or a tool, where a wrong
answer costs the reader a returned product.

## Metrics: not modelled

**Decision.** The calculator does not model temperature, battery ageing, or per-device variation.

**Why.** Each is real and each would require a data source this site does not have. A temperature
model built on a guessed derating curve would be false precision dressed as sophistication. The
limitations are stated on the methodology page instead, so a reader can apply their own judgement.

**Revisit if** the site ever conducts its own testing, at which point a measured derating curve
becomes a genuine differentiator rather than a guess.

## Static site, no server, no data collection

**Decision.** The calculator runs entirely in the browser and nothing about a reader's device list
leaves it.

**Why.** Beyond the privacy benefit, which the audience for a medical-adjacent tool has reason to
care about, a purely client-side tool has no API to secure, no rate limiting to configure, no
database to back up, and no way to leak what it does not receive. For a one-person operation that is
a large reduction in surface area.

## Design restraint over visual expression

**Decision.** The design dials sit at variance 4, motion 2, density 5, which is the low end. No
scroll animation, no hero imagery, no decorative graphics.

**Why.** The content includes medical-adjacent guidance and electrical safety warnings. A page that
performs visually while giving safety-adjacent advice creates a mismatch between tone and stakes.
The restraint is also what makes the numbers legible, which is the actual product.

**Note on scope.** The design skill used for this project excludes data tables, multi-step forms,
and dashboard surfaces from its remit. The calculator and the comparison table are therefore built
as conventional accessible components, with the skill applied to the surrounding marketing and
editorial pages. `03-design-system.md` records which surface falls on which side of that line.

## Product packshots, not lifestyle photography

**Decision.** Model pages and the calculator picker use manufacturer packshots. Marketing surfaces
still have no stock campsite photography and no fake product screenshots.

**Why.** A reader choosing between two units needs to recognise the object. A stock photograph of a
campsite still adds nothing to a page whose job is arithmetic, and a hand-built "product preview"
out of styled boxes is a pattern the design skill bans outright.

**Revisit if** original photography or licensed lifestyle assets become available, in which case
they belong above the calculator rather than in the hero.
