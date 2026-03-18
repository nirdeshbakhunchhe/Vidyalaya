import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Landing from './pages/Landing';
import About from './pages/About';
import Features from './pages/Features';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OtpVerification from './pages/OtpVerification';
import Home from './pages/Home';
import ExploreCourses from './pages/ExploreCourses';
import CourseDetail from './pages/CourseDetail';
import AITutorChat from './pages/AITutorChat';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import MyCourses from './pages/MyCourses';
import ProfilePage from './pages/ProfilePage';
import CourseLearning from './pages/CourseLearning';
import Assignments from './pages/Assignments';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfile from './pages/AdminProfile';
import AdminUsers from './pages/AdminUsers';
import AdminTeachers from './pages/AdminTeachers';

// ── TeacherRoute ──────────────────────────────────────────────────────────────
// Wraps ProtectedRoute and additionally enforces role === 'teacher'.
const TeacherRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    // Students who land on /teacher/dashboard get redirected to their own dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ── AdminRoute ─────────────────────────────────────────────────────────────────
// Restricts access to admin-only routes.
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ── Role-aware dashboard redirect ────────────────────────────────────────────
// /dashboard redirects teachers to their own dashboard automatically.
const DashboardRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user?.role === 'teacher') {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <StudentDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public Routes ── */}
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <PublicRoute>
                <OtpVerification />
              </PublicRoute>
            }
          />

          {/* ExploreCourses — public but handles auth internally */}
          <Route path="/explore-courses" element={<ExploreCourses />} />

          {/* ── Protected Routes ── */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* /dashboard: auto-redirects teachers to /teacher/dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-courses"
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:id"
            element={
              <ProtectedRoute>
                <CourseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-tutor"
            element={
              <ProtectedRoute>
                <AITutorChat />
              </ProtectedRoute>
            }
          />

          {/* ── Teacher-only Routes ── */}
          <Route
            path="/teacher/dashboard"
            element={
              <TeacherRoute>
                <TeacherDashboard />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/courses"
            element={
              <TeacherRoute>
                <TeacherDashboard />
              </TeacherRoute>
            }
          />

          {/* ── Admin Routes ── */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminRoute>
                <AdminProfile />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/teachers"
            element={
              <AdminRoute>
                <AdminTeachers />
              </AdminRoute>
            }
          />

          {/* ── Student sub-routes ── */}
          <Route
            path="/student/course/:courseId/learn"
            element={
              <ProtectedRoute>
                <CourseLearning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute>
                <Assignments />
              </ProtectedRoute>
            }
          />

          {/* Default fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
