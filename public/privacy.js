(() => {
  const measurementId = document.currentScript.dataset.ga4;
  const url = new URL(window.location.href);
  const prefix = '#calculator?';
  const payload = new URLSearchParams(url.hash.startsWith(prefix) ? url.hash.slice(prefix.length) : '');
  let migrated = false;
  for (const key of ['load', 'days', 'sun', 'station', 'a', 'b']) {
    if (!url.searchParams.has(key)) continue;
    if (!payload.has(key)) payload.set(key, url.searchParams.get(key));
    url.searchParams.delete(key);
    migrated = true;
  }
  if (migrated) {
    url.hash = `calculator?${payload}`;
    window.history.replaceState(window.history.state, '', url.toString());
  }

  if (!measurementId) return;
  const storageKey = 'pss-analytics-consent';
  let choice = null;
  let loaded = false;
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey));
    if (stored?.expires > Date.now() && ['granted', 'denied'].includes(stored.value)) {
      choice = stored.value;
    }
  } catch {}

  function cleanAddress(address) {
    if (!address) return '';
    try {
      const parsed = new URL(address);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return '';
    }
  }

  function clearAnalyticsCookies() {
    const labels = window.location.hostname.split('.');
    const domains = [''];
    for (let index = 0; index < labels.length - 1; index++) {
      domains.push(`; domain=${labels.slice(index).join('.')}`);
    }
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (name !== '_ga' && !name.startsWith('_ga_')) continue;
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/${domain}; SameSite=Lax`;
      }
    }
  }

  function enableAnalytics() {
    if (loaded) return;
    loaded = true;
    window[`ga-disable-${measurementId}`] = false;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', measurementId, {
      page_location: cleanAddress(window.location.href),
      page_referrer: cleanAddress(document.referrer),
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: false,
    });
    gtag('event', 'page_view');
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  if (choice === 'granted') enableAnalytics();
  else clearAnalyticsCookies();

  function initializeControls() {
    const panel = document.getElementById('analytics-consent');
    const settings = document.getElementById('analytics-settings');
    panel.hidden = choice !== null;
    settings.hidden = false;
    settings.addEventListener('click', () => {
      panel.hidden = false;
      document.getElementById('analytics-reject').focus();
    });
    function choose(value) {
      choice = value;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({
          value,
          expires: Date.now() + 180 * 24 * 60 * 60 * 1000,
        }));
      } catch {}
      panel.hidden = true;
      settings.focus({ preventScroll: true });
      if (value === 'granted') enableAnalytics();
      else {
        window[`ga-disable-${measurementId}`] = true;
        clearAnalyticsCookies();
        if (loaded) window.location.reload();
      }
    }
    document.getElementById('analytics-accept').addEventListener('click', () => choose('granted'));
    document.getElementById('analytics-reject').addEventListener('click', () => choose('denied'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeControls);
  else initializeControls();
})();
