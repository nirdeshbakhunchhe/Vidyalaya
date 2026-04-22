import { FaChalkboardTeacher, FaSignOutAlt, FaUser, FaUserShield, FaUsers, FaSun, FaMoon } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const { user, logout, toggleTheme } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800'
    }`;

  const handleLogout = () => {
    logout();
  };

  const adminName = user?.name || 'Admin';
  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FaUserShield className="text-primary-600 text-xl" />
            <span className="font-bold text-slate-900 dark:text-white text-lg">Admin Panel</span>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-1">
          <NavLink to="/admin" className={navItemClass} end>
            <FaChalkboardTeacher className="text-base" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/users" className={navItemClass}>
            <FaUsers className="text-base" />
            <span>Users</span>
          </NavLink>
          <NavLink to="/admin/teachers" className={navItemClass}>
            <FaChalkboardTeacher className="text-base" />
            <span>Teachers</span>
          </NavLink>
          <NavLink to="/admin/profile" className={navItemClass}>
            <FaUser className="text-base" />
            <span>Profile</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"
            >
              <span className="sr-only">Toggle sidebar</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5h14a1 1 0 100-2H3a1 1 0 000 2zm14 4H3a1 1 0 000 2h14a1 1 0 100-2zm0 6H3a1 1 0 100 2h14a1 1 0 100-2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Admin
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {adminName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition-colors"
            >
              {user?.themePreference === 'dark' ? <FaSun size={18} /> : <FaMoon size={18} />}
            </button>
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs text-slate-400">Role</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase">
                {user?.role || 'admin'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {initials}
              </div>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/20"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

