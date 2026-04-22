import DashboardNav from '../pages/DashboardNav';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentSidebar from './StudentSidebar';
import TeacherSidebar from './TeacherSidebar';

// Routes that render inside the dashboard shell (top nav + sidebar)
const STUDENT_ROUTE_PREFIXES = [
  '/dashboard',
  '/my-courses',
  '/profile',
  '/explore-courses',
  '/ai-tutor',
  '/analytics',
  '/leaderboard',
  '/student/',
];

const TEACHER_ROUTE_PREFIXES = [
  '/profile',
  '/explore-courses',
  '/ai-tutor',
];

const isShellRoute = (pathname, role) => {
  if (role === 'teacher' || role === 'admin') {
    return TEACHER_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }
  return STUDENT_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const StudentShell = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  // Teacher dashboard/courses routes render their own shell inside TeacherDashboard
  // skip here to avoid double shell
  if (location.pathname.startsWith('/teacher/')) {
    return <>{children}</>;
  }

  if (!isShellRoute(location.pathname, user?.role)) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <DashboardNav activePage={location.pathname} />
      <div className="flex flex-1 overflow-hidden">
        {isTeacher ? <TeacherSidebar /> : <StudentSidebar />}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentShell;
