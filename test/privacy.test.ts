import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/privacy.js', import.meta.url), 'utf8');
const consentKey = 'pss-analytics-consent';

function browser(options: { href?: string; saved?: string; blocked?: boolean; id?: string } = {}) {
  const location = new URL(options.href ?? 'https://powerstationsize.com/calculator/');
  const scripts: { src?: string }[] = [];
  const storage = new Map(options.saved ? [[consentKey, options.saved]] : []);
  const listeners = new Map<string, () => void>();
  const elements = new Map<string, any>();
  for (const id of ['analytics-consent', 'analytics-accept', 'analytics-reject', 'analytics-settings']) {
    elements.set(id, {
      hidden: true,
      focus() {},
      addEventListener(event: string, callback: () => void) { listeners.set(`${id}:${event}`, callback); },
    });
  }
  const cookies: string[] = [];
  let reloads = 0;
  const document = {
    currentScript: { dataset: { ga4: options.id ?? 'G-TEST' } },
    referrer: 'https://example.com/path?load=private#private',
    readyState: 'loading',
    head: { appendChild(script: object) { scripts.push(script); } },
    createElement() { return {}; },
    getElementById(id: string) { return elements.get(id); },
    addEventListener(event: string, callback: () => void) { listeners.set(event, callback); },
    get cookie() { return '_ga=abc; _ga_TEST=def; other=keep'; },
    set cookie(value: string) { cookies.push(value); },
  };
  const window: any = {
    location: Object.assign(location, { reload() { reloads++; } }),
    history: { state: null, replaceState(_state: unknown, _title: string, href: string) { location.href = href; } },
    localStorage: {
      getItem(key: string) { if (options.blocked) throw new Error('blocked'); return storage.get(key) ?? null; },
      setItem(key: string, value: string) { if (options.blocked) throw new Error('blocked'); storage.set(key, value); },
    },
  };
  vm.runInNewContext(source, { window, document, URL, URLSearchParams, Date });
  listeners.get('DOMContentLoaded')?.();
  return {
    window, location, scripts, storage, elements, cookies,
    reloads: () => reloads,
    click(id: string) { listeners.get(`${id}:click`)?.(); },
  };
}

function saved(value: string, expires = Date.now() + 60_000) {
  return JSON.stringify({ value, expires });
}

test('analytics makes no request until explicit acceptance', () => {
  const page = browser();
  assert.equal(page.scripts.length, 0);
  assert.equal(page.elements.get('analytics-consent').hidden, false);
  page.click('analytics-reject');
  assert.equal(page.scripts.length, 0);
  assert.equal(JSON.parse(page.storage.get(consentKey)!).value, 'denied');
});

test('remembered denial and invalid or expired choices never load analytics', () => {
  for (const choice of [saved('denied'), saved('granted', 0), saved('unknown'), '{invalid']) {
    assert.equal(browser({ saved: choice }).scripts.length, 0);
  }
});

test('acceptance loads one tag and sends only sanitized location and referrer', () => {
  const page = browser({ href: 'https://powerstationsize.com/calculator/?email=private#calculator?load=private' });
  page.click('analytics-accept');
  page.click('analytics-accept');
  assert.equal(page.scripts.length, 1);
  const config = page.window.dataLayer.find((entry: any[]) => entry[0] === 'config')[2];
  assert.equal(config.page_location, 'https://powerstationsize.com/calculator/');
  assert.equal(config.page_referrer, 'https://example.com/path');
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
});

test('legacy query payload migrates before remembered consent loads analytics', () => {
  const page = browser({
    href: 'https://powerstationsize.com/calculator/?load=cpap:45:8:1&days=2&sun=4&station=model&a=one&b=two&utm_source=example#calculator',
    saved: saved('granted'),
  });
  assert.equal(page.scripts.length, 1);
  assert.equal(page.location.search, '?utm_source=example');
  const payload = new URLSearchParams(page.location.hash.slice('#calculator?'.length));
  assert.equal(payload.get('load'), 'cpap:45:8:1');
  assert.equal(payload.get('days'), '2');
  assert.equal(payload.get('station'), 'model');
  assert.equal(payload.get('a'), 'one');
  assert.equal(payload.get('b'), 'two');
});

test('fragment values win over legacy query values and duplicate queries are removed', () => {
  const page = browser({ href: 'https://powerstationsize.com/calculator/?load=old&load=older&days=2#calculator?load=new' });
  assert.equal(page.location.search, '');
  const payload = new URLSearchParams(page.location.hash.slice('#calculator?'.length));
  assert.equal(payload.get('load'), 'new');
  assert.equal(payload.get('days'), '2');
});

test('storage failure is fail-closed without breaking explicit consent', () => {
  const page = browser({ blocked: true });
  assert.equal(page.scripts.length, 0);
  page.click('analytics-accept');
  assert.equal(page.scripts.length, 1);
});

test('settings permit withdrawal, disable GA, clear its cookies and reload', () => {
  const page = browser({ saved: saved('granted') });
  page.click('analytics-settings');
  assert.equal(page.elements.get('analytics-consent').hidden, false);
  page.click('analytics-reject');
  assert.equal(page.window['ga-disable-G-TEST'], true);
  assert.equal(JSON.parse(page.storage.get(consentKey)!).value, 'denied');
  assert.equal(page.reloads(), 1);
  assert.ok(page.cookies.some((cookie) => cookie.startsWith('_ga=;')));
  assert.ok(page.cookies.some((cookie) => cookie.startsWith('_ga_TEST=;')));
  assert.ok(page.cookies.every((cookie) => !cookie.startsWith('other=')));
});

test('no configured ID means no consent panel or analytics request', () => {
  const page = browser({ id: '' });
  assert.equal(page.scripts.length, 0);
  assert.equal(page.elements.get('analytics-consent').hidden, true);
});
