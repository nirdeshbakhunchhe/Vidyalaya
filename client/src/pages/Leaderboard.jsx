import { useEffect, useState } from 'react';
import StudentShell from '../components/StudentShell';
import { leaderboardAPI } from '../services/api';
import { FaTrophy, FaSpinner } from 'react-icons/fa';

const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

const Leaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await leaderboardAPI.getLeaderboard();
        if (!cancelled) setRows(data?.leaderboard || []);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              'Failed to load leaderboard.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StudentShell>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Leaderboard
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Top learners by courses completed and total study time
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <FaSpinner className="text-2xl text-blue-600 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-red-200 dark:border-red-900/40">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Rankings</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/40">
                <tr className="text-slate-700 dark:text-slate-200">
                  <th className="text-left px-6 py-3 font-semibold">Rank</th>
                  <th className="text-left px-6 py-3 font-semibold">Student</th>
                  <th className="text-left px-6 py-3 font-semibold">Courses completed</th>
                  <th className="text-left px-6 py-3 font-semibold">Total study time</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-600 dark:text-slate-300">
                      No leaderboard data yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.userId}
                      className="border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <td className="px-6 py-3 font-semibold">{r.rank}</td>
                      <td className="px-6 py-3">{r.name}</td>
                      <td className="px-6 py-3">{r.coursesCompleted}</td>
                      <td className="px-6 py-3">{formatDuration(r.totalStudyTimeSeconds)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </StudentShell>
  );
};

export default Leaderboard;

