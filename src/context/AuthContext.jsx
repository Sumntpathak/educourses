import { createContext, useContext, useState, useEffect } from 'react';
import { verifySession, logout as apiLogout, clearToken, setToken, getToken } from '../api/client';
import DBCache from '../cache/db.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 1. Try DBCache session first (obfuscated, 8h TTL)
      const saved = await DBCache.loadSession();
      if (saved) {
        setToken(saved.token);
        DBCache.setRole(saved.role);
        // Background verify — don't block UI
        verifySession()
          .then(d => {
            setSession({ role: d.role, user: d.user, school_id: d.school_id, token: saved.token, teacher: d.teacher || null, hod: d.hod || null, mother: d.motherName || '' });
          })
          .catch(() => { clearToken(); DBCache.clearAll(); setSession(null); });
        // Show cached session immediately
        setSession({ role: saved.role, user: saved.user, school_id: import.meta.env.VITE_SCHOOL_ID, token: saved.token, teacher: saved.teacher, hod: saved.hod, mother: saved.motherName || '', features: saved.features || null, schoolName: saved.schoolName || null, session: saved.session || null });
        setLoading(false);
        return;
      }

      // 2. Fall back to localStorage token
      const token = getToken();
      if (!token) { setLoading(false); return; }
      verifySession()
        .then(d => {
          DBCache.setRole(d.role);
          setSession({ role: d.role, user: d.user, school_id: d.school_id, token, teacher: d.teacher || null, hod: d.hod || null, mother: d.motherName || '' });
        })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    })();
  }, []);

  // Listen for cross-tab cache invalidations
  useEffect(() => {
    DBCache.listenCrossTab(() => {});
  }, []);

  const signIn = async (data) => {
    setToken(data.token);
    DBCache.setRole(data.role);
    const schoolId = data.school_id || import.meta.env.VITE_SCHOOL_ID || 'SCH001';
    localStorage.setItem('school_id', schoolId);
    const sess = {
      role: data.role, user: data.user, token: data.token,
      school_id: schoolId,
      teacher: data.teacher || null, hod: data.hod || null,
      mother: data.motherName || '',
      features:   data.features   || null,   // feature flag array from portal
      schoolName: data.schoolName || null,
      session:    data.session    || null,
    };
    setSession(sess);
    // Persist session in IndexedDB
    await DBCache.saveSession({ token: data.token, user: data.user, role: data.role, teacher: data.teacher, hod: data.hod, motherName: data.motherName, features: data.features || null, schoolName: data.schoolName || null, session: data.session || null });
    // Warmup cache in background
    // (warmup needs the API call function — pass a generic fetcher)
  };

  const signOut = async () => {
    try { await apiLogout(); } catch (_) {}
    clearToken();
    localStorage.removeItem('school_id');
    await DBCache.clearAll();
    setSession(null);
  };

  return (
    <AuthCtx.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
