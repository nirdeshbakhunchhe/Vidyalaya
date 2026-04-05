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
    accent: { text: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-500'   },
  },
  {
    label: 'My Courses',
    icon:  FaBook,
    path:  '/my-courses',
    accent: { text: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-500'   },
  },
  {
    label: 'Learning',
    icon:  FaPlay,
    path:  '/student/learning',
    accent: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500' },
  },
  {
    label: 'Assignments',
    icon:  FaClipboardList,
    path:  '/student/assignments',
    accent: { text: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-500'  },
  },
  {
    label: 'Payment History',
    icon:  FaReceipt,
    path:  '/student/payments',
    accent: { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-500' },
  },
  {
    label: 'My Profile',
    icon:  FaUser,
    path:  '/profile',
    accent: { text: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-500'  },
  },
  {
    label: 'Explore Courses',
    icon:  FaCompass,
    path:  '/explore-courses',
    accent: { text: 'text-cyan-600',   bg: 'bg-cyan-50',   border: 'border-cyan-500'   },
  },
  {
    label: 'AI Tutor',
    icon:  FaRobot,
    path:  '/ai-tutor',
    accent: { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-500' },
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
        'bg-white border-r border-slate-200',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      ].join(' ')}
    >
      {/* Collapse / expand toggle */}
      <div className="flex items-center justify-end px-3 py-4 border-b border-slate-100">
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
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
                  : 'border-l-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')}
            >
              {/* Icon container — coloured background when active, neutral when not */}
              <div
                className={[
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  active ? item.accent.bg : 'bg-slate-100 group-hover:bg-slate-200',
                  'transition-colors',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'text-sm transition-colors',
                    active ? item.accent.text : 'text-slate-500 group-hover:text-slate-700',
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