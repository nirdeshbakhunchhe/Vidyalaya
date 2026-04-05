// MyCourses.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── API ───────────────────────────────────────────────────────────────────────
import { courseAPI, progressAPI } from '../services/api';

// ── Layout shell ──────────────────────────────────────────────────────────────
import StudentShell from '../components/StudentShell';

// ── Icons (react-icons/fa only — replaces all custom SVGs) ───────────────────
import {
  FaBook,
  FaPlay,
  FaStar,
  FaClock,
  FaUser,
  FaSpinner,
  FaSearch,
  FaCompass,
  FaGraduationCap,
  FaCheckCircle,
  FaChartLine,
  FaFilter,
} from 'react-icons/fa';

// =============================================================================
// Constants
// =============================================================================

// Real progress tracking will be fetched via API.

// Gradient swatches cycled across course card banners for visual variety
const CARD_GRADIENTS = [
  'from-sky-400   to-blue-600',
  'from-violet-400 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-rose-400  to-pink-600',
  'from-amber-400 to-orange-500',
];

// Filter options shown in the pill group
const FILTERS = [
  { value: 'all',         label: 'All'         },
  { value: 'in-progress', label: 'In Progress'  },
  { value: 'completed',   label: 'Completed'   },
];

// =============================================================================
// Sub-components
// =============================================================================

// ── ProgressBar ───────────────────────────────────────────────────────────────
const ProgressBar = ({ value }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <div
      className="h-1.5 rounded-full bg-blue-500 transition-all duration-700"
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
);

// ── StatCard ──────────────────────────────────────────────────────────────────
// Summary tile at the top of the page — replaces the custom SVG StatIcon.
const StatCard = ({ icon: Icon, iconColor, label, value }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-1">
    <Icon className={`text-2xl ${iconColor}`} />
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    <p className="text-xs text-slate-400">{label}</p>
  </div>
);

// =============================================================================
// MyCourses
// =============================================================================
const MyCourses = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  // Fetch enrolled courses on mount (API call unchanged)
  useEffect(() => {
    const loadCourses = async () => {
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

        setCourses(merged);
      } catch (err) {
        console.error(err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────

  // Filter maps to the course's real progress
  const filtered = courses
    .map((c, i) => ({ course: c, originalIndex: i, progress: c.progress || 0 }))
    .filter(({ course, progress }) => {
      const matchSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.instructor?.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'all' ||
        (filter === 'completed'   && progress === 100) ||
        (filter === 'in-progress' && progress  <  100);
      return matchSearch && matchFilter;
    });

  const inProgressCount = courses.filter((c) => (c.progress || 0) > 0 && (c.progress || 0) < 100).length;
  const completedCount  = courses.filter((c) => (c.progress || 0) === 100).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <StudentShell>
      <div className="py-8 px-4 sm:px-6">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Track your learning progress across all enrolled courses
          </p>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard icon={FaBook}       iconColor="text-blue-500"   label="Total Enrolled" value={courses.length}    />
          <StatCard icon={FaChartLine}  iconColor="text-cyan-500"   label="In Progress"    value={inProgressCount}   />
          <StatCard icon={FaCheckCircle} iconColor="text-green-500" label="Completed"      value={completedCount}    />
        </div>

        {/* ── Search + filter bar ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3 mb-6 flex flex-col sm:flex-row items-center gap-3">

          {/* Search input */}
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs pointer-events-none" />
            <input
              type="search"
              aria-label="Search courses"
              placeholder="Search your courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-700 placeholder-slate-300 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:border-slate-200 transition-all"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <FaFilter className="text-slate-300 text-sm" />
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={[
                  'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                  filter === value
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Course grid ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-24">
            <FaSpinner className="text-3xl text-blue-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          /* Empty / no-match state */
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
            <FaGraduationCap className="text-5xl text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {courses.length === 0 ? 'No courses yet' : 'No courses match your search'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {courses.length === 0
                ? 'Start your learning journey today!'
                : 'Try a different search or filter'}
            </p>
            {courses.length === 0 && (
              <button
                onClick={() => navigate('/explore-courses')}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Explore Courses
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {filtered.map(({ course, originalIndex, progress }) => {
              const gradient   = CARD_GRADIENTS[originalIndex % CARD_GRADIENTS.length];
              const isComplete = progress === 100;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
                >
                  {/* Coloured banner header */}
                  <div className={`bg-gradient-to-br ${gradient} relative h-36 p-4 flex flex-col justify-between`}>
                    <div className="flex justify-between items-start">
                      {/* Category pill */}
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full capitalize">
                        {course.category}
                      </span>
                      {/* Completion badge */}
                      {isComplete && (
                        <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                          <FaCheckCircle className="text-xs" /> Done
                        </span>
                      )}
                    </div>
                    {/* Course title */}
                    <p className="text-white font-bold text-sm leading-snug line-clamp-2">
                      {course.title}
                    </p>
                  </div>

                  {/* Card body */}
                  <div className="p-5 flex flex-col flex-1">

                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-4">
                      <FaUser className="text-slate-300 text-xs" />
                      <span className="text-xs text-slate-400 truncate">{course.instructor}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs text-slate-400 font-medium">Progress</span>
                        <span className="text-xs font-bold text-slate-700">{progress}%</span>
                      </div>
                      <ProgressBar value={progress} />
                    </div>

                    {/* Course meta */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-5">
                      <div className="flex items-center gap-1">
                        <FaClock className="text-slate-300" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-400" />
                        <span>{course.rating?.toFixed(1)}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full capitalize">
                        {course.level}
                      </span>
                    </div>

                    {/* CTA — continues or reviews depending on completion */}
                    <button
                      onClick={() => navigate(`/course/${course.id}`)}
                      className={[
                        'mt-auto w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1',
                        isComplete
                          ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100 focus:ring-green-400'
                          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md focus:ring-blue-400',
                      ].join(' ')}
                    >
                      {isComplete ? (
                        <><FaCheckCircle className="text-xs" /><span>Review Course</span></>
                      ) : (
                        <><FaPlay className="text-xs" /><span>Continue</span></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* "Explore More" dashed card — semantically a button */}
            <button
              onClick={() => navigate('/explore-courses')}
              className="rounded-2xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-blue-50 transition-all group min-h-[280px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Explore more courses"
            >
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <FaCompass className="text-xl text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <h4 className="font-bold text-slate-500 text-sm mb-1 group-hover:text-blue-500 transition-colors">
                Explore More
              </h4>
              <p className="text-xs text-slate-300">Find new courses to add</p>
            </button>
          </div>
        )}
      </div>
    </StudentShell>
  );
};

export default MyCourses;