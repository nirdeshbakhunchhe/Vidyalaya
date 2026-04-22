import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { FaChalkboardTeacher, FaUserShield, FaUsers, FaSpinner } from 'react-icons/fa';
import { adminAPI, enrollmentAPI } from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const data = await adminAPI.getStats();
        if (isMounted) {
          setStats(data);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || 'Failed to load dashboard statistics'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const fetchEnrollments = async () => {
      setEnrollmentLoading(true);
      try {
        const data = await enrollmentAPI.getTeachingRequests();
        if (isMounted) {
          setEnrollments(data.enrollments || []);
        }
      } catch {
        if (isMounted) {
          setEnrollments([]);
        }
      } finally {
        if (isMounted) {
          setEnrollmentLoading(false);
        }
      }
    };

    fetchStats();
    fetchEnrollments();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: FaUsers,
      gradient: 'from-blue-500 to-cyan-500',
      sub: 'All registered accounts',
    },
    {
      label: 'Teachers',
      value: stats.totalTeachers,
      icon: FaChalkboardTeacher,
      gradient: 'from-emerald-500 to-green-500',
      sub: 'Active instructors',
    },
    {
      label: 'Admins',
      value: stats.totalAdmins,
      icon: FaUserShield,
      gradient: 'from-purple-500 to-pink-500',
      sub: 'System administrators',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            High-level overview of users and teachers. Use the sidebar to manage data.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 shadow-sm"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient}`}
              >
                <stat.icon className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {loading ? '—' : stat.value}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-0.5">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Enrollment Requests
          </h2>
          {enrollmentLoading ? (
            <div className="flex items-center justify-center py-6 text-slate-500 dark:text-slate-400 text-sm gap-2">
              <FaSpinner className="animate-spin" />
              <span>Loading requests…</span>
            </div>
          ) : enrollments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No enrollment requests yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {enrollments.slice(0, 8).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {req.studentName}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 truncate">
                      {req.courseTitle}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : req.status === 'approved'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Quick tips
          </h2>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>Use the Users page to manage roles, status, and access.</li>
            <li>Use the Teachers page to manage subject information and experience.</li>
            <li>All changes are local-only for now; integrate with your API later.</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

