import { lazy, Suspense, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));

function Loader() {
  return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh' }}>
    <div style={{ width:'36px',height:'36px',border:'3px solid rgba(16,185,129,.2)',borderTop:'3px solid #10b981',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}

class ErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:'16px',color:'#fff',padding:'20px',textAlign:'center' }}>
        <h2 style={{ margin:0,fontSize:'20px' }}>Something went wrong</h2>
        <p style={{ margin:0,color:'rgba(255,255,255,.5)' }}>{this.state.error?.message}</p>
        <button onClick={() => { this.setState({ hasError:false }); window.location.reload(); }}
          style={{ padding:'10px 24px',background:'#10b981',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:600 }}>Reload</button>
      </div>
    );
    return this.props.children;
  }
}

function ProtectedRoute({ children, roles }) {
  const { session, loading } = useAuth();
  if (loading) return <Loader />;
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.role)) return <Navigate to="/login" replace />;
  return <AppLayout><ErrorBoundary><Suspense fallback={<Loader />}>{children}</Suspense></ErrorBoundary></AppLayout>;
}

function RoleRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <Loader />;
  if (!session) return <Navigate to="/login" replace />;
  if (session.role === 'coaching_student') return <Navigate to="/student" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Suspense fallback={<Loader />}><Login /></Suspense>} />
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/dashboard" element={<ProtectedRoute roles={['coaching_admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute roles={['coaching_student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
