#!/usr/bin/env node
/**
 * Data gate for the spec database.
 *
 * This is the enforcement arm of docs/04-compliance.md gate C. The site's
 * credibility rests on every published number being traceable to a
 * manufacturer page, so this script FAILS THE BUILD when a record is
 * incomplete, unverified, or still carrying placeholder text.
 *
 * Run with: npm run validate:data
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = join(here, '..', 'src', 'data', 'power-stations.json');

const REQUIRED_NUMERIC = [
  'capacity_wh',
  'output_continuous_w',
  'output_peak_w',
];
const REQUIRED_STRING = ['id', 'brand', 'model', 'battery_chemistry'];
const REQUIRED_META = ['source_url', 'verified_at'];
const PLACEHOLDER = /^(todo|tbd|placeholder|example\.com|xxx)/i;

const errors = [];
const warnings = [];

if (!existsSync(dataPath)) {
  console.error(`FAIL: ${dataPath} does not exist.`);
  process.exit(1);
}

let db;
try {
  db = JSON.parse(readFileSync(dataPath, 'utf8'));
} catch (err) {
  console.error(`FAIL: power-stations.json is not valid JSON.\n${err.message}`);
  process.exit(1);
}

const stations = db.stations;
if (!Array.isArray(stations) || stations.length === 0) {
  console.error('FAIL: power-stations.json has no "stations" array.');
  process.exit(1);
}

const seenIds = new Set();

stations.forEach((s, i) => {
  const where = `stations[${i}] (${s.id ?? 'no id'})`;

  for (const key of REQUIRED_STRING) {
    if (typeof s[key] !== 'string' || s[key].trim() === '') {
      errors.push(`${where}: missing required field "${key}".`);
    }
  }

  for (const key of REQUIRED_NUMERIC) {
    const v = s[key];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      errors.push(`${where}: "${key}" must be a positive number, got ${JSON.stringify(v)}.`);
    }
  }

  for (const key of REQUIRED_META) {
    const v = s[key];
    if (typeof v !== 'string' || v.trim() === '') {
      errors.push(`${where}: missing "${key}". Every record must be traceable to a source.`);
    } else if (PLACEHOLDER.test(v)) {
      errors.push(`${where}: "${key}" is still a placeholder ("${v}").`);
    }
  }

  if (typeof s.source_url === 'string' && !/^https?:\/\//.test(s.source_url)) {
    errors.push(`${where}: source_url must be an absolute http(s) URL.`);
  }

  if (typeof s.verified_at === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(s.verified_at)) {
    errors.push(`${where}: verified_at must be ISO date (YYYY-MM-DD).`);
  }

  if (seenIds.has(s.id)) {
    errors.push(`${where}: duplicate id.`);
  }
  seenIds.add(s.id);

  // Cross-field sanity: peak must not be below continuous.
  if (
    typeof s.output_peak_w === 'number' &&
    typeof s.output_continuous_w === 'number' &&
    s.output_peak_w < s.output_continuous_w
  ) {
    errors.push(`${where}: output_peak_w is below output_continuous_w.`);
  }

  if (typeof s.peak_is_surge !== 'boolean') {
    errors.push(
      `${where}: peak_is_surge must be true or false. ` +
        `False means the peak figure is a resistive boost (X-Boost, Power Lifting, SurgePad) and must not clear a motor start.`,
    );
  }

  if (s.source_quote != null && (typeof s.source_quote !== 'string' || s.source_quote.trim() === '')) {
    errors.push(`${where}: source_quote must be a non-empty string or omitted.`);
  }
  if (s.peak_is_surge === false && s.availability !== 'discontinued' && !(typeof s.source_quote === 'string' && s.source_quote.trim().length > 0)) {
    warnings.push(
      `${where}: current boost record has no source_quote. The surge-versus-boost table will show citation pending.`,
    );
  }

  // Brand-program links may only be present when a brand program has been approved.
  // Amazon Associates is a separate channel, gated by meta.amazon_tag.
  const links = s.affiliate_links ?? {};
  const brandLink = typeof links.brand_program === 'string' && links.brand_program.length > 0;
  const amazonLink = typeof links.amazon === 'string' && links.amazon.length > 0;
  if (brandLink && db.meta?.affiliate_approved !== true) {
    errors.push(
      `${where}: brand_program link present but meta.affiliate_approved is not true. ` +
        `Unapproved brand links must not ship (docs/04-compliance.md gate E).`,
    );
  }
  if (amazonLink) {
    const amazonTag = db.meta?.amazon_tag;
    if (typeof amazonTag !== 'string' || amazonTag.length === 0) {
      errors.push(`${where}: amazon link present but meta.amazon_tag is empty.`);
    } else if (!links.amazon.includes(`tag=${amazonTag}`)) {
      errors.push(
        `${where}: amazon link must include tag=${amazonTag}. Got ${JSON.stringify(links.amazon)}.`,
      );
    }
  }

  if (!s.weight_lbs) warnings.push(`${where}: weight_lbs is null; it will be hidden in tables.`);
  if (!s.price_usd_list) warnings.push(`${where}: price_usd_list is null; it will be hidden.`);
});

// Stale price check: prices older than 30 days should be refreshed.
const staleAfterDays = 30;
const now = Date.now();
for (const s of stations) {
  if (typeof s.price_updated === 'string') {
    const age = (now - Date.parse(s.price_updated)) / 86_400_000;
    if (Number.isFinite(age) && age > staleAfterDays) {
      warnings.push(`stations(${s.id}): price is ${Math.round(age)} days old. Refresh it.`);
    }
  }
}

for (const w of warnings) console.warn(`WARN  ${w}`);

if (errors.length > 0) {
  console.error('');
  for (const e of errors) console.error(`FAIL  ${e}`);
  console.error(`\n${errors.length} error(s). Build stopped.`);
  process.exit(1);
}

console.log(
  `OK  ${stations.length} station(s) validated, ${warnings.length} warning(s). ` +
    `Verified records only.`,
);
