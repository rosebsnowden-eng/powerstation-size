/**
 * Unit tests for the sizing and runtime math.
 *
 * These cover the three behaviours most likely to be broken silently by a
 * later edit: duty cycle reducing daily energy, surge excluding a station that
 * has enough capacity, and the inverter divisor raising (not lowering) the
 * recommendation. A regression in any of them would ship a wrong number, which
 * is the one failure this site cannot absorb.
 *
 * Run with: npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  sizeSystem,
  runtimeFor,
  compareStations,
  chargePlan,
  encodeScenario,
  decodeScenario,
  matchStations,
  catalogLimit,
  solarArrayFit,
  type DeviceInput,
  type LoadSummary,
  type MatchableStation,
  type StationSpec,
} from '../src/lib/calculate.ts';

const station = (over: Partial<StationSpec> = {}): StationSpec => ({
  id: 'test-unit',
  brand: 'Test',
  model: 'Unit',
  capacity_wh: 1000,
  output_continuous_w: 1800,
  output_peak_w: 2200,
  weight_lbs: null,
  price_usd_list: null,
  best_for: [],
  affiliate_url: null,
  ...over,
});

const device = (over: Partial<DeviceInput> = {}): DeviceInput => ({
  id: 'd',
  label: 'Device',
  watts: 100,
  hours: 1,
  dutyCycle: 1,
  surgeWatts: null,
  ...over,
});

test('duty cycle reduces daily energy', () => {
  const always = sizeSystem([device({ watts: 150, hours: 8, dutyCycle: 1 })]);
  const cycling = sizeSystem([device({ watts: 150, hours: 8, dutyCycle: 0.35 })]);

  assert.equal(always.rawDailyWh, 1200);
  assert.equal(cycling.rawDailyWh, 420);
  assert.ok(
    cycling.recommendedWh < always.recommendedWh,
    'a cycling load must recommend less capacity than a continuous one',
  );
});

test('inverter efficiency divides, so a lower efficiency recommends more', () => {
  const devices = [device({ watts: 100, hours: 10, dutyCycle: 1 })];

  const efficient = sizeSystem(devices, { inverterEfficiency: 0.9 });
  const lossy = sizeSystem(devices, { inverterEfficiency: 0.8 });

  assert.equal(efficient.rawDailyWh, lossy.rawDailyWh);
  assert.ok(
    lossy.recommendedWh > efficient.recommendedWh,
    'lower efficiency must raise the recommendation, not lower it',
  );
  assert.equal(sizeSystem(devices, { inverterEfficiency: 0.5 }).recommendedWh, 1000 / 0.5 * 1.2);
});

test('reserve factor multiplies the recommendation', () => {
  const devices = [device({ watts: 100, hours: 10, dutyCycle: 1 })];
  const standard = sizeSystem(devices, { reserveFactor: 1.2 });
  const cold = sizeSystem(devices, { reserveFactor: 1.35 });
  assert.ok(cold.recommendedWh > standard.recommendedWh);
});

test('invalid efficiency and reserve are rejected', () => {
  const devices = [device()];
  assert.throws(() => sizeSystem(devices, { inverterEfficiency: 0 }), RangeError);
  assert.throws(() => sizeSystem(devices, { inverterEfficiency: 1.5 }), RangeError);
  assert.throws(() => sizeSystem(devices, { reserveFactor: 0.9 }), RangeError);
});

test('CPAP with humidifier needs more than without', () => {
  const dry = sizeSystem([device({ watts: 45, hours: 8, dutyCycle: 1 })]);
  const humid = sizeSystem([device({ watts: 80, hours: 8, dutyCycle: 1 })]);
  assert.ok(humid.recommendedWh > dry.recommendedWh);
  // The ratio should track the wattage ratio, not be a fixed step.
  assert.ok(Math.abs(humid.recommendedWh / dry.recommendedWh - 80 / 45) < 1e-9);
});

test('surge above peak output is reported as the binding constraint', () => {
  const fridge = device({ watts: 150, hours: 8, dutyCycle: 0.35, surgeWatts: 3000 });
  const r = runtimeFor(station({ output_peak_w: 2200 }), [fridge]);

  assert.equal(r.surgeBlocked, true);
  assert.equal(r.bindingConstraint, 'surge');
  assert.equal(r.peakSurgeW, 3000);
});

test('continuous overload is reported when surge passes', () => {
  const load = [device({ watts: 1000 }), device({ watts: 1000 })];
  const r = runtimeFor(station({ output_continuous_w: 1800, output_peak_w: 3000 }), load);

  assert.equal(r.surgeBlocked, false);
  assert.equal(r.overloaded, true);
  assert.equal(r.bindingConstraint, 'continuous');
});

test('a covered load has no binding constraint', () => {
  const r = runtimeFor(station(), [device({ watts: 100, hours: 5 })]);
  assert.equal(r.bindingConstraint, null);
  assert.equal(r.overloaded, false);
  assert.equal(r.surgeBlocked, false);
  assert.equal(r.surgeUnverified, false);
});

test('a resistive boost rating is not treated as a surge clearance', () => {
  const fridge = device({ watts: 150, hours: 8, dutyCycle: 0.35, surgeWatts: 1200 });
  const r = runtimeFor(station({ output_peak_w: 3400, peak_is_surge: false }), [fridge]);

  assert.equal(r.surgeBlocked, false);
  assert.equal(r.surgeUnverified, true);
  assert.equal(r.bindingConstraint, 'surge_unverified');
});

test('compareStations keeps caller order and runs the same load twice', () => {
  const load = [device({ watts: 100, hours: 4, dutyCycle: 1, surgeWatts: 800 })];
  const small = station({ id: 'a', capacity_wh: 500, output_peak_w: 400 });
  const large = station({ id: 'b', capacity_wh: 2000 });
  const [first, second] = compareStations(small, large, load);

  assert.equal(first.station.id, 'a');
  assert.equal(second.station.id, 'b');
  assert.equal(first.runtime.bindingConstraint, 'surge');
  assert.equal(second.runtime.bindingConstraint, null);
  assert.ok(second.runtime.averageHours > first.runtime.averageHours);
});

test('runtime is duty weighted and bounded by worst case', () => {
  const fridge = device({ watts: 150, hours: 8, dutyCycle: 0.35 });
  const r = runtimeFor(station({ capacity_wh: 1000 }), [fridge]);

  // usable = 1000 * 0.85 = 850 Wh
  // average draw = 150 * 0.35 = 52.5 W  -> 16.19 h
  assert.ok(Math.abs(r.averageHours - 850 / 52.5) < 1e-9);
  // worst case = 150 W -> 5.67 h
  assert.ok(Math.abs(r.worstCaseHours - 850 / 150) < 1e-9);
  assert.ok(r.averageHours > r.worstCaseHours, 'duty-weighted must exceed worst case');
});

test('empty device list yields zero, not NaN or Infinity', () => {
  const sizing = sizeSystem([]);
  assert.equal(sizing.rawDailyWh, 0);
  assert.equal(sizing.recommendedWh, 0);

  const r = runtimeFor(station(), []);
  assert.equal(r.averageHours, 0);
  assert.equal(r.worstCaseHours, 0);
  assert.equal(r.bindingConstraint, null);
});

test('scenario round-trips through the URL encoding', () => {
  const devices = [
    device({ id: 'fridge-home', watts: 150, hours: 8, dutyCycle: 0.35 }),
    device({ id: 'wifi-router', watts: 12, hours: 8, dutyCycle: 1 }),
  ];
  const encoded = encodeScenario(devices);
  assert.equal(encoded, 'fridge-home:150:8:0.35,wifi-router:12:8:1');

  const decoded = decodeScenario(encoded);
  assert.ok(decoded);
  assert.equal(decoded.length, 2);
  assert.equal(decoded[0].id, 'fridge-home');
  assert.equal(decoded[0].watts, 150);
  assert.equal(decoded[0].dutyCycle, 0.35);
});

test('malformed scenario returns null instead of throwing', () => {
  assert.equal(decodeScenario('fridge-home:abc:8:1'), null);
  assert.equal(decodeScenario(''), null);
});

test('chargePlan scales capacity by backup days and sizes solar from daily Wh', () => {
  const plan = chargePlan(850, 1200, { backupDays: 2, sunHours: 5, solarInputW: 200 });
  assert.equal(plan.recommendedWh, 2400);
  assert.equal(Math.round(plan.solarNeededW), 200);
  assert.equal(plan.solarWhPerDay, 850);
  assert.equal(plan.solarCoveragePct, 1);
});

test('chargePlan coverage is 100 percent when panels exceed the day', () => {
  const plan = chargePlan(100, 200, { sunHours: 5, solarInputW: 400 });
  assert.equal(plan.solarCoveragePct, 1);
});

test('chargePlan uses the inverter efficiency passed in, not the default', () => {
  const dailyWh = 850;
  const sunHours = 5;
  const conservative = chargePlan(dailyWh, 1200, {
    sunHours,
    inverterEfficiency: 0.8,
    solarInputW: 200,
  });
  const efficient = chargePlan(dailyWh, 1200, {
    sunHours,
    inverterEfficiency: 0.9,
    solarInputW: 200,
  });

  assert.equal(Math.round(conservative.solarNeededW), Math.round(dailyWh / (sunHours * 0.8)));
  assert.equal(Math.round(efficient.solarNeededW), Math.round(dailyWh / (sunHours * 0.9)));
  assert.ok(
    conservative.solarNeededW > efficient.solarNeededW,
    'a lower inverter efficiency must size a larger array',
  );
  assert.equal(conservative.solarWhPerDay, 200 * sunHours * 0.8);
});

test('the documented outage scenario produces the documented numbers', () => {
  // This mirrors the manual verification in docs/06 and the README. If the
  // formula changes, this test is the tripwire.
  const outage = [
    device({ id: 'fridge-home', watts: 150, hours: 8, dutyCycle: 0.35, surgeWatts: 1200 }),
    device({ id: 'wifi-router', watts: 12, hours: 8, dutyCycle: 1 }),
    device({ id: 'led-light', watts: 9, hours: 5, dutyCycle: 1 }),
    device({ id: 'phone-charge', watts: 12, hours: 2, dutyCycle: 1 }),
  ];
  const sizing = sizeSystem(outage);

  assert.equal(sizing.rawDailyWh, 585);
  assert.equal(sizing.simultaneousW, 183);
  assert.equal(sizing.peakSurgeW, 1200);
  assert.equal(Math.round(sizing.recommendedWh), 826);
});

const matchable = (over: Partial<MatchableStation> = {}): MatchableStation => ({
  id: 'm',
  brand: 'Test',
  model: 'Match',
  capacity_wh: 1000,
  output_continuous_w: 1000,
  output_peak_w: 2000,
  peak_is_surge: true,
  ...over,
});

const load = (over: Partial<LoadSummary> = {}): LoadSummary => ({
  recommendedWh: 826,
  simultaneousW: 183,
  peakSurgeW: 0,
  ...over,
});

test('a boost rating does not clear a motor start', () => {
  const boost = matchable({ id: 'boost', peak_is_surge: false, output_peak_w: 3000 });
  const surge = matchable({ id: 'surge', peak_is_surge: true, output_peak_w: 1500 });

  // Without a motor in the load, both are candidates on capacity and output.
  const noMotor = matchStations([boost, surge], load());
  assert.equal(noMotor.eligible.length, 2);

  // With a 1,200 W compressor start, only the verified inverter surge qualifies.
  const withMotor = matchStations([boost, surge], load({ peakSurgeW: 1200 }));
  assert.deepEqual(
    withMotor.eligible.map((e) => e.station.id),
    ['surge'],
  );
  assert.deepEqual(
    withMotor.unverifiedBoost.map((s) => s.id),
    ['boost'],
    'the excluded boost station must be reported, not silently dropped',
  );
});

test('capacity and continuous output each exclude on their own', () => {
  const small = matchable({ id: 'small', capacity_wh: 500, output_continuous_w: 2000 });
  const weak = matchable({ id: 'weak', capacity_wh: 2000, output_continuous_w: 100 });
  const pool = [small, weak];
  const heavy = load({ recommendedWh: 826, simultaneousW: 183 });

  assert.equal(matchStations(pool, heavy).eligible.length, 0);
  // No single station covers both figures, but the weak-output one would if its
  // inverter were larger, so output is the limit worth naming.
  assert.equal(catalogLimit(pool, heavy), 'continuous');
});

test('continuous output is reported once capacity is satisfied', () => {
  const weak = matchable({ id: 'weak', capacity_wh: 2000, output_continuous_w: 100 });
  const limit = catalogLimit([weak], load({ recommendedWh: 826, simultaneousW: 183 }));

  assert.equal(limit, 'continuous');
});

test('the limit reports a combination when no single fix admits a model', () => {
  // One unit has the output but not the capacity or the surge; the other has
  // the capacity but neither the output nor the surge. Relaxing one constraint
  // still leaves every candidate failing, so naming a single limit would send
  // the reader chasing a fix that does not exist.
  const pool = [
    matchable({ id: 'a', capacity_wh: 500, output_continuous_w: 5000, output_peak_w: 1000 }),
    matchable({ id: 'b', capacity_wh: 2000, output_continuous_w: 100, output_peak_w: 1000 }),
  ];

  assert.equal(
    catalogLimit(pool, load({ recommendedWh: 826, simultaneousW: 183, peakSurgeW: 1200 })),
    'combination',
  );
});

test('the smallest adequate model sorts first and spare capacity is reported', () => {
  const big = matchable({ id: 'big', capacity_wh: 3000 });
  const small = matchable({ id: 'small', capacity_wh: 1000 });

  const result = matchStations([big, small], load({ recommendedWh: 826 }));

  assert.deepEqual(
    result.eligible.map((e) => e.station.id),
    ['small', 'big'],
    'the useful answer is the least you can buy that clears every limit',
  );
  assert.equal(result.eligible[0].spareWh, 174);
});

test('a motor load with no verified surge rating reports surge_unverified', () => {
  const boostOnly = [matchable({ id: 'b1', peak_is_surge: false })];

  assert.equal(
    catalogLimit(boostOnly, load({ peakSurgeW: 1200 })),
    'surge_unverified',
    'an unverifiable pool is a different answer from an inadequate one',
  );
});

test('an unpublished solar input limit is unknown, never a pass', () => {
  assert.equal(solarArrayFit(400, null), null);
  assert.equal(solarArrayFit(400, undefined), null);
  assert.equal(solarArrayFit(400, 0), null);
  assert.deepEqual(solarArrayFit(400, 500), { fits: true, maxInputW: 500 });
  assert.deepEqual(solarArrayFit(800, 500), { fits: false, maxInputW: 500 });
});
