import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, CreditCard, FileText, CheckSquare,
  BarChart3, Layers, GraduationCap, ClipboardList, Receipt, CalendarDays
} from 'lucide-react';

const I = 14; // icon size
const NAV = {
  coaching_admin: [
    { to: '/home',        icon: <LayoutDashboard size={I}/>, label: 'Dashboard' },
    { to: '/students',    icon: <Users size={I}/>,           label: 'Students' },
    { to: '/batches',     icon: <Layers size={I}/>,          label: 'Batches' },
    { to: '/fees',        icon: <CreditCard size={I}/>,      label: 'Fees' },
    { to: '/tests',       icon: <FileText size={I}/>,        label: 'Tests' },
    { to: '/attendance',  icon: <CheckSquare size={I}/>,     label: 'Attendance' },
    { to: '/performance', icon: <BarChart3 size={I}/>,       label: 'Analytics' },
  ],
  coaching_student: [
    { to: '/student',            icon: <LayoutDashboard size={I}/>, label: 'Overview' },
    { to: '/student/scores',     icon: <ClipboardList size={I}/>,   label: 'My Scores' },
    { to: '/student/attendance', icon: <CalendarDays size={I}/>,    label: 'Attendance' },
    { to: '/student/fees',       icon: <Receipt size={I}/>,         label: 'Fee History' },
  ],
};

const ROLE_LABEL = { coaching_admin: 'Admin', coaching_student: 'Student' };
const ROLE_COLOR = { coaching_admin: 'var(--accent)', coaching_student: 'var(--accent2)' };

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function AppLayout({ children }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [syncState, setSyncState] = useState('live');

  const role = session?.role || 'coaching_admin';
  const links = NAV[role] || [];
  const user = session?.user || '';
  const userInit = initials(user);
  const roleColor = ROLE_COLOR[role] || 'var(--accent)';

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const on = () => setSyncState('live');
    const off = () => setSyncState('offline');
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    if (!navigator.onLine) setSyncState('offline');
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const syncLabel = { live: 'Live', syncing: 'Syncing…', offline: 'Offline', stale: 'Stale' };

  return (
    <div className="app">

      {/* ── TOPBAR ─────────────────────────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo" onClick={() => navigate(links[0]?.to || '/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textDecoration: 'none' }}>
            {/* Icon */}
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px', position: 'relative',
              background: 'var(--accent)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,.15)',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,.25) 0%, transparent 50%, rgba(0,0,0,.1) 100%)' }} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" style={{ position: 'relative', zIndex: 1 }}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            {/* Brand */}
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--text)' }}>
                edu<span style={{ color: 'var(--accent)', fontWeight: 900 }}>courses</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px', letterSpacing: '.04em' }}>
                COACHING MANAGEMENT
              </div>
            </div>
          </div>
          {/* Divider */}
          <div style={{ width: '1px', height: '22px', background: 'var(--border)', flexShrink: 0 }} />
          {/* Role pill */}
          <div className="role-badge">
            <span className="role-label-full">{ROLE_LABEL[role] || role}</span>
            <span className="role-label-short">{role === 'coaching_admin' ? 'ADM' : 'STU'}</span>
          </div>
        </div>

        <div className="topbar-right">
          {/* Sync badge */}
          <span className={`sync-badge ${syncState}`}>
            <span className="sync-dot" />
            <span className="sync-label">{syncLabel[syncState]}</span>
          </span>

          {/* Theme toggle */}
          <button className="topbar-btn topbar-theme-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme" style={{ fontSize: '14px', padding: '4px 8px' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* User avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#000', flexShrink: 0, cursor: 'default', userSelect: 'none' }} title={user}>
              {userInit}
            </div>
            <span className="user-name">{user}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* ── NAV TABS ───────────────────────────────────────────────── */}
      <div className="nav-tabs">
        {links.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to.split('/').length <= 2}
            className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
            {icon && <span className="nav-icon">{icon}</span>}
            {label}
          </NavLink>
        ))}
      </div>

      {/* ── PAGE CONTENT ───────────────────────────────────────────── */}
      <div className="main page-enter">
        {children}
      </div>
    </div>
  );
}
