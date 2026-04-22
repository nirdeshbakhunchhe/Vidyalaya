import { useEffect, useMemo, useState } from 'react';
import StudentShell from '../components/StudentShell';
import { analyticsAPI } from '../services/api';
import { FaChartLine, FaClock, FaSpinner } from 'react-icons/fa';

const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

const MiniBarChart = ({ title, items, valueKey = 'count', labelKey = 'date' }) => {
  const max = useMemo(() => {
    const vals = (items || []).map((i) => Number(i?.[valueKey]) || 0);
    return Math.max(1, ...vals);
  }, [items, valueKey]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <FaChartLine className="text-blue-500" />
        <span>{title}</span>
      </h3>

      {(!items || items.length === 0) ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No activity data yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const label = String(it?.[labelKey] ?? '');
            const value = Number(it?.[valueKey]) || 0;
            const widthPct = Math.round((value / max) * 100);
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="w-24 text-xs text-slate-500 dark:text-slate-400 truncate">
                  {label}
                </div>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <div className="w-10 text-right text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const LineChart = ({ title, points }) => {
  const width = 640;
  const height = 160;
  const padding = 24;

  const max = useMemo(() => {
    const vals = (points || []).map((p) => Number(p?.seconds) || 0);
    return Math.max(1, ...vals);
  }, [points]);

  const pathD = useMemo(() => {
    if (!points || points.length === 0) return '';
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    return points
      .map((p, idx) => {
        const x = padding + (idx / Math.max(1, points.length - 1)) * innerW;
        const y = padding + (1 - (Number(p.seconds) || 0) / max) * innerH;
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [points, max]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <FaChartLine className="text-blue-500" />
        <span>{title}</span>
      </h3>

      {!points || points.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">No study data yet.</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <svg width={width} height={height} className="min-w-[640px]">
            <path d={pathD} fill="none" stroke="rgb(37 99 235)" strokeWidth="3" />
          </svg>
        </div>
      )}
    </div>
  );
};

const WeeklyCompareBar = ({ title, thisWeekSeconds, lastWeekSeconds }) => {
  const max = Math.max(1, Number(thisWeekSeconds) || 0, Number(lastWeekSeconds) || 0);
  const a = Math.round(((Number(lastWeekSeconds) || 0) / max) * 100);
  const b = Math.round(((Number(thisWeekSeconds) || 0) / max) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <FaChartLine className="text-blue-500" />
        <span>{title}</span>
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200 mb-1">
            <span>Last week</span>
            <span className="font-semibold">{formatDuration(lastWeekSeconds)}</span>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-3 bg-slate-500 rounded-full" style={{ width: `${a}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200 mb-1">
            <span>This week</span>
            <span className="font-semibold">{formatDuration(thisWeekSeconds)}</span>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-3 bg-blue-600 rounded-full" style={{ width: `${b}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StudyAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await analyticsAPI.getSummary();
        if (!cancelled) setSummary(data?.summary || null);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              'Failed to load analytics.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();

    // Watch-time changes while studying; refetch when user returns
    // and periodically while the tab is visible.
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        run();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        run();
      }
    }, 30000);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(id);
    };
  }, []);

  return (
    <StudentShell>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Study Analytics
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Track learning patterns, screen time, and subject activity
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center">
                  <FaClock className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Total study time</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatDuration(summary?.totalStudyTimeSeconds)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Based on actual video watch time.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <WeeklyCompareBar
                title="Weekly comparison"
                thisWeekSeconds={summary?.weeklyComparison?.thisWeekSeconds || 0}
                lastWeekSeconds={summary?.weeklyComparison?.lastWeekSeconds || 0}
              />
            </div>
          </div>

          {/* Grade prediction */}
          {summary?.gradePrediction?.range && (
            <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <FaChartLine className="text-emerald-500" />
                <span>Grade Prediction</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {summary.gradePrediction.range}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Auto-based on quiz average, previous grades, screen time, and assignment status.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart title="Study time per day (last 7 days)" points={summary?.dailyStudySeconds || []} />
            <MiniBarChart
              title="Study time per day (seconds)"
              items={summary?.dailyStudySeconds || []}
              valueKey="seconds"
              labelKey="date"
            />
          </div>
        </>
      )}
    </StudentShell>
  );
};

export default StudyAnalytics;

