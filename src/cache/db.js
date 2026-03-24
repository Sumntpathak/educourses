// ================================================================
// db.js — EduPortal IndexedDB Cache + Session Persistence
// ================================================================
// Features:
//   1. Role-aware TTLs — students get shorter TTLs than admin
//   2. Stale-while-revalidate — background refresh, instant UI
//   3. Priority warmup — prefetches critical data after login
//   4. Quota guard — auto-evicts oldest if > 4MB
//   5. Cross-tab sync — BroadcastChannel, one tab updates all
//   6. In-flight dedup — same request fired twice = one fetch
//   7. Cache health stats — for admin debug panel
//   8. Token XOR obfuscation + 8h session expiry
// ================================================================

const _DB_NAME    = 'eduportal_db';
const _DB_VERSION = 3;
const _ST_CACHE   = 'api_cache';
const _ST_SESSION = 'session';
const _ST_META    = 'cache_meta';
const _QUOTA_BYTES = 4 * 1024 * 1024; // 4 MB

// ── Base TTLs (ms) — admin timing; other roles are multiplied ────
const _BASE_TTL = {
  getSettings:           24 * 3600_000,
  getDashboard:               5 * 60_000,
  getStudents:               10 * 60_000,
  getHostelStudents:         10 * 60_000,
  getSiblings:               15 * 60_000,
  getFeeRegister:             5 * 60_000,
  getStaff:                  20 * 60_000,
  getTeachers:               20 * 60_000,
  getExpenses:                5 * 60_000,
  getBankDeposits:            5 * 60_000,
  getAssets:                 30 * 60_000,
  getBusRoutes:              30 * 60_000,
  getBusPayments:             5 * 60_000,
  getClassTeachers:          30 * 60_000,
  getTests:                  10 * 60_000,
  getStudentHistory:         10 * 60_000,
  getStudentFees:            10 * 60_000,
  getStudentReport:          15 * 60_000,
  getStudentTests:           10 * 60_000,
  getNotices:                30 * 60_000,
  getMyAttendance:            5 * 60_000,
  getStudentAttendance:       5 * 60_000,
  getTeacherAttendance:       5 * 60_000,
  getTeacherPayslip:         60 * 60_000,
  getPayslip:                60 * 60_000,
  getMyClass:                15 * 60_000,
  getRegularisations:         5 * 60_000,
  getHod:                    20 * 60_000,
  portalListSchools:          5 * 60_000,
};

const _ROLE_MULTIPLIER = {
  admin:   1.0,
  teacher: 0.75,
  hod:     0.9,
  student: 0.6,
  portal:  1.0,
};

let _currentRole = 'admin';
function _getTTL(action) {
  const base = _BASE_TTL[action];
  if (!base) return 0;
  return Math.floor(base * (_ROLE_MULTIPLIER[_currentRole] || 1));
}

// ── Write invalidation map ────────────────────────────────────────
const _WRITE_INVALIDATES = {
  addStudent:            ['getStudents', 'getDashboard'],
  updateStudent:         ['getStudents', 'getDashboard'],
  deleteStudent:         ['getStudents', 'getDashboard'],
  addFeeEntry:           ['getFeeRegister', 'getDashboard', 'getStudentFees', 'getStudentHistory'],
  addExpense:            ['getExpenses', 'getDashboard'],
  updateExpense:         ['getExpenses'],
  deleteExpense:         ['getExpenses'],
  addBankDeposit:        ['getBankDeposits'],
  updateBankDeposit:     ['getBankDeposits'],
  addStaff:              ['getStaff'],
  updateStaff:           ['getStaff'],
  deleteStaff:           ['getStaff'],
  addAsset:              ['getAssets'],
  updateAsset:           ['getAssets'],
  addBusPayment:         ['getBusPayments', 'getDashboard'],
  addBusRoute:           ['getBusRoutes'],
  updateBusRoute:        ['getBusRoutes'],
  assignClassTeacher:    ['getClassTeachers', 'getTeachers'],
  addTestResult:         ['getTests', 'getDashboard', 'getStudentReport', 'getStudentTests'],
  updateTestResult:      ['getTests', 'getStudentReport'],
  markStudentAttendance: ['getDashboard', 'getStudentAttendance'],
  markTeacherAttendance: ['getDashboard', 'getMyAttendance', 'getTeacherAttendance'],
  approveRegularisation: ['getRegularisations'],
  updateSettings:        ['getSettings'],
  postNotice:            ['getNotices'],
  deleteNotice:          ['getNotices'],
};

// ── Warmup sets per role ──────────────────────────────────────────
const _WARMUP = {
  admin:   ['getDashboard', 'getStudents', 'getStaff', 'getSettings'],
  teacher: ['getTeachers', 'getStudentAttendance', 'getMyAttendance', 'getMyClass'],
  hod:     ['getDashboard', 'getStudents', 'getTeachers', 'getStaff'],
  student: ['getStudentHistory', 'getNotices'],
  portal:  ['portalListSchools'],
};

