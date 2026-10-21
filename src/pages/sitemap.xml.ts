import type { APIRoute } from 'astro';
import { site } from '../data/site.ts';
import { scenarios } from '../data/scenarios.ts';
import { BRANDS } from '../lib/catalog.ts';
import db from '../data/power-stations.json';

/**
 * One urlset at /sitemap.xml, same pattern as aigiftradar.
 * Astro's sitemap integration writes sitemap-index.xml plus sitemap-0.xml.
 * Search Console submitted that index on a new domain and could not fetch it.
 * Prerender so Cloudflare Pages serves a static XML file, not a function.
 */
export const prerender = true;

export const GET: APIRoute = () => {
  const paths = [
    '/',
    '/calculator/',
    '/about/',
    '/methodology/',
    '/privacy/',
    '/terms/',
    '/disclosure/',
    '/guides/',
    '/guides/solar-generator-sizing/',
    '/guides/cpap-backup-power/',
    '/guides/camping-power-station/',
    '/guides/can-a-portable-power-station-run-a-refrigerator/',
    '/guides/watts-vs-watt-hours/',
    '/guides/how-long-will-a-1000wh-power-station-last/',
    '/guides/anker-solix-c1000-vs-bluetti-elite-100-v2/',
    '/guides/jackery-explorer-1000-v2-vs-bluetti-elite-100-v2/',
    '/guides/jackery-explorer-1000-v2-vs-anker-solix-c1000/',
    '/guides/jackery-explorer-1000-v2-vs-2000-v2/',
    '/guides/anker-solix-c1000-vs-c1000-gen-2/',
    '/guides/surge-vs-boost/',
    '/scenarios/',
    ...scenarios.map((s) => `/scenarios/${s.id}/`),
    '/stations/',
    ...db.stations.map((s) => `/stations/${s.id}/`),
    ...db.stations.map((s) => `/stations/${s.id}/refrigerator/`),
    '/brands/',
    ...BRANDS.map((b) => `/brands/${b.slug}/`),
  ];

  const unique = [...new Set(paths)];
  const lastmod = site.legalUpdated;
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...unique.map((path) => {
      const loc = new URL(path, `${site.url}/`).href;
      return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
    }),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
