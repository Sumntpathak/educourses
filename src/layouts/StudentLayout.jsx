import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentLayout({children}) {
  const {session, signOut} = useAuth();
  const navigate = useNavigate();
  const initials = (session?.user||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  return (
    <div style={{minHeight:'100vh',background:'#050a14'}}>
      {/* Top Bar */}
      <header style={{height:'60px',background:'rgba(16,185,129,.03)',borderBottom:'1px solid rgba(16,185,129,.1)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'34px',height:'34px',borderRadius:'10px',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span style={{fontSize:'15px',fontWeight:800,color:'#fff'}}>edu<span style={{color:'#6ee7b7'}}>courses</span></span>
          <span style={{fontSize:'10px',padding:'3px 10px',borderRadius:'6px',background:'rgba(6,182,212,.15)',color:'#67e8f9',fontWeight:700}}>STUDENT</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,color:'#fff'}}>{initials}</div>
          <span style={{fontSize:'13px',color:'rgba(255,255,255,.7)'}}>{session?.user}</span>
          <button onClick={async()=>{await signOut();navigate('/login');}} style={{padding:'6px 14px',borderRadius:'8px',border:'1px solid rgba(255,255,255,.08)',background:'transparent',color:'rgba(255,255,255,.4)',fontSize:'11px',cursor:'pointer',fontFamily:'inherit'}}>Logout</button>
        </div>
      </header>
      <main style={{padding:'24px',maxWidth:'900px',margin:'0 auto'}}>{children}</main>
    </div>
  );
}
