# 02 - Data contract

Two data files drive the site. Both are typed or validated, and neither may contain a number that
cannot be traced to a source.

## `src/data/power-stations.json`

The specification database. One record per model.

### Required fields

The build fails without these.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | URL slug, unique. Becomes `/stations/<id>/`. |
| `brand` | string | Manufacturer name as the manufacturer writes it. |
| `model` | string | Model name. |
| `capacity_wh` | positive number | Usable rated capacity in watt-hours. |
| `output_continuous_w` | positive number | Continuous AC output. |
| `output_peak_w` | positive number | Peak or surge rating. Must be >= continuous. |
| `battery_chemistry` | string | `LiFePO4`, `NMC`, or as stated. |
| `source_url` | absolute URL | The manufacturer page the numbers came from. |
| `verified_at` | `YYYY-MM-DD` | The date those numbers were read. |

### Optional fields

Rendered when present, hidden when null. Null means "not published on the source page", never
"approximately this".

`solar_input_max_w`, `cycles`, `warranty_years`, `weight_lbs`, `dimensions`, `ac_ports`,
`usb_a_ports`, `usb_c_ports`, `dc_ports`, `price_usd_list`, `price_updated`, `release_year`,
`best_for`, `affiliate_links`, `availability`, `notes`, `series`.

`peak_is_surge` is required and boolean. `true` means `output_peak_w` is an inverter surge and
may be compared with a motor start. `false` means the figure is a resistive boost (X-Boost,
Power Lifting, SurgePad, or similar). The calculator must not clear a motor against a false value.
The build fails if the field is missing.

### Rules

1. **Numbers come from the manufacturer page named in `source_url`.** If a figure is not on that
   page, it stays null. Third-party spec aggregators are not sources.
2. **Peak is not boost.** A figure the manufacturer labels X-Boost, Power Lifting, or similar is a
   rating for resistive loads, not an inverter surge rating. Record it if it is the only peak figure
   available, and say so in `notes`.
3. **Availability is recorded, not inferred.** A page showing an out-of-stock notice gets
   `"out_of_stock"`. Values: `in_stock`, `out_of_stock`, `refurb_only`, `discontinued`, `unknown`.
4. **Brand affiliate links require approval.** While `meta.affiliate_approved` is `false`, every
   `affiliate_links.brand_program` value must be null. Amazon Associates is a separate channel:
   `affiliate_links.amazon` may be set when `meta.amazon_tag` is set, and the URL must include that
   tag. The build enforces this.
5. **Prices carry a date.** `price_usd_list` is meaningless without `price_updated`. A price older
   than 30 days produces a build warning.
6. **Transcribe, do not convert.** If a page states weight in kilograms only, `weight_lbs` stays
   null and the metric figure goes in `notes`. Untraceable conversions are the same class of error
   as invented numbers.

### Current state

Seventy-nine records, all verified. Weight, dimensions, port counts, and list price are null on many
of them because the manufacturer pages do not publish those figures. Null fields are omitted from
tables rather than guessed. `availability: unknown` means the page did not state stock status; it
is not shown as a warning badge. Discontinued records stay in the JSON for the source trail and
are hidden from the comparison table and the calculator picker.

Records stay out of the database until a human can read the specification table on the manufacturer
page named in `source_url`. A missing model costs nothing; a guessed one costs the site's credibility.

## `src/data/devices.ts`

The device power library. Each entry is a consumer appliance with a typical draw.

| Field | Meaning |
|---|---|
| `id` | Stable identifier, also used in shareable URLs. |
| `label` | Display name. |
| `typical_w` | Typical continuous draw in watts. |
| `surge_w` | Startup spike, or null for devices without a motor or compressor. |
| `duty_cycle` | Fraction of the hour the device actually draws power, 0 to 1. |
| `default_hours` | Prefilled hours per day. |
| `source_type` | `official`, `standards`, or `estimated`. |
| `source_url` | Present for `official` and `standards` sources. |
| `group` | Picker grouping. |

