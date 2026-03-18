import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../services/api';
import StudentShell from '../components/StudentShell';
import {
  FaBook, FaPlay, FaStar, FaClock, FaUser, FaSpinner,
  FaSearch, FaFilter, FaCompass, FaGraduationCap, FaCheckCircle,
} from 'react-icons/fa';

const MOCK_PROGRESS = [60, 30, 80, 45, 15, 90, 55, 70, 25];
const CARD_GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-blue-400 to-cyan-500',
  'from-cyan-400 to-blue-500',
  'from-blue-500 to-indigo-500',
  'from-sky-300 to-blue-500',
];

const ProgressBar = ({ value }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div
      className="h-1.5 rounded-full bg-blue-500 transition-all duration-700"
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
);

/* Stat card icons matching the screenshot style */
const StatIcon = ({ type }) => {
  if (type === 'enrolled') return (
    <svg className="w-7 h-7 text-cyan-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
  if (type === 'progress') return (
    <svg className="w-7 h-7 text-cyan-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <polygon points="5,3 19,12 5,21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg className="w-7 h-7 text-cyan-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
};

const MyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await courseAPI.getEnrolledCourses();
        setCourses(data.courses || []);
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = courses.filter((c, i) => {
    const progress = MOCK_PROGRESS[i] ?? 50;
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'completed' && progress === 100) ||
      (filter === 'in-progress' && progress < 100);
    return matchSearch && matchFilter;
  });

  const stats = [
    { label: 'Total Enrolled', value: courses.length, type: 'enrolled' },
    { label: 'In Progress', value: courses.filter((_, i) => (MOCK_PROGRESS[i] ?? 50) < 100).length, type: 'progress' },
    { label: 'Completed', value: courses.filter((_, i) => (MOCK_PROGRESS[i] ?? 50) === 100).length, type: 'completed' },
  ];

  return (
    <StudentShell>
      {/* Page background */}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Courses</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track your learning progress across all enrolled courses</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-1"
            >
              <StatIcon type={s.type} />
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 px-4 py-3 mb-6 flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
            <input
              type="text"
              placeholder="Search your courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 shrink-0">
            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
            </svg>
            {['all', 'in-progress', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                  filter === f
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {f === 'all' ? 'All' : f === 'in-progress' ? 'In-Progress' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <FaSpinner className="text-3xl text-blue-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <FaGraduationCap className="text-5xl text-slate-200 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              {courses.length === 0 ? 'No courses yet' : 'No courses match your search'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {courses.length === 0 ? 'Start your learning journey today!' : 'Try a different search or filter'}
            </p>
            {courses.length === 0 && (
              <button
                onClick={() => navigate('/explore-courses')}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all shadow"
              >
                Explore Courses
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((course, i) => {
              const progress = MOCK_PROGRESS[i] ?? 50;
              const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
              const isComplete = progress === 100;

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  {/* Card Banner */}
                  <div className={`bg-gradient-to-br ${gradient} relative h-36 p-4 flex flex-col justify-between`}>
                    {/* Category pill */}
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full capitalize">
                        {course.category}
                      </span>
                      {isComplete && (
                        <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                          <FaCheckCircle className="text-xs" /> Done
                        </span>
                      )}
                    </div>
                    {/* Title */}
                    <p className="text-white font-bold text-sm leading-snug line-clamp-2">{course.title}</p>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1">
                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-4">
                      <FaUser className="text-slate-300 text-xs" />
                      <span className="text-xs text-slate-400">{course.instructor}</span>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs text-slate-400 font-medium">Progress</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-white">{progress}%</span>
                      </div>
                      <ProgressBar value={progress} />
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-5">
                      <div className="flex items-center gap-1">
                        <FaClock className="text-slate-300" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-400" />
                        <span>{course.rating?.toFixed(1)}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full capitalize">
                        {course.level}
                      </span>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => navigate(`/course/${course.id}`)}
                      className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        isComplete
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 border border-green-100 dark:border-green-800'
                          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                      }`}
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

            {/* Explore More Card */}
            <div
              onClick={() => navigate('/explore-courses')}
              className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group min-h-[280px]"
            >
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <FaCompass className="text-xl text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <h4 className="font-bold text-slate-500 dark:text-slate-300 text-sm mb-1 group-hover:text-blue-500 transition-colors">
                Explore More
              </h4>
              <p className="text-xs text-slate-300">Find new courses to add</p>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
};

export default MyCourses;
