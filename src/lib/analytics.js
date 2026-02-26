const UTM_STORAGE_KEY = 'gmg_utm_v1';
const ONCE_STORAGE_KEY_PREFIX = 'gmg_ga_once_v1:';
const DWELL_STORAGE_KEY = 'gmg_route_dwell_v1';

const MAX_DWELL_MS = 1000 * 60 * 60 * 6; // 6 hours

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function nowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return '';
  }
}

export function getGaMeasurementId() {
  return (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
}

export function isGtagReady() {
  if (typeof window === 'undefined') return false;
  return typeof window.gtag === 'function';
}

export function isGaEnabled() {
  return Boolean(getGaMeasurementId()) && isGtagReady();
}

export function isGaDebugMode() {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('ga_debug') === '1';
}

export function readStoredUtm() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(UTM_STORAGE_KEY);
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed;
}

export function persistUtmFromUrl(urlLike) {
  if (typeof window === 'undefined') return null;

  const url =
    typeof urlLike === 'string' ? new URL(urlLike, window.location.origin) : window.location;
  const params = new URLSearchParams(url.search);

  const utm = {
    utm_source: (params.get('utm_source') || '').trim(),
    utm_medium: (params.get('utm_medium') || '').trim(),
    utm_campaign: (params.get('utm_campaign') || '').trim(),
    utm_content: (params.get('utm_content') || '').trim(),
    utm_term: (params.get('utm_term') || '').trim(),
    gclid: (params.get('gclid') || '').trim(),
    wbraid: (params.get('wbraid') || '').trim(),
    gbraid: (params.get('gbraid') || '').trim(),
  };

  const hasAny = Object.values(utm).some((v) => Boolean(v));
  if (!hasAny) return readStoredUtm();

  const stored = {
    ...utm,
    first_seen_at: nowIso(),
    landing_path: window.location.pathname + window.location.search,
  };

  window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(stored));
  return stored;
}

function buildEventParams(extraParams) {
  const stored = readStoredUtm();
  const utmParams = stored
    ? {
        gmg_utm_source: stored.utm_source || undefined,
        gmg_utm_medium: stored.utm_medium || undefined,
        gmg_utm_campaign: stored.utm_campaign || undefined,
        gmg_utm_content: stored.utm_content || undefined,
        gmg_utm_term: stored.utm_term || undefined,
        gmg_gclid: stored.gclid || undefined,
        gmg_wbraid: stored.wbraid || undefined,
        gmg_gbraid: stored.gbraid || undefined,
        gmg_landing_path: stored.landing_path || undefined,
      }
    : {};

  const debugParams = isGaDebugMode() ? { debug_mode: true } : {};

  return {
    ...utmParams,
    ...debugParams,
    ...(extraParams || {}),
  };
}

export function trackPageView({ page_path } = {}) {
  if (!isGaEnabled()) return;

  const params = buildEventParams({
    page_path: page_path || window.location.pathname + window.location.search,
    page_location: window.location.href,
    page_title: document.title,
  });

  window.gtag('event', 'page_view', params);
}

export function trackEvent(eventName, params) {
  if (!isGaEnabled()) return;
  if (!eventName) return;

  window.gtag('event', eventName, buildEventParams(params));
}

export function trackEventOnce(onceKey, eventName, params) {
  if (typeof window === 'undefined') return;
  if (!onceKey) {
    trackEvent(eventName, params);
    return;
  }

  const key = `${ONCE_STORAGE_KEY_PREFIX}${onceKey}`;
  if (window.sessionStorage.getItem(key) === '1') return;
  window.sessionStorage.setItem(key, '1');
  trackEvent(eventName, params);
}

function getDwellState() {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(DWELL_STORAGE_KEY);
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed;
}

function setDwellState(state) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(DWELL_STORAGE_KEY, JSON.stringify(state));
}

function normalizePath(path) {
  return (path || '').trim();
}

export function trackRouteDwell(nextPath) {
  if (typeof window === 'undefined') return;

  const toPath = normalizePath(nextPath);
  const now = Date.now();
  const prev = getDwellState();

  if (prev?.path && typeof prev.ts === 'number') {
    const fromPath = normalizePath(prev.path);
    let dwellMs = now - prev.ts;
    if (Number.isFinite(dwellMs) && dwellMs > 0) {
      dwellMs = Math.min(dwellMs, MAX_DWELL_MS);

      trackEvent('route_dwell', {
        gmg_from_path: fromPath,
        gmg_to_path: toPath || undefined,
        gmg_dwell_ms: dwellMs,
        gmg_dwell_sec: Math.round(dwellMs / 1000),
        page_path: fromPath,
        transport_type: 'beacon',
      });
    }
  }

  if (toPath) setDwellState({ path: toPath, ts: now });
}

export function flushRouteDwellOnExit() {
  if (typeof window === 'undefined') return;
  const prev = getDwellState();
  if (!prev?.path || typeof prev.ts !== 'number') return;

  const fromPath = normalizePath(prev.path);
  const now = Date.now();
  let dwellMs = now - prev.ts;
  if (!Number.isFinite(dwellMs) || dwellMs <= 0) return;

  dwellMs = Math.min(dwellMs, MAX_DWELL_MS);
  trackEvent('route_dwell', {
    gmg_from_path: fromPath,
    gmg_to_path: '(exit)',
    gmg_dwell_ms: dwellMs,
    gmg_dwell_sec: Math.round(dwellMs / 1000),
    page_path: fromPath,
    transport_type: 'beacon',
  });
}