// ── Cross-tab broadcast ───────────────────────────────────────────
const _bc = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('eduportal_cache_sync')
  : null;

const DBCache = (() => {
  let _db = null;
  const _inflight = {};
  const _swr = new Set();

  function _open() {
    return new Promise((resolve, reject) => {
      if (_db) { resolve(_db); return; }
      const req = indexedDB.open(_DB_NAME, _DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(_ST_CACHE))
          db.createObjectStore(_ST_CACHE, { keyPath: 'k' });
        if (!db.objectStoreNames.contains(_ST_SESSION))
          db.createObjectStore(_ST_SESSION, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(_ST_META))
          db.createObjectStore(_ST_META, { keyPath: 'action' });
      };
      req.onsuccess = e => { _db = e.target.result; resolve(_db); };
      req.onerror   = e => { console.warn('[db] open error', e.target.error); reject(e.target.error); };
    });
  }

  function _idb(req) {
    return new Promise((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
    });
  }

  async function _st(store, mode) {
    const db = await _open();
    return db.transaction(store, mode).objectStore(store);
  }

  // ── Token XOR obfuscation ─────────────────────────────────────
  function _fp() {
    return (navigator.userAgent + navigator.language + String(screen.width)).slice(0, 20);
  }
  function _obf(str) {
    try {
      const k = _fp();
      const xored = [...str].map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ k.charCodeAt(i % k.length))
      ).join('');
      return btoa(xored);
    } catch { return null; }
  }
  function _dob(s) {
    try {
      const k = _fp();
      const raw = atob(s);
      return [...raw].map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ k.charCodeAt(i % k.length))
      ).join('');
    } catch { return null; }
  }

  // ── Quota guard ───────────────────────────────────────────────
  async function _enforceQuota() {
    try {
      const db  = await _open();
      const tx  = db.transaction(_ST_CACHE, 'readwrite');
      const st  = tx.objectStore(_ST_CACHE);
      const all = await _idb(st.getAll());
      const totalBytes = all.reduce((sum, row) => {
        try { return sum + JSON.stringify(row).length * 2; } catch { return sum; }
      }, 0);
      if (totalBytes > _QUOTA_BYTES) {
        all.sort((a, b) => a.t - b.t);
        let freed = 0;
        for (const row of all) {
          st.delete(row.k);
          freed += JSON.stringify(row).length * 2;
          if (totalBytes - freed < _QUOTA_BYTES * 0.75) break;
        }
      }
    } catch {}
  }

  // ── Hit/miss stats ────────────────────────────────────────────
  async function _recordStat(action, hit) {
    try {
      const st  = await _st(_ST_META, 'readwrite');
      let   row = await _idb(st.get(action)) || { action, hits: 0, misses: 0, lastAccess: 0 };
      hit ? row.hits++ : row.misses++;
      row.lastAccess = Date.now();
      st.put(row);
    } catch {}
  }

  function _broadcast(actions) {
    if (!_bc) return;
    try { _bc.postMessage({ type: 'invalidate', actions }); } catch {}
  }

  return {
    setRole(role) { _currentRole = role || 'admin'; },

    // ── Cache-first + stale-while-revalidate ──────────────────
    async get(action, fetchFn) {
      const ttl = _getTTL(action);
      if (!ttl) return null;
      try {
        const st  = await _st(_ST_CACHE, 'readonly');
        const row = await _idb(st.get(action));
        if (!row) { await _recordStat(action, false); return null; }
        const age = Date.now() - row.t;
        if (age <= ttl) {
          await _recordStat(action, true);
          return row.d;
        }
        if (age <= ttl * 2 && fetchFn && !_swr.has(action)) {
          _swr.add(action);
          fetchFn().then(fresh => {
            if (fresh && !fresh.error) {
              this.set(action, fresh);
              _broadcast([action]);
            }
          }).catch(() => {}).finally(() => _swr.delete(action));
          await _recordStat(action, true);
          return row.d;
        }
        await _recordStat(action, false);
        return null;
      } catch { return null; }
    },

    async set(action, data) {
      if (!_getTTL(action) || !data || data.error) return;
      try {
        const st = await _st(_ST_CACHE, 'readwrite');
        await _idb(st.put({ k: action, d: data, t: Date.now() }));
        _enforceQuota();
      } catch {}
    },

    async invalidate(...actions) {
      if (!actions.length) return;
      try {
        const db = await _open();
        const tx = db.transaction(_ST_CACHE, 'readwrite');
        const st = tx.objectStore(_ST_CACHE);
        actions.forEach(a => { delete _inflight[a]; _swr.delete(a); st.delete(a); });
        await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
        _broadcast(actions);
      } catch {}
    },

    // ── Warmup after login ────────────────────────────────────
    async warmup(role, apiFn) {
      if (typeof apiFn !== 'function') return;
      const actions = _WARMUP[role] || [];
      for (const action of actions) {
        const cached = await this.get(action);
        if (cached) continue;
        if (!_inflight[action]) {
          _inflight[action] = apiFn({ action })
            .then(d => { if (d && !d.error) this.set(action, d); return d; })
            .catch(() => {})
            .finally(() => delete _inflight[action]);
        }
        await new Promise(r => setTimeout(r, 350));
      }
    },

    async clearAll() {
      Object.keys(_inflight).forEach(k => delete _inflight[k]);
      _swr.clear();
      try {
        const db = await _open();
        const tx = db.transaction([_ST_CACHE, _ST_SESSION, _ST_META], 'readwrite');
        tx.objectStore(_ST_CACHE).clear();
        tx.objectStore(_ST_SESSION).clear();
        tx.objectStore(_ST_META).clear();
        await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
      } catch {}
    },

    async saveSession({ token, user, role, teacher, hod, motherName }) {
      const obfToken = _obf(token);
      if (!obfToken) return;
      try {
        const st = await _st(_ST_SESSION, 'readwrite');
        await _idb(st.put({
          id: 'current', tok: obfToken,
          user, role,
          teacher:    teacher    || null,
          hod:        hod        || null,
          motherName: motherName || '',
          savedAt:    Date.now(),
        }));
      } catch {}
    },

    async loadSession() {
      try {
        const st  = await _st(_ST_SESSION, 'readonly');
        const row = await _idb(st.get('current'));
        if (!row) return null;
        if (Date.now() - row.savedAt > 8 * 3600_000) { this.clearAll(); return null; }
        const token = _dob(row.tok);
        if (!token) return null;
        return { token, user: row.user, role: row.role, teacher: row.teacher, hod: row.hod, motherName: row.motherName };
      } catch { return null; }
    },

    async clearSession() {
      try {
        const st = await _st(_ST_SESSION, 'readwrite');
        await _idb(st.delete('current'));
      } catch {}
    },

    dedup(action, fetchFn) {
      if (_inflight[action]) return _inflight[action];
      const p = fetchFn().finally(() => { delete _inflight[action]; });
      _inflight[action] = p;
      return p;
    },

    isCacheable(action)      { return !!_BASE_TTL[action]; },
    getInvalidations(action) { return _WRITE_INVALIDATES[action] || []; },
    getTTL(action)           { return _getTTL(action); },
    getCurrentRole()         { return _currentRole; },

    async getAge(action) {
      try {
        const st  = await _st(_ST_CACHE, 'readonly');
        const row = await _idb(st.get(action));
        if (!row) return null;
        const s = Math.floor((Date.now() - row.t) / 1000);
        if (s < 60)   return s + 's ago';
        if (s < 3600) return Math.floor(s / 60) + 'm ago';
        return Math.floor(s / 3600) + 'h ago';
      } catch { return null; }
    },

    async getStats() {
      try {
        const db  = await _open();
        const tx  = db.transaction([_ST_CACHE, _ST_META], 'readonly');
        const cacheAll = await _idb(tx.objectStore(_ST_CACHE).getAll());
        const metaAll  = await _idb(tx.objectStore(_ST_META).getAll());
        const metaMap  = Object.fromEntries(metaAll.map(m => [m.action, m]));
        const now      = Date.now();
        const entries  = cacheAll.map(row => {
          const ttl   = _getTTL(row.k);
          const age   = now - row.t;
          const fresh = age <= ttl;
          const stale = !fresh && age <= ttl * 2;
          const bytes = (() => { try { return JSON.stringify(row).length * 2; } catch { return 0; } })();
          const stats = metaMap[row.k] || { hits: 0, misses: 0 };
          return { action: row.k, age: Math.floor(age / 1000), ttl: Math.floor(ttl / 1000), fresh, stale, bytes, hits: stats.hits, misses: stats.misses, hitRate: stats.hits + stats.misses > 0 ? Math.round(stats.hits / (stats.hits + stats.misses) * 100) : 0 };
        });
        const totalBytes = entries.reduce((s, e) => s + e.bytes, 0);
        return { role: _currentRole, entries, totalKB: Math.round(totalBytes / 1024), quotaKB: Math.round(_QUOTA_BYTES / 1024), usagePct: Math.round(totalBytes / _QUOTA_BYTES * 100), inFlight: Object.keys(_inflight).length, revalidating: [..._swr] };
      } catch { return null; }
    },

    listenCrossTab(onInvalidate) {
      if (!_bc) return;
      _bc.onmessage = e => {
        if (e.data?.type === 'invalidate' && Array.isArray(e.data.actions)) {
          e.data.actions.forEach(a => { delete _inflight[a]; _swr.delete(a); });
          if (typeof onInvalidate === 'function') onInvalidate(e.data.actions);
        }
      };
    },
  };
})();

export default DBCache;
