/**
 * Single source of site identity.
 * Domain registered 2026-10-07: powerstationsize.com (Hostinger, expires 2027-10-07).
 * Compliance rule (docs/04-compliance.md): the domain must NOT contain any
 * brand name (ecoflow / bluetti / jackery / anker / solix / resmed).
 */
import db from './power-stations.json';

export const site = {
  name: 'PowerStation Size',
  tagline: 'Size a power station from your actual devices',
  url: 'https://powerstationsize.com',
  domain: 'powerstationsize.com',
  contactEmail: 'hello@powerstationsize.com',
  publisherName: 'Chen Jie',
  legalUpdated: '2026-10-08',
  /** Analytics IDs. Empty means "not configured" and the tag is not rendered. */
  analytics: {
    ga4: 'G-9V7680J390',
  },
  /** Whether any affiliate link is approved and live. Gates link rendering. */
  affiliateLive: (db.meta.affiliate_approved && db.stations.some((station) =>
    Object.values(station.affiliate_links as Record<string, string | null>).some((url) => typeof url === 'string' && url.length > 0),
  )) || Boolean((db.meta as { amazon_tag?: string }).amazon_tag),
  /** Amazon Associates Program enrollment. Shows the 2(k) identification sentence site-wide. */
  amazonAssociate: true,
} as const;

export const nav = [
  { href: '/calculator/', label: 'Calculator' },
  { href: '/scenarios/', label: 'Scenarios' },
  { href: '/stations/', label: 'Stations' },
  { href: '/brands/', label: 'Brands' },
  { href: '/guides/', label: 'Guides' },
] as const;
