/**
 * Catalog helpers shared by brand hubs, station pages, and the refrigerator
 * verdict pages. Mapping JSON records into StationSpec lives here so a later
 * field rename cannot silently leave one page using a different shape.
 */

import { devices } from '../data/devices.ts';
import type { DeviceInput, StationSpec } from './calculate.ts';

export const BRANDS = [
  { name: 'EcoFlow', slug: 'ecoflow' },
  { name: 'Jackery', slug: 'jackery' },
  { name: 'BLUETTI', slug: 'bluetti' },
  { name: 'Anker SOLIX', slug: 'anker-solix' },
] as const;

export type BrandName = (typeof BRANDS)[number]['name'];
export type BrandSlug = (typeof BRANDS)[number]['slug'];

/**
 * Three starting models per brand hub. IDs must exist in the catalog.
 * Prefer Amazon listings and a small / mid / large spread. Boost-only
 * peaks are allowed here only when labelled on the hub.
 */
export const BRAND_START_HERE: Record<BrandSlug, readonly [string, string, string]> = {
  ecoflow: ['ecoflow-river-2-pro', 'ecoflow-delta-3', 'ecoflow-delta-3-max'],
  jackery: ['jackery-explorer-300', 'jackery-explorer-1000-v2', 'jackery-explorer-2000-v2'],
  bluetti: ['bluetti-elite-30-v2', 'bluetti-elite-100-v2', 'bluetti-fridgepower'],
  'anker-solix': ['anker-solix-c300', 'anker-solix-c1000', 'anker-solix-f3000'],
};

const slugByName = new Map<string, BrandSlug>(BRANDS.map((b) => [b.name, b.slug]));
const nameBySlug = new Map<string, BrandName>(BRANDS.map((b) => [b.slug, b.name]));

export function brandSlug(name: string): BrandSlug | undefined {
  return slugByName.get(name);
}

export function brandFromSlug(slug: string): BrandName | undefined {
  return nameBySlug.get(slug);
}

export interface StationRecord {
  id: string;
  brand: string;
  model: string;
  capacity_wh: number;
  output_continuous_w: number;
  output_peak_w: number;
  weight_lbs: number | null;
  price_usd_list: number | null;
  best_for: string[];
  peak_is_surge?: boolean;
  availability: string;
  solar_input_max_w?: number | null;
  source_url: string;
  verified_at: string;
  source_quote?: string | null;
  battery_chemistry: string;
}

export function isCurrent(station: { availability: string }): boolean {
  return station.availability !== 'discontinued';
}

/** Amazon Associates URL. An explicit ASIN link wins; otherwise a tagged search. */
export function amazonUrlFor(
  station: {
    brand: string;
    model: string;
    availability: string;
    affiliate_links?: { amazon?: string | null } | null;
  },
  amazonTag = '',
): string | null {
  const explicit = station.affiliate_links?.amazon;
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;
  if (!amazonTag || station.availability === 'out_of_stock' || station.availability === 'discontinued') {
    return null;
  }
  return `https://www.amazon.com/s?k=${encodeURIComponent(`${station.brand} ${station.model}`)}&tag=${encodeURIComponent(amazonTag)}`;
}

export function toStationSpec(station: StationRecord): StationSpec {
  return {
    id: station.id,
    brand: station.brand,
    model: station.model,
    capacity_wh: station.capacity_wh,
    output_continuous_w: station.output_continuous_w,
    output_peak_w: station.output_peak_w,
    weight_lbs: station.weight_lbs,
    price_usd_list: station.price_usd_list,
    best_for: station.best_for ?? [],
    affiliate_url: null,
    peak_is_surge: station.peak_is_surge !== false,
  };
}

function deviceRow(id: string): DeviceInput {
  const device = devices.find((d) => d.id === id);
  if (!device) {
    throw new Error(`catalog references unknown device id "${id}"`);
  }
  return {
    id: device.id,
    label: device.label,
    watts: device.typical_w,
    hours: device.default_hours,
    dutyCycle: device.duty_cycle,
    surgeWatts: device.surge_w,
  };
}

/** Full-size fridge used by the per-station refrigerator pages. */
export function fridgeHomeLoad(): DeviceInput[] {
  return [deviceRow('fridge-home')];
}

export function fridgeQuery(load: DeviceInput[] = fridgeHomeLoad()): string {
  return load.map((d) => `${d.id}:${d.watts}:${d.hours}:${d.dutyCycle}`).join(',');
}

export const BEST_FOR_LABEL: Record<string, string> = {
  camping: 'Camping',
  home_backup: 'Home backup',
  cpap: 'CPAP nights',
  vanlife: 'Van life',
  rv: 'RV',
};

export function bestForLabel(tag: string): string {
  return BEST_FOR_LABEL[tag] ?? tag.replaceAll('_', ' ');
}

const VERIFY_STALE_DAYS = 90;

/** Calendar days since the manufacturer page was last read. */
export function daysSinceVerified(verifiedAt: string, today = new Date()): number {
  const then = Date.parse(`${verifiedAt}T00:00:00Z`);
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((now - then) / 86_400_000);
}

export function isVerificationStale(verifiedAt: string, today = new Date()): boolean {
  return daysSinceVerified(verifiedAt, today) > VERIFY_STALE_DAYS;
}

export function recheckOn(verifiedAt: string, days = VERIFY_STALE_DAYS): string {
  const then = Date.parse(`${verifiedAt}T00:00:00Z`);
  if (Number.isNaN(then)) return verifiedAt;
  return new Date(then + days * 86_400_000).toISOString().slice(0, 10);
}

/** One-line manufacturer-page citation for the peak-is-surge ruling. */
export function sourceQuoteOf(station: { source_quote?: string | null }): string | null {
  const quote = station.source_quote;
  return typeof quote === 'string' && quote.trim().length > 0 ? quote.trim() : null;
}

/**
 * Copy used when a motor start is surge_unverified. Same sentence on the
 * calculator, refrigerator pages, and the surge-versus-boost table.
 */
export function boostNotCheckedCopy(station: {
  output_peak_w: number;
  source_quote?: string | null;
  verified_at: string;
}): string {
  const watts = station.output_peak_w.toLocaleString('en-US');
  const quote = sourceQuoteOf(station);
  const date = station.verified_at;
  if (quote) {
    return `Startup not checked. The ${watts} W peak is a boost rating (${quote}), read ${date}.`;
  }
  return `Startup not checked. The ${watts} W peak is a boost rating, not inverter surge, read ${date}.`;
}
