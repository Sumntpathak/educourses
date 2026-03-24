import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AppLayout({ children }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = (session?.user || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const isStudent = session?.role === 'coaching_student';

  return (
    <div style={{ minHeight: '100vh', background: '#050a14' }}>
      {/* Top Bar */}
      <div style={{ height: '56px', background: 'rgba(16,185,129,.04)', borderBottom: '1px solid rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>edu<span style={{ color: '#6ee7b7' }}>courses</span></div>
          </div>
          <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', background: isStudent ? 'rgba(6,182,212,.15)' : 'rgba(16,185,129,.15)', color: isStudent ? '#67e8f9' : '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginLeft: '8px' }}>
            {isStudent ? 'Student' : 'Admin'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#fff' }}>{initials}</div>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>{session?.user}</span>
          <button onClick={handleLogout} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: 'rgba(255,255,255,.4)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Logout</button>
        </div>
      </div>
      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
