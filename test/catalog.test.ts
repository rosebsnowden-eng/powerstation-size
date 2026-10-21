/**
 * Catalog helpers and the refrigerator verdict.
 *
 * The brand hubs and per-station refrigerator pages are generated from these
 * functions. A later edit that maps peak_is_surge incorrectly, or that lets a
 * boost rating clear a compressor start, would ship on dozens of URLs at once.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  BRANDS,
  brandSlug,
  brandFromSlug,
  fridgeHomeLoad,
  fridgeQuery,
  isCurrent,
  isVerificationStale,
  toStationSpec,
} from '../src/lib/catalog.ts';
import { runtimeFor } from '../src/lib/calculate.ts';

const here = dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(readFileSync(join(here, '..', 'src', 'data', 'power-stations.json'), 'utf8'));

test('every database brand has a hub slug, and slugs round trip', () => {
  const names = new Set(BRANDS.map((b) => b.name));
  for (const station of db.stations) {
    assert.ok(names.has(station.brand), `unmapped brand "${station.brand}" on ${station.id}`);
    const slug = brandSlug(station.brand);
    assert.equal(brandFromSlug(slug ?? ''), station.brand);
  }
});

test('the fridge load is the documented home refrigerator, not a 12V cooler', () => {
  const load = fridgeHomeLoad();
  assert.equal(load.length, 1);
  assert.equal(load[0].id, 'fridge-home');
  assert.equal(load[0].watts, 150);
  assert.equal(load[0].hours, 8);
  assert.equal(load[0].dutyCycle, 0.35);
  assert.equal(load[0].surgeWatts, 1200);
  assert.equal(fridgeQuery(load), 'fridge-home:150:8:0.35');
});

test('a boost rating does not clear the fridge compressor', () => {
  const boost = toStationSpec({
    id: 'boost',
    brand: 'Test',
    model: 'Boost',
    capacity_wh: 2000,
    output_continuous_w: 1800,
    output_peak_w: 3000,
    weight_lbs: null,
    price_usd_list: null,
    best_for: [],
    peak_is_surge: false,
    availability: 'in_stock',
    source_url: 'https://example.com',
    verified_at: '2026-01-01',
    battery_chemistry: 'LiFePO4',
  });
  const result = runtimeFor(boost, fridgeHomeLoad());
  assert.equal(result.bindingConstraint, 'surge_unverified');
  assert.equal(result.surgeUnverified, true);
  assert.equal(result.surgeBlocked, false);
});

test('an inverter surge below 1,200 W blocks the fridge start', () => {
  const weak = toStationSpec({
    id: 'weak',
    brand: 'Test',
    model: 'Weak',
    capacity_wh: 2000,
    output_continuous_w: 1800,
    output_peak_w: 1000,
    weight_lbs: null,
    price_usd_list: null,
    best_for: [],
    peak_is_surge: true,
    availability: 'in_stock',
    source_url: 'https://example.com',
    verified_at: '2026-01-01',
    battery_chemistry: 'LiFePO4',
  });
  const result = runtimeFor(weak, fridgeHomeLoad());
  assert.equal(result.bindingConstraint, 'surge');
  assert.equal(result.surgeBlocked, true);
});

test('a station that clears the fridge reports hours, not a marketing claim', () => {
  const ok = toStationSpec({
    id: 'ok',
    brand: 'Test',
    model: 'Ok',
    capacity_wh: 1024,
    output_continuous_w: 1800,
    output_peak_w: 3600,
    weight_lbs: null,
    price_usd_list: null,
    best_for: [],
    peak_is_surge: true,
    availability: 'in_stock',
    source_url: 'https://example.com',
    verified_at: '2026-01-01',
    battery_chemistry: 'LiFePO4',
  });
  const result = runtimeFor(ok, fridgeHomeLoad());
  assert.equal(result.bindingConstraint, null);
  // 1024 * 0.85 / (150 * 0.35) = 16.55 hours of cycling runtime.
  assert.ok(result.averageHours > 16 && result.averageHours < 17);
});

test('discontinued records stay out of current-model hubs', () => {
  const discontinued = db.stations.filter((s: { availability: string }) => !isCurrent(s));
  assert.ok(discontinued.length >= 1);
  assert.ok(discontinued.every((s: { availability: string }) => s.availability === 'discontinued'));
});

test('verification older than 90 days is stale', () => {
  const today = new Date('2026-10-08T00:00:00Z');
  assert.equal(isVerificationStale('2026-10-05', today), false);
  assert.equal(isVerificationStale('2026-07-10', today), false);
  assert.equal(isVerificationStale('2026-07-09', today), true);
});

test('every station record produces a fridge verdict without throwing', () => {
  const load = fridgeHomeLoad();
  for (const station of db.stations) {
    const result = runtimeFor(toStationSpec(station), load);
    assert.ok(
      result.bindingConstraint === null ||
        result.bindingConstraint === 'surge' ||
        result.bindingConstraint === 'surge_unverified' ||
        result.bindingConstraint === 'continuous' ||
        result.bindingConstraint === 'capacity',
      `${station.id} returned ${result.bindingConstraint}`,
    );
  }
});
