import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coaching_register, coaching_login, coaching_student_login, setToken } from '../api/client';
import { ShieldCheck, Users, GraduationCap } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null = role selection, 'login' | 'register' | 'student'
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      let data;
      if (mode === 'student') {
        if (!form.name || !form.mobile) { setErr('Enter name and mobile number'); setBusy(false); return; }
        data = await coaching_student_login({ name: form.name, mobile: form.mobile });
        if (!data.success) { setErr(data.error); setBusy(false); return; }
        setToken(data.token); localStorage.setItem('school_id', data.coaching_id);
        signIn({ ...data, school_id: data.coaching_id }); navigate('/student', { replace: true });
      } else if (mode === 'register') {
        if (!form.name || !form.email || !form.password) { setErr('All fields required'); setBusy(false); return; }
        data = await coaching_register({ name: form.name, email: form.email, phone: form.phone, password: form.password, institute_name: form.institute });
        if (!data.success) { setErr(data.error); setBusy(false); return; }
        setToken(data.token); localStorage.setItem('school_id', data.coaching_id);
        signIn({ ...data, school_id: data.coaching_id }); navigate('/home', { replace: true });
      } else {
        if (!form.email || !form.password) { setErr('Enter email and password'); setBusy(false); return; }
        data = await coaching_login({ email: form.email, password: form.password });
        if (!data.success) { setErr(data.error); setBusy(false); return; }
        setToken(data.token); localStorage.setItem('school_id', data.coaching_id);
        signIn({ ...data, school_id: data.coaching_id }); navigate('/home', { replace: true });
      }
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const onKey = e => { if (e.key === 'Enter') submit(); };

  // ── Role selection screen ──
  if (!mode) {
    return (
      <div className="login-screen">
        <div className="login-box" style={{ width: '480px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '14px', position: 'relative',
                background: 'var(--accent)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '14px', background: 'linear-gradient(135deg, rgba(255,255,255,.3) 0%, transparent 50%, rgba(0,0,0,.15) 100%)' }} />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" style={{ position: 'relative', zIndex: 1 }}>
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-.02em' }}>
                  edu<span style={{ color: 'var(--accent)' }}>courses</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '.05em', marginTop: '1px' }}>COACHING & COURSE MANAGEMENT</div>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', margin: '0 0 24px' }}>Choose how you'd like to log in</p>

          {/* Role cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <RoleCard icon={<ShieldCheck size={28} />} title="Admin" desc="Coaching administration" onClick={() => { setMode('login'); setForm({}); setErr(''); }} />
            <RoleCard icon={<Users size={28} />} title="Student" desc="Scores, fees, attendance" onClick={() => { setMode('student'); setForm({}); setErr(''); }} />
          </div>

          <button onClick={() => { setMode('register'); setForm({}); setErr(''); }}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit',
              background: 'linear-gradient(135deg, rgba(16,185,129,.08) 0%, rgba(6,182,212,.08) 100%)',
              border: '1px solid rgba(16,185,129,.2)',
              display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'all .2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,.15) 0%, rgba(6,182,212,.12) 100%)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,.2)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,.08) 0%, rgba(6,182,212,.08) 100%)'; e.currentTarget.style.transform = ''; }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GraduationCap size={20} color="#fff" />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1.2 }}>New Institute? Register Free</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Start free with 30 students, all features included</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: 'rgba(255,255,255,.18)' }}>
            courses.eduportal.solutions
          </div>
        </div>
      </div>
    );
  }

  // ── Login / Register / Student form ──
  return (
    <div className="login-screen">
      <div className="login-box">
        {/* Logo */}
        <div className="school-crest">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', position: 'relative',
              background: 'var(--accent)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,.25) 0%, transparent 50%, rgba(0,0,0,.1) 100%)' }} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" style={{ position: 'relative', zIndex: 1 }}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)' }}>edu<span style={{ color: 'var(--accent)' }}>courses</span></div>
            </div>
          </div>
          <p>{mode === 'student' ? 'Student Portal' : mode === 'register' ? 'Create Account' : 'Admin Login'}</p>
        </div>

        {/* Mode tabs */}
        <div className="role-tabs">
          {[['login', 'Sign In'], ['register', 'Register'], ['student', 'Student']].map(([id, label]) => (
            <button key={id}
              className={`role-tab${mode === id ? ' active' : ''}`}
              onClick={() => { setMode(id); setForm({}); setErr(''); }}>
              {label}
            </button>
          ))}
        </div>

        {/* Student fields */}
        {mode === 'student' && (
          <>
            <div className="field-group">
              <label>Full Name</label>
              <input value={form.name || ''} onChange={e => set('name', e.target.value)} onKeyDown={onKey} placeholder="As registered by coaching" autoFocus />
            </div>
            <div className="field-group">
              <label>Mobile Number</label>
              <input type="tel" value={form.mobile || ''} onChange={e => set('mobile', e.target.value)} onKeyDown={onKey} placeholder="10-digit mobile" />
            </div>
          </>
        )}

        {/* Register fields */}
        {mode === 'register' && (
          <>
            <div className="field-group">
              <label>Your Name</label>
              <input value={form.name || ''} onChange={e => set('name', e.target.value)} onKeyDown={onKey} placeholder="Full name" autoFocus />
            </div>
            <div className="field-group">
              <label>Institute Name</label>
              <input value={form.institute || ''} onChange={e => set('institute', e.target.value)} onKeyDown={onKey} placeholder="e.g. Sharma Classes" />
            </div>
            <div className="field-group">
              <label>Phone</label>
              <input type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)} onKeyDown={onKey} placeholder="10-digit" />
            </div>
          </>
        )}

        {/* Email + Password for login/register */}
        {mode !== 'student' && (
          <>
            <div className="field-group">
              <label>Email</label>
              <input value={form.email || ''} onChange={e => set('email', e.target.value)} onKeyDown={onKey} placeholder="your@email.com" autoFocus={mode === 'login'} />
            </div>
            <div className="field-group" style={{ position: 'relative' }}>
              <label>Password</label>
              <input type={showPwd ? 'text' : 'password'} value={form.password || ''} onChange={e => set('password', e.target.value)} onKeyDown={onKey} placeholder={mode === 'register' ? 'Min 6 characters' : ''} />
              <button onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: '14px', bottom: '12px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}>{showPwd ? '🙈' : '👁'}</button>
            </div>
          </>
        )}

        {mode === 'register' && (
          <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.12)', borderRadius: '12px', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.8, marginBottom: '14px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Free plan:</span> 30 students · Batches · Fees · Tests · Attendance · Reports
          </div>
        )}

        <button className="login-btn" onClick={submit} disabled={busy}>
          {busy ? '...' : mode === 'student' ? 'Login →' : mode === 'register' ? 'Create Free Account →' : 'Sign In →'}
        </button>

        {err && <div className="login-error">{err}</div>}

        {/* Back to role selection */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={() => { setMode(null); setForm({}); setErr(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back to role selection
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, desc, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '20px 16px', borderRadius: '16px', cursor: 'pointer', fontFamily: 'inherit',
        border: '1px solid var(--glass-border)', background: 'var(--glass)', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        transition: 'all .2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,.4)'; e.currentTarget.style.background = 'rgba(16,185,129,.06)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--glass)'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(16,185,129,.15), rgba(6,182,212,.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>{desc}</div>
      </div>
    </button>
  );
}
