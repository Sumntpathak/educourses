import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coaching_register, coaching_login, coaching_student_login, setToken } from '../api/client';

export default function CoursesLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'student'
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
        signIn({ ...data, school_id: data.coaching_id }); navigate('/dashboard', { replace: true });
      } else {
        if (!form.email || !form.password) { setErr('Enter email and password'); setBusy(false); return; }
        data = await coaching_login({ email: form.email, password: form.password });
        if (!data.success) { setErr(data.error); setBusy(false); return; }
        setToken(data.token); localStorage.setItem('school_id', data.coaching_id);
        signIn({ ...data, school_id: data.coaching_id }); navigate('/dashboard', { replace: true });
      }
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const onKey = e => { if (e.key === 'Enter') submit(); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#050a14' }}>
      {/* Left — Branding Panel */}
      <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', background: 'linear-gradient(160deg, #064e3b 0%, #0f766e 40%, #14b8a6 100%)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,.03)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-.02em' }}>edu<span style={{ color: '#a7f3d0' }}>courses</span></div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)', letterSpacing: '.05em' }}>COACHING & COURSE MANAGEMENT</div>
            </div>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>Manage your coaching.<br/><span style={{ color: '#a7f3d0' }}>Smarter.</span></h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.7)', lineHeight: 1.7, maxWidth: '380px', margin: 0 }}>
            Students, batches, fees, tests, attendance — all in one place. Start free with 30 students.
          </p>
          <div style={{ display: 'flex', gap: '24px', marginTop: '40px' }}>
            {[['500+', 'Students'], ['50+', 'Institutes'], ['10K+', 'Tests']].map(([n, l]) => (
              <div key={l}><div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{n}</div><div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mode Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: 'rgba(255,255,255,.04)', borderRadius: '14px', padding: '4px' }}>
            {[['login', 'Sign In'], ['register', 'Register'], ['student', 'Student']].map(([id, label]) => (
              <button key={id} onClick={() => { setMode(id); setForm({}); setErr(''); }}
                style={{ flex: 1, padding: '11px', borderRadius: '11px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
                  background: mode === id ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: mode === id ? '#fff' : 'rgba(255,255,255,.4)' }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
              {mode === 'student' ? 'Student Login' : mode === 'register' ? 'Create Account' : 'Welcome back'}
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', margin: 0 }}>
              {mode === 'student' ? 'View scores, attendance & fee history' : mode === 'register' ? 'Start free — 30 students, all features' : 'Sign in to your coaching dashboard'}
            </p>
          </div>

          {/* Student fields */}
          {mode === 'student' && (
            <>
              <Inp label="Full Name" value={form.name} onChange={v => set('name', v)} onKey={onKey} placeholder="As registered by coaching" autoFocus />
              <Inp label="Mobile Number" value={form.mobile} onChange={v => set('mobile', v)} onKey={onKey} placeholder="10-digit mobile" type="tel" />
            </>
          )}

          {/* Register fields */}
          {mode === 'register' && (
            <>
              <Inp label="Your Name" value={form.name} onChange={v => set('name', v)} onKey={onKey} placeholder="Full name" autoFocus />
              <Inp label="Coaching / Institute Name" value={form.institute} onChange={v => set('institute', v)} onKey={onKey} placeholder="e.g. Sharma Classes" />
              <Inp label="Phone" value={form.phone} onChange={v => set('phone', v)} onKey={onKey} placeholder="10-digit" type="tel" />
            </>
          )}

          {/* Email + Password for login/register */}
          {mode !== 'student' && (
            <>
              <Inp label="Email" value={form.email} onChange={v => set('email', v)} onKey={onKey} placeholder="your@email.com" autoFocus={mode === 'login'} />
              <Inp label="Password" value={form.password} onChange={v => set('password', v)} onKey={onKey} type={showPwd ? 'text' : 'password'} placeholder={mode === 'register' ? 'Min 6 characters' : ''}
                extra={<button onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', cursor: 'pointer', fontSize: '14px' }}>{showPwd ? '🙈' : '👁'}</button>} />
            </>
          )}

          {mode === 'register' && (
            <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.12)', borderRadius: '12px', fontSize: '12px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8, marginBottom: '16px' }}>
              <span style={{ color: '#6ee7b7', fontWeight: 700 }}>Free plan:</span> 30 students · Batches · Fees · Tests · Attendance · Reports
            </div>
          )}

          <button onClick={submit} disabled={busy}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'opacity .15s', opacity: busy ? .7 : 1 }}>
            {busy ? '...' : mode === 'student' ? 'Login →' : mode === 'register' ? 'Create Free Account →' : 'Sign In →'}
          </button>

          {err && <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#fca5a5' }}>{err}</div>}

          {/* Switch link */}
          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
            <a href="https://eduportal.solutions/login" style={{ color: 'rgba(255,255,255,.3)', fontSize: '12px', textDecoration: 'none' }}>
              ← Switch to School Portal
            </a>
          </div>
        </div>
      </div>

      {/* Mobile: hide left panel */}
      <style>{`@media(max-width:768px){div[style*="flex: 0 0 45%"]{display:none!important}}`}</style>
    </div>
  );
}

function Inp({ label, value, onChange, onKey, type = 'text', placeholder, autoFocus, extra }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} onKeyDown={onKey} placeholder={placeholder} autoFocus={autoFocus} autoComplete="off"
          style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
          onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.08)'} />
        {extra}
      </div>
    </div>
  );
}
