// ── Shared API infrastructure ──────────────────────────────────────
import DBCache from '../cache/db.js';

const BASE_URL       = import.meta.env.VITE_API_URL;
const DEFAULT_SCHOOL = import.meta.env.VITE_SCHOOL_ID || 'SCH001';

export function getSchoolId() { return localStorage.getItem('school_id') || DEFAULT_SCHOOL; }
export function getToken()    { return localStorage.getItem('token'); }
export function setToken(t)   { localStorage.setItem('token', t); }
export function clearToken()  { localStorage.removeItem('token'); }

// ── Raw fetch (bypasses cache) ────────────────────────────────────
// Worker reads token from POST body (p.token), not from headers.
export async function _fetch(params) {
  const token = getToken();
  const body  = { school_id: getSchoolId(), ...params };
  if (token) body.token = token;

  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ── Cached read — cache-first with stale-while-revalidate ────────
export async function cachedCall(action, params = {}) {
  const cacheKey = action;
  const fetchFn  = () => _fetch({ action, ...params });

  const cached = await DBCache.get(cacheKey, fetchFn);
  if (cached) return cached;

  return DBCache.dedup(cacheKey, async () => {
    const data = await fetchFn();
    await DBCache.set(cacheKey, data);
    return data;
  });
}

// ── Write call — invalidates dependent caches ────────────────────
export async function writeCall(action, params = {}) {
  const data = await _fetch({ action, ...params });
  const keysToInvalidate = DBCache.getInvalidations(action);
  if (keysToInvalidate.length) await DBCache.invalidate(...keysToInvalidate);
  return data;
}

export { DBCache };

// ── Auth functions ────────────────────────────────────────────────
export const login = (p) => _fetch({ action: 'login', ...p });
export const logout = () => _fetch({ action: 'logout' }).catch(() => {});
export const verifySession = () => _fetch({ action: 'verifySession' });

// Re-export for staff API (used by coaching dashboard)
export const getStaff = (p = {}) => cachedCall('getStaff', p);
