import { lazy, Suspense, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Admin pages
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/admin/Home'));
const Students = lazy(() => import('./pages/admin/Students'));
const Batches = lazy(() => import('./pages/admin/Batches'));
const Fees = lazy(() => import('./pages/admin/Fees'));
const Tests = lazy(() => import('./pages/admin/Tests'));
const Attendance = lazy(() => import('./pages/admin/Attendance'));
const Performance = lazy(() => import('./pages/admin/Performance'));

// Student pages
const StudentHome = lazy(() => import('./pages/student/Home'));

function Loader() {
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'50vh'}}>
    <div style={{width:'36px',height:'36px',border:'3px solid rgba(16,185,129,.2)',borderTop:'3px solid #10b981',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
  </div>;
}

class ErrorBoundary extends Component {
  constructor(p){super(p);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){return{hasError:true,error};}
  render(){if(this.state.hasError)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'50vh',gap:'16px',color:'#fff',textAlign:'center'}}><h2>Something went wrong</h2><p style={{color:'rgba(255,255,255,.5)'}}>{this.state.error?.message}</p><button onClick={()=>{this.setState({hasError:false});window.location.reload();}} style={{padding:'10px 24px',background:'#10b981',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:600}}>Reload</button></div>;return this.props.children;}
}

function AdminRoute({children}){
  const{session,loading}=useAuth();
  if(loading)return<Loader/>;
  if(!session)return<Navigate to="/login" replace/>;
  if(session.role!=='coaching_admin')return<Navigate to="/login" replace/>;
  return<AdminLayout><ErrorBoundary><Suspense fallback={<Loader/>}>{children}</Suspense></ErrorBoundary></AdminLayout>;
}

function StudentRoute({children}){
  const{session,loading}=useAuth();
  if(loading)return<Loader/>;
  if(!session)return<Navigate to="/login" replace/>;
  if(session.role!=='coaching_student')return<Navigate to="/login" replace/>;
  return<StudentLayout><ErrorBoundary><Suspense fallback={<Loader/>}>{children}</Suspense></ErrorBoundary></StudentLayout>;
}

function RoleRedirect(){
  const{session,loading}=useAuth();
  if(loading)return<Loader/>;
  if(!session)return<Navigate to="/login" replace/>;
  if(session.role==='coaching_student')return<Navigate to="/student" replace/>;
  return<Navigate to="/home" replace/>;
}

export default function App(){
  return(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Suspense fallback={<Loader/>}><Login/></Suspense>}/>
          <Route path="/" element={<RoleRedirect/>}/>

          {/* Admin */}
          <Route path="/home" element={<AdminRoute><Home/></AdminRoute>}/>
          <Route path="/students" element={<AdminRoute><Students/></AdminRoute>}/>
          <Route path="/batches" element={<AdminRoute><Batches/></AdminRoute>}/>
          <Route path="/fees" element={<AdminRoute><Fees/></AdminRoute>}/>
          <Route path="/tests" element={<AdminRoute><Tests/></AdminRoute>}/>
          <Route path="/attendance" element={<AdminRoute><Attendance/></AdminRoute>}/>
          <Route path="/performance" element={<AdminRoute><Performance/></AdminRoute>}/>

          {/* Student */}
          <Route path="/student" element={<StudentRoute><StudentHome/></StudentRoute>}/>

          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
