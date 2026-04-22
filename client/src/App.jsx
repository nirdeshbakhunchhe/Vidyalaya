// App.jsx

// ── React Router ──────────────────────────────────────────────────────────────
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ── Auth context & route guards ───────────────────────────────────────────────
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// ── Public pages ──────────────────────────────────────────────────────────────
import Landing from './pages/Landing';
import About from './pages/About';
import Features from './pages/Features';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OtpVerification from './pages/OtpVerification';
import ExploreCourses from './pages/ExploreCourses';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// ── Authenticated pages ───────────────────────────────────────────────────────
import Home from './pages/Home';
import MyCourses from './pages/MyCourses';
import ProfilePage from './pages/ProfilePage';
import CourseDetail from './pages/CourseDetail';
import AITutorChat from './pages/AITutorChat';

// ── Payment pages ─────────────────────────────────────────────────────────────
import PaymentPage from './pages/PaymentPage';
import PaymentVerify from './pages/PaymentVerify';
import PaymentSuccess from './pages/PaymentSuccess';

// ── Student pages ─────────────────────────────────────────────────────────────
import StudentDashboard from './pages/StudentDashboard';
import CourseLearning from './pages/CourseLearning';
import StudentLearningHome from './pages/StudentLearningHome';
import Assignments from './pages/Assignments';
import StudentPaymentHistory from './pages/StudentPaymentHistory';
import GradeCalculator from './pages/GradeCalculator';
import StudyAnalytics from './pages/StudyAnalytics';
import Leaderboard from './pages/Leaderboard';

// ── Teacher pages ─────────────────────────────────────────────────────────────
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCourseAssetsUpload from './pages/TeacherCourseAssetsUpload';
import TeacherPaymentHistory from './pages/TeacherPaymentHistory';
import TeacherAssignments from './pages/TeacherAssignments';

// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminDashboard from './pages/AdminDashboard';
import AdminProfile from './pages/AdminProfile';
import AdminUsers from './pages/AdminUsers';
import AdminTeachers from './pages/AdminTeachers';

// ─────────────────────────────────────────────────────────────────────────────
// Shared full-screen loading spinner used by all route guards below.
// Centralised here so any future spinner style change only needs one edit.
// ─────────────────────────────────────────────────────────────────────────────
const LoadingSpinner = ({ color = 'border-blue-600' }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div
      className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${color}`}
      role="status"
      aria-label="Loading"
    />
  </div>
);

// ── TeacherRoute ──────────────────────────────────────────────────────────────
// Allows access only to users with role 'teacher' or 'admin'.
const TeacherRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingSpinner color="border-amber-500" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'teacher' && user?.role !== 'admin')
    return <Navigate to="/dashboard" replace />;
  return children;
};

// ── AdminRoute ────────────────────────────────────────────────────────────────
// Allows access only to users with role 'admin'.
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

// ── DashboardRouter ───────────────────────────────────────────────────────────
// Redirects each role to their own dashboard; students see StudentDashboard.
const DashboardRouter = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user?.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <StudentDashboard />;
};

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/verify-otp" element={<PublicRoute><OtpVerification /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/explore-courses" element={<ExploreCourses />} />

          {/* Authenticated routes */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
          <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/course/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/ai-tutor" element={<ProtectedRoute><AITutorChat /></ProtectedRoute>} />

          {/* Payment routes — Khalti flow: /payment → /payment/verify → /payment/success */}
          <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/payment/verify" element={<ProtectedRoute><PaymentVerify /></ProtectedRoute>} />
          <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />

          {/* Teacher-only routes */}
          <Route path="/teacher/dashboard" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
          <Route path="/teacher/courses" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
          <Route path="/teacher/create-course" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
          <Route
            path="/teacher/courses/:courseId/assets"
            element={<TeacherRoute><TeacherCourseAssetsUpload /></TeacherRoute>}
          />
          <Route path="/teacher/payments" element={<TeacherRoute><TeacherPaymentHistory /></TeacherRoute>} />
          <Route path="/teacher/assignments" element={<TeacherRoute><TeacherAssignments /></TeacherRoute>} />

          {/* Admin-only routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/teachers" element={<AdminRoute><AdminTeachers /></AdminRoute>} />

          {/* Student sub-routes */}
          <Route path="/student/course/:courseId/learn" element={<ProtectedRoute><CourseLearning /></ProtectedRoute>} />
          <Route path="/student/learning" element={<ProtectedRoute><StudentLearningHome /></ProtectedRoute>} />
          <Route path="/student/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
          <Route path="/student/calculator" element={<ProtectedRoute><GradeCalculator /></ProtectedRoute>} />
          <Route path="/student/payments" element={<ProtectedRoute><StudentPaymentHistory /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><StudyAnalytics /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
