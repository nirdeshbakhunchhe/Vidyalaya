// StudentSidebar.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaBook,
  FaRobot,
  FaCompass,
  FaUser,
  FaBars,
  FaTimes,
  FaClipboardList,
  FaPlay,
  FaReceipt,
  FaTh,
  FaCalculator,
  FaChartLine,
  FaTrophy,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar navigation items.
// Each entry carries its own accent colour so items are visually distinct
// without a shared colour token that may not be defined in Tailwind config.
//
// NOTE: Learning path does NOT hardcode a course ID — the /student/learning
// route redirects to the student's first enrolled course automatically.
// ─────────────────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  {
    label: 'Dashboard',
    icon:  FaTh,
    path:  '/dashboard',
    accent: { text: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/30',   border: 'border-blue-500 dark:border-blue-400'   },
  },
  {
    label: 'My Courses',
    icon:  FaBook,
    path:  '/my-courses',
    accent: { text: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/30',   border: 'border-blue-500 dark:border-blue-400'   },
  },
  {
    label: 'Learning',
    icon:  FaPlay,
    path:  '/student/learning',
    accent: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-500 dark:border-orange-400' },
  },
  {
    label: 'Assignments',
    icon:  FaClipboardList,
    path:  '/student/assignments',
    accent: { text: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/30',  border: 'border-amber-500 dark:border-amber-400'  },
  },
  {
    label: 'Payment History',
    icon:  FaReceipt,
    path:  '/student/payments',
    accent: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-500 dark:border-indigo-400' },
  },
  {
    label: 'My Profile',
    icon:  FaUser,
    path:  '/profile',
    accent: { text: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/30',  border: 'border-green-500 dark:border-green-400'  },
  },
  {
    label: 'Grade Predictor',
    icon:  FaCalculator,
    path:  '/student/calculator',
    accent: { text: 'text-teal-600 dark:text-teal-400',   bg: 'bg-teal-50 dark:bg-teal-900/30',   border: 'border-teal-500 dark:border-teal-400'   },
  },
  {
    label: 'Study Analytics',
    icon:  FaChartLine,
    path:  '/analytics',
    accent: { text: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-50 dark:bg-rose-900/30',   border: 'border-rose-500 dark:border-rose-400'   },
  },
  {
    label: 'Leaderboard',
    icon:  FaTrophy,
    path:  '/leaderboard',
    accent: { text: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-500 dark:border-yellow-400' },
  },
  {
    label: 'Explore Courses',
    icon:  FaCompass,
    path:  '/explore-courses',
    accent: { text: 'text-cyan-600 dark:text-cyan-400',   bg: 'bg-cyan-50 dark:bg-cyan-900/30',   border: 'border-cyan-500 dark:border-cyan-400'   },
  },
  {
    label: 'AI Tutor',
    icon:  FaRobot,
    path:  '/ai-tutor',
    accent: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-500 dark:border-purple-400' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Returns true when the current pathname matches an item's route.
// Special cases handle nested routes (e.g. /student/course/:id/learn counts
// as the "Learning" item being active).
// ─────────────────────────────────────────────────────────────────────────────
const checkActive = (item, pathname) => {
  switch (item.label) {
    case 'Learning':
      return pathname === '/student/learning' || pathname.startsWith('/student/course/');
    case 'Assignments':
      return pathname.startsWith('/student/assignments');
    case 'Payment History':
      return pathname.startsWith('/student/payments');
    default:
      return pathname === item.path;
  }
};

// =============================================================================
// StudentSidebar — collapsible left nav for student-facing pages
// =============================================================================
const StudentSidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // ── Render ──────────────────────────────────────────────────────────────────
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
      <nav className="flex-1 py-4 space-y-0.5 px-2" aria-label="Student navigation">
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
                // Left border acts as the active indicator; transparent when inactive
                // so layout doesn't shift between states
                'border-l-4',
                active
                  ? `${item.accent.bg} ${item.accent.text} ${item.accent.border} font-semibold`
                  : 'border-l-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-white dark:hover:text-white',
              ].join(' ')}
            >
              {/* Icon container — coloured background when active, neutral when not */}
              <div
                className={[
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  active ? item.accent.bg : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:hover:bg-slate-700 dark:group-hover:bg-slate-700',
                  'transition-colors',
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

export default StudentSidebar;