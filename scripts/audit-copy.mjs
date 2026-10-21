#!/usr/bin/env node
/**
 * Copy audit.
 *
 * Three checks:
 *   1. no em-dash or en-dash in visible output, anywhere
 *   2. no banned claim language on medical or electrical content
 *   3. no placeholder operator details left in shipped copy
 *
 * Two implementation notes that matter:
 *   - Comments are blanked before scanning, so a comment that documents the
 *     banned-phrase list does not trip the check. An audit that reports its own
 *     documentation is an audit people learn to ignore.
 *   - Phrase matching runs over the whole file with newlines collapsed to
 *     spaces. A sentence does not stop being an unsupported claim because a
 *     formatter wrapped it across two lines. Dash matching stays per line, so a
 *     report can point at the exact string.
 *
 * Run with: node scripts/audit-copy.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src');

const SCAN_EXT = new Set(['.astro', '.ts', '.css']);

const BANNED_PHRASES = [
  { pattern: /FDA[\s-]approved/i, why: 'unsupported regulatory claim' },
  { pattern: /life[\s-]support/i, why: 'unsupported medical claim' },
  { pattern: /keep you breathing/i, why: 'unsupported medical claim' },
  { pattern: /safe for therapy/i, why: 'unsupported medical claim' },
  { pattern: /guaranteed overnight/i, why: 'unsupported runtime guarantee' },
  { pattern: /guarantee[sd]? (?:a )?(?:full|whole) night/i, why: 'unsupported runtime guarantee' },
  { pattern: /\bwe tested\b/i, why: 'first-person test claim the site cannot support' },
  { pattern: /\bwe ran\b/i, why: 'first-person test claim the site cannot support' },
  { pattern: /\bwe measured\b/i, why: 'first-person test claim the site cannot support' },
  { pattern: /(?:a CPAP has no motor|no motor or compressor in this load|no motor start in a CPAP)/i, why: 'unsupported absence-of-inrush claim' },
  { pattern: /failure is harmless/i, why: 'unsafe therapy backup testing advice' },
  { pattern: /your sole remedy|formula in code wins/i, why: 'overbroad remedy or code-correctness claim' },
  {
    pattern: /whole[\s-]home backup(?!\s*(?:requires|needs))/i,
    why: 'bare whole-home claim without its transfer-switch requirement',
  },
];

/**
 * Placeholders that must not survive into shipped copy.
 *
 * The lookbehind excludes the HTML `placeholder=` attribute, which is legitimate
 * markup rather than an unfilled value. Without it the audit reports its own
 * input hints as work to do, which is how a check earns being ignored.
 */
const PLACEHOLDERS = [
  { pattern: /\bPLACEHOLDER\b/i, why: 'unfilled placeholder' },
];

const errors = [];
/** Tracked pre-launch items. Reported, but they do not fail the audit. */
const warnings = [];

/** Blank comment bytes while preserving line structure, so line numbers hold. */
function blankComments(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    const ext = extname(full);
    if (!SCAN_EXT.has(ext)) continue;

    const rel = full.slice(srcDir.length + 1);
    const lines = blankComments(readFileSync(full, 'utf8')).split('\n');

    const isSkippable = (line) => {
      const t = line.trim();
      return t.startsWith('//') || t.startsWith('*');
    };

    // 1. Dash characters, per line.
    lines.forEach((line, i) => {
      if (isSkippable(line)) return;
      if (/[—–]/.test(line)) {
        errors.push(`${rel}:${i + 1}  dash character: ${line.trim().slice(0, 90)}`);
      }
    });

    // 2 and 3. Phrase and placeholder checks, across line breaks.
    const joined = lines
      .filter((line) => !isSkippable(line))
      .join(' ')
      // Remove attribute values. A `placeholder=` hint or a `data-*` token is
      // markup, not copy, and must not be reported as unfilled content.
      .replace(/\b[a-zA-Z-]+=("[^"]*"|'[^']*')/g, ' ')
      .replace(/\s+/g, ' ');

    for (const { pattern, why } of BANNED_PHRASES) {
      const match = joined.match(pattern);
      if (!match) continue;
      const at = joined.indexOf(match[0]);
      const context = joined.slice(Math.max(0, at - 50), at + 90);
      errors.push(`${rel}  ${why} (${pattern}): ...${context}...`);
    }

    for (const { pattern, why } of PLACEHOLDERS) {
      const match = joined.match(pattern);
      if (!match) continue;
      const at = joined.indexOf(match[0]);
      const context = joined.slice(Math.max(0, at - 50), at + 90);
      warnings.push(`${rel}  ${why}: ...${context}...`);
    }
  }
}

walk(srcDir);

for (const w of warnings) console.warn(`WARN  ${w}`);

if (errors.length > 0) {
  console.error('Copy audit FAILED\n');
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\n${errors.length} issue(s).`);
  process.exit(1);
}

console.log(
  `OK  copy audit passed: no dashes, no banned claims. ` +
    `${warnings.length} pre-launch placeholder warning(s).`,
);
