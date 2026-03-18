import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import logo from '../assets/logo/logo1.png';
import {
  FaBook, FaRobot, FaFire, FaTrophy, FaChartLine,
  FaPlay, FaCompass, FaGraduationCap, FaClock,
  FaCheckCircle, FaSpinner, FaUser, FaCalendarAlt, FaMedal,
  FaArrowRight, FaBookOpen,
} from 'react-icons/fa';
import StudentShell from '../components/StudentShell';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_DEADLINES = [
  { id: 1, title: 'Python Quiz', course: 'Intro to Python', date: 'Mar 12', urgent: true },
  { id: 2, title: 'UI Mockup Submission', course: 'UI/UX Design', date: 'Mar 15', urgent: false },
  { id: 3, title: 'Final Project', course: 'Web Development', date: 'Mar 20', urgent: false },
];

const MOCK_ACHIEVEMENTS = [
  { id: 1, title: 'First Enrollment', icon: '🎯', earned: true },
  { id: 2, title: 'Fast Learner', icon: '⚡', earned: true },
  { id: 3, title: 'Course Completer', icon: '🏆', earned: false },
  { id: 4, title: '7-Day Streak', icon: '🔥', earned: false },
];

const WEEKLY_ACTIVITY = [
  { day: 'Mon', hours: 2 },
  { day: 'Tue', hours: 1.5 },
  { day: 'Wed', hours: 3 },
  { day: 'Thu', hours: 0.5 },
  { day: 'Fri', hours: 2.5 },
  { day: 'Sat', hours: 1 },
  { day: 'Sun', hours: 0 },
];

