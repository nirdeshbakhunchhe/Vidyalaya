// TeacherSidebar.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaBook,
  FaUser,
  FaTh,
  FaBars,
  FaTimes,
  FaReceipt,
  FaPlus,
  FaClipboardList,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar navigation items for the teacher shell.
// Each entry carries a structured `accent` object (text + bg + border) so the
// active-state classes are self-contained — consistent with StudentSidebar.
// ─────────────────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  {
    label: 'Dashboard',
    icon:  FaTh,
    path:  '/teacher/dashboard',
    accent: { text: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/30',  border: 'border-amber-500 dark:border-amber-400'  },
  },
  {
    label: 'My Courses',
    icon:  FaBook,
    path:  '/teacher/courses',
    accent: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-500 dark:border-orange-400' },
  },
  {
    label: 'Create Course',
    icon:  FaPlus,
    path:  '/teacher/create-course',
    accent: { text: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/30',  border: 'border-amber-500 dark:border-amber-400'  },
  },
  {
    label: 'Payment History',
    icon:  FaReceipt,
    path:  '/teacher/payments',
    accent: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-500 dark:border-indigo-400' },
  },
  {
    label: 'Assignments',
    icon:  FaClipboardList,
    path:  '/teacher/assignments',
    accent: { text: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/30', border: 'border-sky-500 dark:border-sky-400' },
  },
  {
    label: 'My Profile',
    icon:  FaUser,
    path:  '/profile',
    accent: { text: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/30',  border: 'border-green-500 dark:border-green-400'  },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Returns true when a sidebar item should render as active.
// "My Courses" stays highlighted for nested asset-upload pages so the user
// always knows which section they are in.
// ─────────────────────────────────────────────────────────────────────────────
const checkActive = (item, pathname) => {
  if (item.path === '/teacher/courses') {
    return pathname === '/teacher/courses' || pathname.startsWith('/teacher/courses/');
  }
  return pathname === item.path || pathname.startsWith(item.path + '/');
};

// =============================================================================
// TeacherSidebar — collapsible left nav for teacher-facing pages
// =============================================================================
const TeacherSidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={[
        'flex flex-col flex-shrink-0 h-full',
        'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      ].join(' ')}
    >
      {/* Collapse / expand toggle */}
      <div className="flex items-center justify-end px-3 py-4 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
        >
          {collapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-4 space-y-0.5 px-2" aria-label="Teacher navigation">
        {SIDEBAR_ITEMS.map((item) => {
          const active = checkActive(item, location.pathname);
          const Icon   = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                'transition-all duration-150 group',
                // Transparent border when inactive keeps layout stable
                'border-l-4',
                active
                  ? `${item.accent.bg} ${item.accent.text} ${item.accent.border} font-semibold`
                  : 'border-l-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-white dark:hover:text-white',
              ].join(' ')}
            >
              {/* Icon container */}
              <div
                className={[
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                  active ? item.accent.bg : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:hover:bg-slate-700 dark:group-hover:bg-slate-700',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'text-sm transition-colors',
                    active ? item.accent.text : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:text-slate-300 dark:group-hover:text-slate-200',
                  ].join(' ')}
                />
              </div>

              {/* Label — hidden when collapsed */}
              {!collapsed && (
                <span className="text-sm truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default TeacherSidebar;