### Rules

1. **CPAP with and without a heated humidifier are two separate entries.** They must never be
   collapsed into one default. The difference is large enough to change a purchase decision, and
   merging them produces an answer that is wrong in the direction that matters most.
2. **Devices with a compressor carry a `surge_w`.** A fridge or freezer without a recorded surge
   cannot be checked against a station's peak output, which defeats a core feature.
3. **Every entry is currently `source_type: "estimated"`.** These are published engineering ranges,
   not measurements. When a manufacturer figure is added, set `source_type` to `official` and record
   the URL. The calculator shows `source_type` and the device note on each load row.

## `src/lib/calculate.ts`

The calculation library. Pure functions, no DOM access, imported by both the calculator component and
the test suite in `test/calculate.test.ts`.

| Export | Purpose |
|---|---|
| `sizeSystem(devices, options)` | Daily energy, recommended capacity, simultaneous draw, peak surge. |
| `runtimeFor(station, devices, options)` | Average and worst-case hours, plus which limit binds. |
| `encodeScenario` / `decodeScenario` | Shareable URL encoding for a device list. |
| `chargePlan(dailyWh, recommendedWh, options)` | Backup-day capacity and solar array sizing. |
| `matchStations(stations, load)` | Models that clear capacity, output, and surge, smallest first. |
| `catalogLimit(stations, load)` | The limit that binds when nothing fits, found by relaxation. |
| `solarArrayFit(neededW, maxInputW)` | Whether a required array fits a station's published input limit. |
| `INVERTER_EFFICIENCY`, `RESERVE_FACTOR`, `USABLE_CAPACITY_FACTOR` | The default constants. |

Both calculation functions take an options object, so the efficiency and reserve the interface
exposes are the values actually applied. `sizeSystem` throws a `RangeError` on an out-of-range
efficiency or reserve rather than returning a number computed from a nonsensical constant.

`runtimeFor` returns `bindingConstraint`, which is `surge`, `continuous`, or `capacity` depending on
which limit fails first. The order is deliberate: surge blocks startup, continuous blocks operation,
and capacity only matters once the station can actually run the load.

`catalogLimit` answers the same question for the whole catalog rather than one station. It tests each
candidate constraint against real records instead of comparing the load with the maximum of each
field, because those maxima are usually held by different models, and returns `combination` when no
single relaxation would admit a model. A `surge_unverified` result means the records that have the
output publish only a resistive boost rating, which is a different answer from an inadequate one and
must not be shown as a failure of the load.

`solarArrayFit` returns null when a station's solar input limit is not published. An unpublished limit
is unknown, never a pass.

## Adding a device

Append an entry to `devices` in `src/data/devices.ts`, pick the right `group`, and set
`source_type` honestly. No other file changes are needed; the picker, the presets, and the
calculation all read from this array.

## `src/data/scenarios.ts`

Worked loads behind `/scenarios/`. A scenario names device ids from the library, an hours override,
and optionally a wattage or duty override, plus the backup days, sun hours, and which disclaimers
apply.

| Field | Notes |
|---|---|
| `id` | URL slug. Becomes `/scenarios/<id>/`. |
| `rows[].id` | Must exist in `devices.ts`. An unknown id throws at build time. |
| `rows[].why` | One line explaining the row, shown in the load table. |
| `backupDays`, `sunHours` | Must match options the calculator's selects offer, since the link carries them. |
| `insight` | Which limit usually binds here. |
| `trim` | What to cut first when nothing fits. |

`analyzeScenario()` computes the page. It calls `sizeSystem()`, `chargePlan()`, and `matchStations()`,
so the rendered figures are the same numbers the browser bundle produces for the equivalent
`?load=` URL. If the two ever disagree, the test suite is the place that should fail.

## Adding a scenario

Add an entry to `scenarios`, referencing existing device ids. Check the rendered page states the
binding limit and that its `insight` matches what the math actually produced, because a plausible
sounding claim that the numbers contradict is the failure mode these pages are most exposed to.
