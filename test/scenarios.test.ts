/**
 * Scenario library tests.
 *
 * The scenario pages render numbers computed at build time, so the risk is not
 * a typo in the markup but a scenario whose written claim no longer matches what
 * the math produces. These tests cover the two ways that happens: a row naming a
 * device that does not exist, and a scenario whose numbers drift away from the
 * figures documented in docs/06 and the README.
 *
 * Run with: npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { scenarios, resolveScenario, scenarioQuery, analyzeScenario, getScenario } from '../src/data/scenarios.ts';
import { devices } from '../src/data/devices.ts';
import type { MatchableStation } from '../src/lib/calculate.ts';

const here = dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(readFileSync(join(here, '..', 'src', 'data', 'power-stations.json'), 'utf8'));

const catalog: MatchableStation[] = db.stations
  .filter((s: { availability: string }) => s.availability !== 'discontinued')
  .map((s: { id: string; brand: string; model: string; capacity_wh: number; output_continuous_w: number; output_peak_w: number; peak_is_surge?: boolean }) => ({
    id: s.id,
    brand: s.brand,
    model: s.model,
    capacity_wh: s.capacity_wh,
    output_continuous_w: s.output_continuous_w,
    output_peak_w: s.output_peak_w,
    peak_is_surge: s.peak_is_surge !== false,
  }));

test('every scenario row references a device that exists', () => {
  const ids = new Set(devices.map((d) => d.id));
  for (const scenario of scenarios) {
    for (const row of scenario.rows) {
      assert.ok(ids.has(row.id), `${scenario.id} references unknown device "${row.id}"`);
    }
  }
});

test('an unknown device id throws rather than shrinking the load silently', () => {
  assert.throws(
    () =>
      resolveScenario({
        id: 'broken',
        title: 'Broken',
        question: '',
        lede: '',
        rows: [{ id: 'no-such-device' }],
        backupDays: 1,
        sunHours: 5,
        insight: '',
        trim: '',
        faq: [],
      }),
    /unknown device id/,
  );
});

test('scenario ids are unique and URL safe', () => {
  const seen = new Set<string>();
  for (const scenario of scenarios) {
    assert.ok(!seen.has(scenario.id), `duplicate scenario id "${scenario.id}"`);
    seen.add(scenario.id);
    assert.match(scenario.id, /^[a-z0-9-]+$/, `"${scenario.id}" is not a clean URL slug`);
    assert.equal(getScenario(scenario.id)?.id, scenario.id);
  }
});

test('the encoded query round trips to the same load the page renders', () => {
  for (const scenario of scenarios) {
    assert.equal(scenarioQuery(scenario), resolveScenario(scenario).map((d) => `${d.id}:${d.watts}:${d.hours}:${d.dutyCycle}`).join(','));
  }
});

test('the fridge outage scenario matches the documented figures', () => {
  // docs/06 records 585 Wh daily and an 826 Wh recommendation for this load.
  // The scenario page and the README quote those numbers, so a change here is a
  // documentation change too, not just a code change.
  const scenario = getScenario('fridge-outage');
  assert.ok(scenario);
  const { sizing, plan } = analyzeScenario(scenario, catalog);

  assert.equal(sizing.rawDailyWh, 585);
  assert.equal(sizing.simultaneousW, 183);
  assert.equal(sizing.peakSurgeW, 1200);
  assert.equal(Math.round(plan.recommendedWh), 826);
});

test('every scenario produces a recommendation and names a limit or a match', () => {
  for (const scenario of scenarios) {
    const { sizing, plan, match, limit } = analyzeScenario(scenario, catalog);

    assert.ok(sizing.rawDailyWh > 0, `${scenario.id} has no daily energy`);
    assert.ok(plan.recommendedWh >= sizing.rawDailyWh, `${scenario.id} recommends less than it draws`);
    if (match.eligible.length === 0) {
      assert.ok(limit, `${scenario.id} matches nothing and names no limit`);
    } else {
      assert.equal(limit, null, `${scenario.id} matched a model but still reports a limit`);
    }
  }
});

test('the recommended model is the smallest one that clears every limit', () => {
  for (const scenario of scenarios) {
    const { match } = analyzeScenario(scenario, catalog);
    if (match.eligible.length < 2) continue;

    const caps = match.eligible.map((e) => e.station.capacity_wh);
    assert.deepEqual(caps, [...caps].sort((a, b) => a - b), `${scenario.id} is not sorted smallest first`);
  }
});

test('a scenario with a motor start never recommends a boost-only record', () => {
  for (const scenario of scenarios) {
    const { sizing, match } = analyzeScenario(scenario, catalog);
    if (sizing.peakSurgeW === 0) continue;
    for (const entry of match.eligible) {
      assert.notEqual(
        entry.station.peak_is_surge,
        false,
        `${scenario.id} recommends ${entry.station.id}, whose peak is a resistive boost`,
      );
    }
  }
});
