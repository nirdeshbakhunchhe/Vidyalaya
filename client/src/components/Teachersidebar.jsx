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
    accent: { text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-500'  },
  },
  {
    label: 'My Courses',
    icon:  FaBook,
    path:  '/teacher/courses',
    accent: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500' },
  },
  {
    label: 'Create Course',
    icon:  FaPlus,
    path:  '/teacher/create-course',
    accent: { text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-500'  },
  },
  {
    label: 'Payment History',
    icon:  FaReceipt,
    path:  '/teacher/payments',
    accent: { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-500' },
  },
  {
    label: 'Assignments',
    icon:  FaClipboardList,
    path:  '/teacher/assignments',
    accent: { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-500' },
  },
  {
    label: 'My Profile',
    icon:  FaUser,
    path:  '/profile',
    accent: { text: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-500'  },
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
                  : 'border-l-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')}
            >
              {/* Icon container */}
              <div
                className={[
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                  active ? item.accent.bg : 'bg-slate-100 group-hover:bg-slate-200',
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

export default TeacherSidebar;