import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to:'/home',        label:'Home',        icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { to:'/students',    label:'Students',    icon:'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
  { to:'/batches',     label:'Batches',     icon:'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to:'/fees',        label:'Fees',        icon:'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { to:'/tests',       label:'Tests',       icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to:'/attendance',  label:'Attendance',  icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to:'/performance', label:'Analytics',   icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

export default function AdminLayout({children}) {
  const {session, signOut} = useAuth();
  const navigate = useNavigate();
  const initials = (session?.user||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#050a14'}}>
      {/* Sidebar */}
      <aside className="ec-sidebar">
        {/* Logo */}
        <div style={{padding:'20px 16px 24px',borderBottom:'1px solid rgba(16,185,129,.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <div>
              <div style={{fontSize:'15px',fontWeight:800,color:'#fff',lineHeight:1}}>edu<span style={{color:'#6ee7b7'}}>courses</span></div>
              <div style={{fontSize:'9px',color:'rgba(255,255,255,.3)',letterSpacing:'.06em',marginTop:'2px'}}>COACHING MANAGEMENT</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{padding:'12px 8px',flex:1}}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className={({isActive})=>`ec-nav-item${isActive?' active':''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon}/></svg>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{padding:'12px 16px',borderTop:'1px solid rgba(16,185,129,.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
            <div style={{width:'34px',height:'34px',borderRadius:'50%',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:800,color:'#fff',flexShrink:0}}>{initials}</div>
            <div style={{overflow:'hidden'}}>
              <div style={{fontSize:'13px',fontWeight:600,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{session?.user}</div>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,.3)'}}>Admin</div>
            </div>
          </div>
          <button onClick={async()=>{await signOut();navigate('/login');}} style={{width:'100%',padding:'8px',borderRadius:'8px',border:'1px solid rgba(255,255,255,.08)',background:'transparent',color:'rgba(255,255,255,.4)',fontSize:'11px',cursor:'pointer',fontFamily:'inherit'}}>Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ec-main">
        {children}
      </main>
    </div>
  );
}
