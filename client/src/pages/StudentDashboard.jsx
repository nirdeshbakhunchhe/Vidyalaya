// StudentDashboard.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Auth & API ────────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';
import { courseAPI, progressAPI } from '../services/api';

// ── Assets ────────────────────────────────────────────────────────────────────
import logo from '../assets/logo/logo1.png';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaBook,
  FaRobot,
  FaFire,
  FaTrophy,
  FaChartLine,
  FaPlay,
  FaCompass,
  FaGraduationCap,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaCalendarAlt,
  FaMedal,
  FaArrowRight,
  FaBookOpen,
} from 'react-icons/fa';

// ── Layout shell ──────────────────────────────────────────────────────────────
import StudentShell from '../components/StudentShell';

// =============================================================================
// Mock / placeholder data
// These will be replaced by real API data once those endpoints are available.
// =============================================================================

// Mock values removed - UI will display empty states or 0 instead of hardcoded data.
// Awaiting integration of the Progress and Engagement models.

// Gradient classes cycled across course cards for visual variety
const PROGRESS_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-green-500 to-emerald-400',
  'from-orange-500 to-amber-400',
];

// Tab identifiers for the content switcher
const TABS = ['overview', 'progress', 'achievements'];

// =============================================================================
// Sub-components
// =============================================================================