const MOCK_PROGRESS = [60, 30, 80, 45, 15, 90, 55, 70, 25];
const PROGRESS_COLORS = ['from-blue-500 to-cyan-400', 'from-purple-500 to-pink-400', 'from-green-500 to-emerald-400', 'from-orange-500 to-amber-400'];

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ value, gradient = 'from-primary-500 to-primary-400' }) => (
  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
    <div
      className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, gradient, sub }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradient}`}>
      <Icon className="text-white text-xl" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {sub && <p className="text-xs text-green-500 font-medium mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchEnrolled = async () => {
      setLoading(true);
      try {
        const data = await courseAPI.getEnrolledCourses();
        setEnrolledCourses(data.courses || []);
      } catch {
        setEnrolledCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrolled();
  }, []);

  const totalProgress =
    enrolledCourses.length > 0
      ? Math.round(enrolledCourses.reduce((acc, _, i) => acc + (MOCK_PROGRESS[i] ?? 50), 0) / enrolledCourses.length)
      : 0;

  const maxHours = Math.max(...WEEKLY_ACTIVITY.map((d) => d.hours));
  const totalHours = WEEKLY_ACTIVITY.reduce((a, d) => a + d.hours, 0).toFixed(1);

  const tabs = ['overview', 'progress', 'achievements'];

  return (
    <StudentShell>

            {/* ── Welcome Banner ── */}
            <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 rounded-2xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white rounded-full" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white rounded-full" />
              </div>
              <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <FaFire className="text-yellow-300" />
                    <span className="text-primary-100 text-sm font-medium">3 day streak!</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-1">
                    Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋
                  </h2>
                  <p className="text-primary-100">
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
                    className="flex items-center space-x-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all text-sm border border-white/20"
                  >
                    <FaCompass /><span>Explore</span>
                  </button>
                  <button
                    onClick={() => navigate('/ai-tutor')}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-white text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all text-sm shadow-lg"
                  >
                    <FaRobot /><span>AI Tutor</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={FaBook} label="Enrolled" value={enrolledCourses.length} gradient="from-primary-500 to-primary-600" sub="Active courses" />
              <StatCard icon={FaChartLine} label="Avg Progress" value={`${totalProgress}%`} gradient="from-green-500 to-emerald-600" sub={totalProgress > 50 ? 'Great pace!' : 'Keep going!'} />
              <StatCard icon={FaTrophy} label="Achievements" value={MOCK_ACHIEVEMENTS.filter((a) => a.earned).length} gradient="from-yellow-500 to-orange-500" sub="Badges earned" />
              <StatCard icon={FaClock} label="Hours This Week" value={totalHours} gradient="from-purple-500 to-violet-600" sub="Learning time" />
            </div>

            {/* ── Tabs ── */}
            <div className="flex space-x-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700 mb-8 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                  {/* Continue Learning */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <FaPlay className="text-primary-500" /><span>Continue Learning</span>
                      </h3>
                      <button onClick={() => navigate('/my-courses')} className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center space-x-1">
                        <span>View all</span><FaArrowRight className="text-xs" />
                      </button>
                    </div>
                    {loading ? (
                      <div className="flex justify-center py-8"><FaSpinner className="text-2xl text-primary-500 animate-spin" /></div>
                    ) : enrolledCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <FaBookOpen className="text-4xl text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">No courses enrolled yet.</p>
                        <button onClick={() => navigate('/explore-courses')} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                          Explore Courses
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {enrolledCourses.slice(0, 3).map((course, i) => (
                          <div key={course.id} className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${course.color || 'from-primary-500 to-cyan-500'} flex items-center justify-center flex-shrink-0`}>
                              <FaBook className="text-white text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{course.title}</p>
                              <p className="text-xs text-slate-400 mb-1.5">{course.instructor}</p>
                              <ProgressBar value={MOCK_PROGRESS[i] ?? 50} gradient={PROGRESS_COLORS[i % PROGRESS_COLORS.length]} />
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{MOCK_PROGRESS[i] ?? 50}%</p>
                              <button onClick={() => navigate(`/course/${course.id}`)} className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                <FaPlay className="text-xs" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Deadlines */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-4">
                      <FaCalendarAlt className="text-orange-500" /><span>Upcoming Deadlines</span>
                    </h3>
                    <div className="space-y-3">
                      {MOCK_DEADLINES.map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${d.urgent ? 'bg-red-500' : 'bg-green-500'}`} />
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{d.title}</p>
                              <p className="text-xs text-slate-400">{d.course}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${d.urgent ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {d.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column — Weekly Activity only (Quick Actions removed) */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                      <FaFire className="text-orange-500" /><span>Weekly Activity</span>
                    </h3>
                    <div className="flex items-end space-x-2 h-28 mb-3">
                      {WEEKLY_ACTIVITY.map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center space-y-1">
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-primary-600 to-primary-400"
                            style={{ height: `${(d.hours / maxHours) * 88}px`, minHeight: d.hours > 0 ? '6px' : '2px', opacity: d.hours > 0 ? 1 : 0.2 }}
                          />
                          <span className="text-xs text-slate-400">{d.day}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 text-center">{totalHours} hrs total this week</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Progress Tab ── */}
            {activeTab === 'progress' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
                    <FaChartLine className="text-primary-500" /><span>Course Progress</span>
                  </h3>
                  {enrolledCourses.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">Enroll in courses to track progress</p>
                  ) : (
                    <div className="space-y-5">
                      {enrolledCourses.map((course, i) => (
                        <div key={course.id}>
                          <div className="flex justify-between items-center mb-1.5">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[70%]">{course.title}</p>
                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{MOCK_PROGRESS[i] ?? 50}%</span>
                          </div>
                          <ProgressBar value={MOCK_PROGRESS[i] ?? 50} gradient={PROGRESS_COLORS[i % PROGRESS_COLORS.length]} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
                    <FaFire className="text-orange-500" /><span>Weekly Learning</span>
                  </h3>
                  <div className="flex items-end space-x-3 h-44 mb-4">
                    {WEEKLY_ACTIVITY.map((d) => (
                      <div key={d.day} className="flex-1 flex flex-col items-center space-y-2">
                        <span className="text-xs text-slate-400">{d.hours}h</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400"
                          style={{ height: `${(d.hours / maxHours) * 120}px`, minHeight: d.hours > 0 ? '8px' : '2px', opacity: d.hours > 0 ? 1 : 0.2 }}
                        />
                        <span className="text-xs text-slate-500 font-medium">{d.day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm pt-4 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500">Total this week</span>
                    <span className="font-bold text-slate-900 dark:text-white">{totalHours} hours</span>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
                    <FaTrophy className="text-yellow-500" /><span>Performance Summary</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Courses Enrolled', value: enrolledCourses.length, icon: '📚' },
                      { label: 'Avg. Progress', value: `${totalProgress}%`, icon: '📈' },
                      { label: 'Hours Learned', value: `${totalHours}h`, icon: '⏱️' },
                      { label: 'Day Streak', value: '3 days', icon: '🔥' },
                    ].map((s) => (
                      <div key={s.label} className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="text-3xl mb-2">{s.icon}</div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Achievements Tab ── */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {MOCK_ACHIEVEMENTS.map((a) => (
                    <div key={a.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border p-6 text-center transition-all ${a.earned ? 'border-yellow-200 dark:border-yellow-800 hover:shadow-lg' : 'border-slate-200 dark:border-slate-700 opacity-50'}`}>
                      <div className={`text-5xl mb-3 ${!a.earned && 'grayscale'}`}>{a.icon}</div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">{a.title}</h4>
                      {a.earned ? (
                        <div className="flex items-center justify-center space-x-1 text-green-600 text-xs"><FaCheckCircle /><span>Earned</span></div>
                      ) : (
                        <div className="flex items-center justify-center space-x-1 text-slate-400 text-xs"><FaMedal /><span>Locked</span></div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
                  <FaGraduationCap className="text-5xl text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Certificates Yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Complete a course to earn your first certificate!</p>
                  <button onClick={() => navigate('/my-courses')} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
                    View My Courses
                  </button>
                </div>
              </div>
            )}

    </StudentShell>
  );
};

export default StudentDashboard;
