// StudentLearningHome.jsx
//
// Shows a "Continue Watching" card if the student has a last-watched video
// stored in localStorage, then lists all enrolled courses to jump into.
// If no enrollments exist, shows an empty state.

// ── React & routing ───────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Layout shell & API ────────────────────────────────────────────────────────
import StudentShell from '../components/StudentShell';
import { courseAPI } from '../services/api';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaSpinner,
  FaBookOpen,
  FaPlay,
  FaClock,
  FaHistory,
  FaFilm,
} from 'react-icons/fa';

// =============================================================================
// Helpers
// =============================================================================

const LAST_WATCHED_KEY = 'vidyalaya_last_watched';

function getLastWatched() {
  try {
    const raw = localStorage.getItem(LAST_WATCHED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// =============================================================================
// StudentLearningHome
// =============================================================================
const StudentLearningHome = () => {
  const navigate = useNavigate();

  const [loading,         setLoading]         = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [lastWatched,     setLastWatched]     = useState(null);

  useEffect(() => {
    // Read last-watched from localStorage immediately (no async needed)
    setLastWatched(getLastWatched());

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const data    = await courseAPI.getEnrolledCourses();
        setEnrolledCourses(data?.courses || []);
      } catch {
        setEnrolledCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [navigate]);

  const goToLearn = (courseId, videoIndex) => {
    const path = `/student/course/${courseId}/learn`;
    // Pass videoIndex via state so CourseLearning can pre-select it
    navigate(path, { state: { videoIndex: videoIndex ?? 0 } });
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <StudentShell>
        <div className="flex items-center justify-center py-32">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      </StudentShell>
    );
  }

  // ── No enrolled courses ─────────────────────────────────────────────────────
  if (!enrolledCourses.length) {
    return (
      <StudentShell>
        <div className="flex items-center justify-center py-20 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
            <FaBookOpen className="text-5xl text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No enrolled courses</h2>
            <p className="text-sm text-slate-500 mb-6">
              Enroll in a course first to start learning.
            </p>
            <button
              type="button"
              onClick={() => navigate('/explore-courses')}
              className="w-full py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              Explore Courses
            </button>
          </div>
        </div>
      </StudentShell>
    );
  }

  // ── Main view ───────────────────────────────────────────────────────────────
  return (
    <StudentShell>
      <div className="space-y-6 pb-10">

        {/* ── Continue Watching card ─────────────────────────────────────────── */}
        {lastWatched && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-center gap-2">
              <FaHistory className="text-blue-500 text-sm" />
              <h2 className="text-base font-bold text-slate-900">Continue Watching</h2>
              <span className="ml-auto text-xs text-slate-400">
                {timeAgo(lastWatched.watchedAt)}
              </span>
            </div>

            {/* Card body */}
            <button
              type="button"
              onClick={() => goToLearn(lastWatched.courseId, lastWatched.videoIndex)}
              className="w-full flex items-center gap-4 px-6 pb-5 text-left group focus:outline-none"
            >
              {/* Thumbnail / fallback */}
              <div className="relative w-28 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                {lastWatched.thumbnail ? (
                  <img
                    src={lastWatched.thumbnail}
                    alt={lastWatched.courseTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400">
                    <FaFilm className="text-white text-lg" />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <FaPlay className="text-blue-600 text-xs ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                  {lastWatched.videoTitle}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{lastWatched.courseTitle}</p>
                {lastWatched.instructor && (
                  <p className="text-xs text-slate-400 truncate">by {lastWatched.instructor}</p>
                )}
              </div>

              {/* Play button */}
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 group-hover:bg-blue-700 flex items-center justify-center transition-colors">
                <FaPlay className="text-white text-xs ml-0.5" />
              </div>
            </button>
          </div>
        )}

        {/* ── All enrolled courses ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <FaBookOpen className="text-blue-500 text-sm" />
            <h2 className="text-base font-bold text-slate-900">My Courses</h2>
            <span className="ml-auto text-xs text-slate-400">{enrolledCourses.length} enrolled</span>
          </div>

          <div className="space-y-3">
            {enrolledCourses.map((course) => {
              const isLastWatched = lastWatched?.courseId === course.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => goToLearn(course.id)}
                  className={[
                    'w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all group focus:outline-none focus:ring-2 focus:ring-blue-400',
                    isLastWatched
                      ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                      : 'bg-slate-50 border border-transparent hover:bg-slate-100',
                  ].join(' ')}
                >
                  {/* Course thumbnail / colour swatch */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${course.color || 'from-blue-500 to-cyan-500'}`}
                  >
                    {course.image ? (
                      <img src={course.image} alt={course.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <FaBookOpen className="text-white text-base" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{course.instructor}</p>
                    {isLastWatched && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <FaClock className="text-blue-400 text-[10px]" />
                        <span className="text-[10px] text-blue-500 font-medium">
                          Last watched · {lastWatched.videoTitle}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Play icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isLastWatched ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-blue-600'
                  }`}>
                    <FaPlay className={`text-xs ml-0.5 transition-colors ${
                      isLastWatched ? 'text-white' : 'text-slate-500 group-hover:text-white'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </StudentShell>
  );
};

export default StudentLearningHome;