// ── ProgressBar ───────────────────────────────────────────────────────────────
// Generic horizontal progress bar.
// `gradient` accepts a Tailwind `from-*` / `to-*` pair string.
const ProgressBar = ({ value, gradient = 'from-blue-500 to-blue-400' }) => (
  <div className="w-full bg-slate-200 rounded-full h-2">
    <div
      className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
      style={{ width: `${Math.min(value, 100)}%` }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  </div>
);

// ── StatCard ──────────────────────────────────────────────────────────────────
// Summary metric tile used in the stats row at the top of the dashboard.
const StatCard = ({ icon: Icon, label, value, gradient, sub }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradient}`}>
      <Icon className="text-white text-xl" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-green-600 font-medium mt-0.5">{sub}</p>}
    </div>
  </div>
);

// =============================================================================
// StudentDashboard
// =============================================================================
const StudentDashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [totalHours,      setTotalHours]      = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState('overview');

  // Fetch the student's enrolled courses on mount (API call unchanged)
  useEffect(() => {
    const fetchEnrolled = async () => {
      setLoading(true);
      try {
        const [courseData, progressData] = await Promise.all([
          courseAPI.getEnrolledCourses(),
          progressAPI.getAllProgress()
        ]);
        
        const enrolled = courseData.courses || [];
        const progresses = progressData || [];

        const merged = enrolled.map(c => {
          const p = progresses.find(p => String(p.course?._id || p.course) === String(c.id));
          return { ...c, progress: p ? p.completionPercentage : 0 };
        });

        // Calculate total hours this week
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        let totalSeconds = 0;
        progresses.forEach(p => {
          if (p.watchTimeLogs) {
             p.watchTimeLogs.forEach(log => {
                const logDate = new Date(log.date);
                if (logDate >= sevenDaysAgo) {
                   totalSeconds += (log.timeSpent || 0);
                }
             });
          }
        });
        
        const hours = totalSeconds / 3600;
        if (hours < 1 && totalSeconds > 0) {
           setTotalHours(`${Math.floor(totalSeconds / 60)}m`);
        } else {
           setTotalHours(`${hours.toFixed(1)}h`);
        }

        setEnrolledCourses(merged);
      } catch (err) {
        console.error(err);
        setEnrolledCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrolled();
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────

  // Average progress across all enrolled courses using course data
  const totalProgress =
    enrolledCourses.length > 0
      ? Math.round(
          enrolledCourses.reduce((acc, c) => acc + (c.progress || 0), 0) /
          enrolledCourses.length
        )
      : 0;

  // Placeholder static values until the analytics models are fully built
  const maxHours   = 10;

  const earnedCount = user?.badges?.length || 0;

  // First name used in the greeting to keep it friendly and short
  const firstName = user?.name?.split(' ')[0] || 'Student';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <StudentShell>

      {/* ── Welcome banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
        {/* Decorative background circles — purely cosmetic */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white rounded-full" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <FaFire className="text-yellow-300" />
              <span className="text-blue-100 text-sm font-medium">{user?.loginStreak || 0} day streak!</span>
            </div>
            <h2 className="text-3xl font-bold mb-1">
              Welcome back, {firstName}! 👋
            </h2>
            <p className="text-blue-100">
              You have{' '}
              <span className="text-white font-semibold">{enrolledCourses.length} courses</span>{' '}
              in progress. Keep it up!
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <img
              src={logo}
              alt="Vidyalaya"
              className="h-10 w-10 rounded-xl bg-white/15 p-1.5 ring-1 ring-white/20"
            />
            <button
              onClick={() => navigate('/explore-courses')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <FaCompass /><span>Explore</span>
            </button>
            <button
              onClick={() => navigate('/ai-tutor')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <FaRobot /><span>AI Tutor</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={FaBook}
          label="Enrolled"
          value={enrolledCourses.length}
          gradient="from-blue-500 to-blue-600"
          sub="Active courses"
        />
        <StatCard
          icon={FaChartLine}
          label="Avg Progress"
          value={`${totalProgress}%`}
          gradient="from-green-500 to-emerald-600"
          sub={totalProgress > 50 ? 'Great pace!' : 'Keep going!'}
        />
        <StatCard
          icon={FaTrophy}
          label="Achievements"
          value={earnedCount}
          gradient="from-yellow-500 to-orange-500"
          sub="Badges earned"
        />
        <StatCard
          icon={FaClock}
          label="Time This Week"
          value={totalHours}
          gradient="from-purple-500 to-violet-600"
          sub="Learning time"
        />
      </div>

      {/* ── Tab switcher ───────────────────────────────────────────────────── */}
      {/* Uses overflow-x-auto so it scrolls on small screens instead of wrapping */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm border border-slate-200 w-fit min-w-full sm:min-w-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap',
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Overview tab
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — Continue Learning + Deadlines */}
          <div className="lg:col-span-2 space-y-6">

            {/* Continue Learning card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <FaPlay className="text-blue-500" /><span>Continue Learning</span>
                </h3>
                <button
                  onClick={() => navigate('/my-courses')}
                  className="text-sm text-blue-600 hover:underline flex items-center space-x-1 focus:outline-none focus:underline"
                >
                  <span>View all</span><FaArrowRight className="text-xs" />
                </button>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="flex justify-center py-8">
                  <FaSpinner className="text-2xl text-blue-500 animate-spin" />
                </div>
              )}

              {/* Empty state */}
              {!loading && enrolledCourses.length === 0 && (
                <div className="text-center py-8">
                  <FaBookOpen className="text-4xl text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm mb-3">No courses enrolled yet.</p>
                  <button
                    onClick={() => navigate('/explore-courses')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Explore Courses
                  </button>
                </div>
              )}

              {/* Course list — shows up to 3 most recent enrollments */}
              {!loading && enrolledCourses.length > 0 && (
                <div className="space-y-3">
                  {enrolledCourses.slice(0, 3).map((course, i) => (
                    <div
                      key={course.id}
                      className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      {/* Course colour swatch */}
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${course.color || 'from-blue-500 to-cyan-500'} flex items-center justify-center flex-shrink-0`}
                      >
                        <FaBook className="text-white text-sm" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{course.title}</p>
                        <p className="text-xs text-slate-400 mb-1.5">{course.instructor}</p>
                        <ProgressBar
                          value={course.progress || 0}
                          gradient={PROGRESS_COLORS[i % PROGRESS_COLORS.length]}
                        />
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-slate-700 mb-2">{course.progress || 0}%</p>
                        <button
                          onClick={() => navigate(`/student/course/${course.id}/learn`)}
                          aria-label={`Continue ${course.title}`}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <FaPlay className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Deadlines card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2 mb-4">
                <FaCalendarAlt className="text-orange-500" /><span>Upcoming Deadlines</span>
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-slate-500 py-4 text-center">No upcoming deadlines.</p>
              </div>
            </div>
          </div>

          {/* Right column — Weekly Activity */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <FaFire className="text-orange-500" /><span>Weekly Activity</span>
              </h3>
              <div className="flex items-end justify-center space-x-2 h-28 mb-3">
                <p className="text-sm text-slate-500 mt-10">Activity metrics currently tracking.</p>
              </div>
              <p className="text-xs text-slate-400 text-center">{totalHours} total this week</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Progress tab
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Per-course progress bars */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
              <FaChartLine className="text-blue-500" /><span>Course Progress</span>
            </h3>
            {enrolledCourses.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">
                Enroll in courses to track progress
              </p>
            ) : (
              <div className="space-y-5">
                {enrolledCourses.map((course, i) => (
                  <div key={course.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-sm font-semibold text-slate-900 truncate max-w-[70%]">
                        {course.title}
                      </p>
                      <span className="text-sm font-bold text-blue-600">
                        {course.progress || 0}%
                      </span>
                    </div>
                    <ProgressBar
                      value={course.progress || 0}
                      gradient={PROGRESS_COLORS[i % PROGRESS_COLORS.length]}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expanded weekly learning bar chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
              <FaFire className="text-orange-500" /><span>Weekly Learning</span>
            </h3>
            <div className="flex items-end justify-center h-44 mb-4">
               <p className="text-sm text-slate-500">More data needed.</p>
            </div>
            <div className="flex justify-between text-sm pt-4 border-t border-slate-100">
              <span className="text-slate-500">Total this week</span>
              <span className="font-bold text-slate-900">{totalHours}</span>
            </div>
          </div>

          {/* Performance summary tiles */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
              <FaTrophy className="text-yellow-500" /><span>Performance Summary</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Courses Enrolled', value: enrolledCourses.length, icon: '📚' },
                { label: 'Avg. Progress',    value: `${totalProgress}%`,    icon: '📈' },
                { label: 'Time Learned',     value: totalHours,             icon: '⏱️' },
                { label: 'Day Streak',       value: '3 days',               icon: '🔥' },
              ].map((s) => (
                <div key={s.label} className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Achievements tab
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">

          {/* Achievement badge grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {(!user?.badges || user.badges.length === 0) ? (
              <div className="col-span-full text-center py-6">
                <p className="text-slate-500">No achievements yet. Start learning to earn badges!</p>
              </div>
            ) : (
              user.badges.map((badge, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-sm border border-yellow-200 p-6 text-center transition-all hover:shadow-lg"
                >
                  <div className="text-5xl mb-3">
                    {badge.icon || '🏆'}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">{badge.name}</h4>
                  <div className="flex items-center justify-center space-x-1 text-green-600 text-xs">
                    <FaCheckCircle /><span>Earned</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Certificates placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
            <FaGraduationCap className="text-5xl text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Certificates Yet</h3>
            <p className="text-slate-500 text-sm mb-4">
              Complete a course to earn your first certificate!
            </p>
            <button
              onClick={() => navigate('/my-courses')}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              View My Courses
            </button>
          </div>
        </div>
      )}

    </StudentShell>
  );
};

export default StudentDashboard;