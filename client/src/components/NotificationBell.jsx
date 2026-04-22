import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const TYPE_ICONS = {
  enrollment_request: '📥',
  enrollment_approved: '✅',
  enrolled: '🎓',
  assignment: '📝',
  content: '🎬',
  submission: '📤',
};

const TYPE_LABELS = {
  enrollment_request: 'Enrollment Request',
  enrollment_approved: 'Approved',
  enrolled: 'Enrolled',
  assignment: 'Assignment',
  content: 'New Content',
  submission: 'Submission',
};

const TYPE_ROUTES = {
  enrollment_request: '/teacher/dashboard',
  submission: '/teacher/assignments',
  assignment: '/student/assignments',
  content: '/student/learning',
  enrolled: '/my-courses',
  enrollment_approved: '/my-courses',
};

const TYPE_COLORS = {
  enrollment_request: 'bg-orange-100 text-orange-600',
  enrollment_approved: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  enrolled: 'bg-emerald-100 text-emerald-600',
  assignment: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  content: 'bg-purple-100 text-purple-600',
  submission: 'bg-indigo-100 text-indigo-600',
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function NotificationBell() {
  const { notifications, unreadCount, isOpen, setIsOpen, markAsRead, markAllAsRead } =
    useNotifications();
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, setIsOpen]);

  const handleClick = async (notif) => {
    if (!notif.isRead) await markAsRead(notif._id);
    const route = TYPE_ROUTES[notif.type];
    if (route) {
      navigate(route);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/20 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel — matches the site's white/blue design */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[480px] flex flex-col rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-slate-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-100 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 ${
                    !n.isRead ? 'bg-blue-50 dark:bg-blue-900/20/60' : ''
                  }`}
                >
                  {/* Type badge */}
                  <div
                    className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base ${
                      TYPE_COLORS[n.type] || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {TYPE_ICONS[n.type] || '🔔'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        n.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'
                      }`}
                    >
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        {TYPE_LABELS[n.type] || n.type}
                      </span>
                      <span className="text-slate-300 text-[10px]">·</span>
                      <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-2.5 text-center">
              <span className="text-xs text-slate-400">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
