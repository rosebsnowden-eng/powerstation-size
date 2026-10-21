#!/usr/bin/env node
/**
 * Cloudflare Pages can strip .xml. Copy an extensionless twin so /sitemap
 * still returns the urlset if that happens.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const src = join(dist, 'sitemap.xml');
if (!existsSync(src)) {
  console.error('missing dist/sitemap.xml');
  process.exit(1);
}
copyFileSync(src, join(dist, 'sitemap'));
copyFileSync(src, join(dist, 'sitemap-index.xml'));
copyFileSync(src, join(dist, 'sitemap-index'));
copyFileSync(src, join(dist, 'sitemap-0.xml'));
copyFileSync(src, join(dist, 'sitemap-0'));
console.log('copied sitemap aliases over the old Astro index files');
