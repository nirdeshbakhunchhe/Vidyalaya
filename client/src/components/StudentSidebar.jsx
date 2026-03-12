import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaBook,
  FaRobot,
  FaCompass,
  FaUser,
  FaArrowRight,
  FaBars,
  FaTimes,
  FaClipboardList,
  FaPlay,
} from 'react-icons/fa';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard',      icon: FaCompass,      path: '/dashboard',               color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  { label: 'My Courses',     icon: FaBook,         path: '/my-courses',              color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  { label: 'Learning',       icon: FaPlay,         path: '/student/course/1/learn',  color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-900/20'  },
  { label: 'Assignments',    icon: FaClipboardList,path: '/student/assignments',     color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20'   },
  { label: 'My Profile',     icon: FaUser,         path: '/profile',                 color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20'   },
  { label: 'Explore Courses',icon: FaCompass,      path: '/explore-courses',         color: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-50 dark:bg-cyan-900/20'     },
  { label: 'AI Tutor',       icon: FaRobot,        path: '/ai-tutor',                color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
];

const StudentSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (item) => {
    if (item.label === 'Learning') {
      return location.pathname.startsWith('/student/course/');
    }
    if (item.label === 'Assignments') {
      return location.pathname.startsWith('/student/assignments');
    }
    return location.pathname === item.path;
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 flex-shrink-0 h-full`}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-end px-3 py-4 border-b border-slate-100 dark:border-slate-700">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {SIDEBAR_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group relative ${
                active
                  ? `${item.bg} ${item.color} font-semibold border-l-4 border-l-primary-500 dark:border-l-primary-400`
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-l-4 border-l-transparent'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  active ? item.bg : 'bg-slate-100 dark:bg-slate-700'
                }`}
              >
                <item.icon
                  className={`text-sm ${
                    active ? item.color : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
              </div>
              {!collapsed && <span className="text-sm truncate">{item.label}</span>}
              {!collapsed && !active && (
                <FaArrowRight className="text-xs text-slate-300 group-hover:text-slate-500 transition-colors ml-auto" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default StudentSidebar;