export function getApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_BASE_URL || '').trim();
  return raw ? raw.replace(/\/+$/, '') : '';
}

export function buildApiUrl(path) {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
