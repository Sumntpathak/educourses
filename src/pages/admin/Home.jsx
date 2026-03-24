import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coaching_getDashboard, coaching_getBatches } from '../../api/client';
import { fmt } from '../../utils/format';
import { Users, IndianRupee, CheckSquare, Layers, Plus, CreditCard, FileText, BarChart3 } from 'lucide-react';

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

  if (loading) return <div className="loader"><div className="loader-ring"></div><div className="loader-dots"><span></span><span></span><span></span></div></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Section Header */}
      <div className="shdr">
        <div>
          <div className="stitle">{greeting}, {session?.user?.split(' ')[0]}</div>
          <div className="ssub">{today}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Mark Attendance', color: '#10b981', to: '/attendance', Icon: CheckSquare },
          { label: 'Collect Fee', color: '#f59e0b', to: '/fees', Icon: CreditCard },
          { label: 'Add Student', color: '#06b6d4', to: '/students', Icon: Plus },
          { label: 'New Test', color: '#8b5cf6', to: '/tests', Icon: FileText },
          { label: 'Analytics', color: '#f472b6', to: '/performance', Icon: BarChart3 },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.to)}
            style={{
              padding: '16px 14px', borderRadius: 'var(--radius-md)',
              border: `1px solid ${a.color}25`, background: `${a.color}08`,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
              transition: 'all .2s ease', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '8px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${a.color}15`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${a.color}08`; e.currentTarget.style.transform = ''; }}>
            <a.Icon size={22} color={a.color} />
            <div style={{ fontSize: '12px', fontWeight: 600, color: a.color }}>{a.label}</div>
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {data && [
          { label: 'Students', value: data.totalStudents, color: '#06b6d4', Icon: Users },
          { label: 'Batches', value: data.totalBatches, color: '#8b5cf6', Icon: Layers },
          { label: 'Fee Collected', value: `₹${fmt(data.monthFeeCollected)}`, sub: data.month, color: '#10b981', Icon: IndianRupee },
          { label: 'Fee Pending', value: `₹${fmt(data.monthFeePending)}`, sub: data.month, color: data.monthFeePending > 0 ? '#ef4444' : '#10b981', Icon: CreditCard },
          { label: 'Present Today', value: data.todayPresent, color: '#f59e0b', Icon: CheckSquare },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color, fontFamily: "'JetBrains Mono',monospace" }}>{k.value}</div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Today's Batches */}
      <div className="form-card">
        <div className="form-section-title">Today's Active Batches</div>
        {batches.length === 0 ? (
          <div className="empty">No batches yet. Create your first batch to get started.</div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {batches.filter(b => b.status === 'Active').map(b => (
              <div key={b.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', background: 'var(--subtle)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--glass-border)', transition: 'background .15s',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{b.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{b.subject || '—'} · {b.schedule || '—'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: '#8b5cf6', fontWeight: 600 }}>{b.studentCount}/{b.maxStudents}</span>
                  <button onClick={() => navigate('/attendance')} className="form-btn outline" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}>
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
