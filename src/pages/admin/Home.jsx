import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coaching_getDashboard, coaching_getBatches } from '../../api/client';
import { fmt } from '../../utils/format';

export default function Home() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      coaching_getDashboard().catch(() => null),
      coaching_getBatches().catch(() => ({ batches: [] })),
    ]).then(([d, b]) => {
      setData(d);
      setBatches(b.batches || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loader"><div className="loader-ring"/></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>{greeting}, <span style={{ color: '#6ee7b7' }}>{session?.user?.split(' ')[0]}</span></h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>{today}</p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '28px' }}>
        {[
          { label: 'Mark Attendance', color: '#10b981', to: '/attendance', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Collect Fee', color: '#f59e0b', to: '/fees', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: 'Add Student', color: '#06b6d4', to: '/students', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
          { label: 'New Test', color: '#8b5cf6', to: '/tests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.to)}
            style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${a.color}25`, background: `${a.color}08`, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${a.color}15`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${a.color}08`; e.currentTarget.style.transform = ''; }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}><path d={a.icon}/></svg>
            <div style={{ fontSize: '12px', fontWeight: 600, color: a.color }}>{a.label}</div>
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '14px', marginBottom: '28px' }}>
        {data && [
          { label: 'Students', value: data.totalStudents, color: '#06b6d4' },
          { label: 'Batches', value: data.totalBatches, color: '#8b5cf6' },
          { label: 'Fee Collected', value: `₹${fmt(data.monthFeeCollected)}`, sub: data.month, color: '#10b981' },
          { label: 'Fee Pending', value: `₹${fmt(data.monthFeePending)}`, sub: data.month, color: data.monthFeePending > 0 ? '#ef4444' : '#10b981' },
          { label: 'Present Today', value: data.todayPresent, color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '22px', fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: '4px' }}>{k.label}</div>
            {k.sub && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Today's Batches */}
      <div className="form-card">
        <div className="form-section-title">Today's Batches</div>
        {batches.length === 0 ? (
          <div className="empty">No batches yet. Create your first batch to get started.</div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {batches.filter(b => b.status === 'Active').map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{b.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{b.subject || '—'} · {b.schedule || '—'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: 600 }}>{b.studentCount}/{b.maxStudents}</span>
                  <button onClick={() => navigate('/attendance')}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,.3)', background: 'rgba(16,185,129,.06)', color: '#6ee7b7', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Mark Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
