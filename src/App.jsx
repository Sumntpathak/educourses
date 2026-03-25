import { lazy, Suspense, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';

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

// New feature pages
const BatchDetail = lazy(() => import('./pages/admin/BatchDetail'));
const Tools = lazy(() => import('./pages/admin/Tools'));
const AdminTeachers = lazy(() => import('./pages/admin/Teachers'));

// Teacher pages
const TeacherHome = lazy(() => import('./pages/teacher/Home'));

// Public pages
const Landing = lazy(() => import('./pages/Landing'));

function PageLoader() {
  return (
    <div className="loader">
      <div className="loader-ring"></div>
      <div className="loader-dots"><span></span><span></span><span></span></div>
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', gap: '16px',
          color: 'var(--text)', padding: '20px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px' }}>!</div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ margin: 0, color: 'var(--muted)', maxWidth: '400px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            className="form-btn primary"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ marginTop: '8px' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children, roles }) {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.role)) return <Navigate to="/login" replace />;
  return (
    <AppLayout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
}

function TeacherRoute({ children }) {
  const teacher = (() => { try { return JSON.parse(localStorage.getItem('eduC_teacher_session')); } catch { return null; } })();
  if (!teacher) return <Navigate to="/login" replace />;
  return (
    <AppLayout teacherMode={teacher}>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
}

function RoleRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  // Check teacher session
  const teacher = (() => { try { return JSON.parse(localStorage.getItem('eduC_teacher_session')); } catch { return null; } })();
  if (teacher) return <Navigate to="/teacher" replace />;
  if (!session) return <Navigate to="/login" replace />;
  if (session.role === 'coaching_student') return <Navigate to="/student" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><Landing /></Suspense>} />
          <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
          <Route path="/app" element={<RoleRedirect />} />

          {/* Admin */}
          <Route path="/home" element={<ProtectedRoute roles={['coaching_admin']}><Home /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute roles={['coaching_admin']}><Students /></ProtectedRoute>} />
          <Route path="/batches" element={<ProtectedRoute roles={['coaching_admin']}><Batches /></ProtectedRoute>} />
          <Route path="/fees" element={<ProtectedRoute roles={['coaching_admin']}><Fees /></ProtectedRoute>} />
          <Route path="/tests" element={<ProtectedRoute roles={['coaching_admin']}><Tests /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute roles={['coaching_admin']}><Attendance /></ProtectedRoute>} />
          <Route path="/performance" element={<ProtectedRoute roles={['coaching_admin']}><Performance /></ProtectedRoute>} />
          <Route path="/batches/:id" element={<ProtectedRoute roles={['coaching_admin']}><BatchDetail /></ProtectedRoute>} />
          <Route path="/tools" element={<ProtectedRoute roles={['coaching_admin']}><Tools /></ProtectedRoute>} />
          <Route path="/teachers" element={<ProtectedRoute roles={['coaching_admin']}><AdminTeachers /></ProtectedRoute>} />

          {/* Teacher */}
          <Route path="/teacher" element={<TeacherRoute><TeacherHome /></TeacherRoute>} />
          <Route path="/teacher/batches" element={<TeacherRoute><TeacherHome /></TeacherRoute>} />
          <Route path="/teacher/students" element={<TeacherRoute><TeacherHome /></TeacherRoute>} />
          <Route path="/teacher/tests" element={<TeacherRoute><TeacherHome /></TeacherRoute>} />
          <Route path="/teacher/attendance" element={<TeacherRoute><TeacherHome /></TeacherRoute>} />
          <Route path="/teacher/schedule" element={<TeacherRoute><TeacherHome /></TeacherRoute>} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute roles={['coaching_student']}><StudentHome /></ProtectedRoute>} />
          <Route path="/student/scores" element={<ProtectedRoute roles={['coaching_student']}><StudentHome /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute roles={['coaching_student']}><StudentHome /></ProtectedRoute>} />
          <Route path="/student/fees" element={<ProtectedRoute roles={['coaching_student']}><StudentHome /></ProtectedRoute>} />
          <Route path="/student/notes" element={<ProtectedRoute roles={['coaching_student']}><StudentHome /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
