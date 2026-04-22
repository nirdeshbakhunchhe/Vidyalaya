import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FaBookOpen, FaLightbulb, FaChartBar, FaBolt,
  FaBell, FaBars, FaTimes,
  FaHome, FaTh, FaBook, FaCompass, FaRobot, FaSignOutAlt,
} from 'react-icons/fa';

const MOCK_NOTIFICATIONS = [
  { id: 1, message: 'New lesson added to Web Development Bootcamp', time: '2 hrs ago', read: false },
  { id: 2, message: 'You completed "Variables & Data Types"', time: '1 day ago', read: false },
  { id: 3, message: 'Quiz deadline tomorrow: Python Basics', time: '1 day ago', read: true },
];

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [mobileMenu, setMobileMenu] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  const navLinks = [
    { label: 'Home',       path: '/home',            icon: FaHome    },
    { label: 'Dashboard',  path: '/dashboard',       icon: FaTh      },
    { label: 'My Courses', path: '/my-courses',      icon: FaBook    },
    { label: 'Explore',    path: '/explore-courses', icon: FaCompass },
    { label: 'AI Tutor',   path: '/ai-tutor',        icon: FaRobot   },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

      {/* ── Navigation Bar ── */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/home')}>
              <span className="text-2xl font-extrabold text-blue-500 tracking-tight">Vidyalaya</span>
            </div>

            {/* Nav Links (desktop) */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = link.path === '/home';
                  return (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="text-sm" />
                      <span>{link.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Bell + Avatar + Logout */}
            <div className="flex items-center space-x-2 flex-shrink-0">

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"
                >
                  <FaBell className="text-lg" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
                      {unread}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h4>
                      <button
                        onClick={() => setNotifications((p) => p.map((n) => ({ ...n, read: true })))}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 flex items-start space-x-3 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{n.message}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <button
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </button>

              {/* Logout (desktop) */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"
              >
                <FaSignOutAlt className="text-sm" />
                <span>Logout</span>
              </button>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden p-2 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"
              >
                {mobileMenu ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenu && (
            <div className="md:hidden pb-4 pt-2 space-y-1 border-t border-slate-100 dark:border-slate-700">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.path === '/home';
                return (
                  <button
                    key={link.path}
                    onClick={() => { navigate(link.path); setMobileMenu(false); }}
                    className={`w-full text-left flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => { handleLogout(); setMobileMenu(false); }}
                className="w-full text-left flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/20"
              >
                <FaSignOutAlt className="text-sm" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Welcome to <span className="text-gradient">Vidyalaya</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Your AI-powered learning companion for personalized education and growth
          </p>
        </div>

        {/* Stats/Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg mb-4">
              <FaBookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Personalized Learning</h3>
            <p className="text-slate-600 dark:text-slate-400">
              AI-powered content tailored to your learning style and pace
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg mb-4">
              <FaLightbulb className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Interactive Tutoring</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Get instant answers and explanations from our AI tutor
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg mb-4">
              <FaChartBar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Progress Tracking</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Monitor your learning journey with detailed analytics
            </p>
          </div>
        </div>

        {/* Main CTA */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-6">
              <FaBolt className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Start Learning?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
              Your personalized learning experience is ready. Start exploring courses, interact with the AI tutor, and track your progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/my-courses')}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl"
              >
                My Courses →
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 font-semibold rounded-lg border-2 border-primary-600 dark:border-primary-400 hover:bg-primary-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all"
              >
                Assignments
              </button>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Your Profile</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
              <p className="text-slate-900 dark:text-white font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
              <p className="text-slate-900 dark:text-white font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
              <p className="text-slate-900 dark:text-white font-medium capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Member Since</p>
              <p className="text-slate-900 dark:text-white font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;