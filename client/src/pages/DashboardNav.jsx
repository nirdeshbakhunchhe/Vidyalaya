// DashboardNav.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Auth context ──────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaBars,
  FaTimes,
  FaTh,
  FaBook,
  FaCompass,
  FaRobot,
  FaSignOutAlt,
  FaSun,
  FaMoon,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Role-based nav link sets.
// Defined outside the component so they are not re-created on every render.
// ─────────────────────────────────────────────────────────────────────────────
const TEACHER_LINKS = [
  { label: 'Dashboard', path: '/teacher/dashboard', icon: FaTh      },
  { label: 'Explore',   path: '/explore-courses',   icon: FaCompass },
  { label: 'AI Tutor',  path: '/ai-tutor',          icon: FaRobot   },
];

const STUDENT_LINKS = [
  { label: 'Dashboard',  path: '/dashboard',        icon: FaTh      },
  { label: 'My Courses', path: '/my-courses',       icon: FaBook    },
  { label: 'Explore',    path: '/explore-courses',  icon: FaCompass },
  { label: 'AI Tutor',   path: '/ai-tutor',         icon: FaRobot   },
];

// =============================================================================
// DashboardNav — sticky top bar used across all authenticated pages
// =============================================================================
const DashboardNav = ({ activePage }) => {
  const { user, logout, toggleTheme } = useAuth();
  const navigate         = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const navLinks  = isTeacher ? TEACHER_LINKS : STUDENT_LINKS;

  // Home path used by the logo click — takes each role to their own dashboard
  const homePath = isTeacher ? '/teacher/dashboard' : '/dashboard';

  // Determines whether a nav link should render in its active state.
  // Teacher dashboard matches all /teacher/* sub-routes so the tab stays
  // highlighted during course management flows.
  const isLinkActive = (link) =>
    activePage === link.path ||
    (link.path === '/teacher/dashboard' && activePage?.startsWith('/teacher/'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo — navigates to the role-appropriate home */}
          <button
            onClick={() => navigate(homePath)}
            className="flex-shrink-0 text-2xl font-extrabold text-blue-600 tracking-tight hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-1"
            aria-label="Go to dashboard"
          >
            Vidyalaya
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon   = link.icon;
                const active = isLinkActive(link);
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    <Icon className="text-sm" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side — notification bell + theme toggle + avatar + logout + mobile toggle */}
          <div className="flex items-center space-x-2 flex-shrink-0">

            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle — Desktop */}
            <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="hidden sm:block p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                {user?.themePreference === 'dark' ? <FaSun size={18} /> : <FaMoon size={18} />}
            </button>

            {/* Avatar button — navigates to profile */}
            <button
              onClick={() => navigate('/profile')}
              aria-label="View profile"
              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all overflow-hidden flex-shrink-0"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </button>

            {/* Logout — hidden on xs so mobile menu handles it */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <FaSignOutAlt className="text-sm" />
              <span>Logout</span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="md:hidden p-2 text-slate-500 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu — slides in when mobileOpen is true */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1 border-t border-slate-100">
            {navLinks.map((link) => {
              const Icon   = link.icon;
              const active = isLinkActive(link);
              return (
                <button
                  key={link.path}
                  onClick={() => { navigate(link.path); setMobileOpen(false); }}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'w-full text-left flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <Icon className="text-sm" />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {/* Theme Toggle in mobile menu */}
            <button
               onClick={() => { toggleTheme(); setMobileOpen(false); }}
               className="w-full text-left flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {user?.themePreference === 'dark' ? <FaSun className="text-sm" /> : <FaMoon className="text-sm" />}
              <span>{user?.themePreference === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>

            {/* Logout in mobile menu — shown only here on xs screens */}
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <FaSignOutAlt className="text-sm" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DashboardNav;