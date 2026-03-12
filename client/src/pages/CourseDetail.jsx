import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FaArrowLeft,
  FaStar,
  FaUsers,
  FaClock,
  FaBook,
  FaCheckCircle,
  FaPlayCircle,
  FaLock,
  FaRobot,
  FaChartLine,
  FaGraduationCap,
  FaRegStar,
  FaSpinner,
  FaExclamationCircle,
} from 'react-icons/fa';

// ─── Mock curriculum ──────────────────────────────────────────────────────────
const MOCK_CURRICULUM = [
  {
    section: 'Getting Started',
    lessons: [
      { title: 'Welcome & Course Overview', duration: '5 min', free: true },
      { title: 'Setting Up Your Environment', duration: '12 min', free: true },
      { title: 'Your First Program', duration: '18 min', free: false },
    ],
  },
  {
    section: 'Core Concepts',
    lessons: [
      { title: 'Variables & Data Types', duration: '22 min', free: false },
      { title: 'Control Flow & Loops', duration: '30 min', free: false },
      { title: 'Functions & Scope', duration: '25 min', free: false },
    ],
  },
  {
    section: 'Advanced Topics',
    lessons: [
      { title: 'Object-Oriented Programming', duration: '40 min', free: false },
      { title: 'Error Handling', duration: '20 min', free: false },
      { title: 'Final Project', duration: '60 min', free: false },
    ],
  },
];

const WHAT_YOU_LEARN = [
  'Build real-world projects from scratch',
  'Understand core programming concepts',
  'Write clean, readable, maintainable code',
  'Debug and solve problems confidently',
  'Apply best practices used in industry',
  'Get hands-on with exercises and quizzes',
];

// ─── Validate MongoDB ObjectId ────────────────────────────────────────────────
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

// ─── Star Rating Component ────────────────────────────────────────────────────
const StarRating = ({ value, onRate, readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          disabled={readonly}
          onClick={() => !readonly && onRate && onRate(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`text-xl transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          {star <= (hovered || value) ? (
            <FaStar className="text-yellow-400" />
          ) : (
            <FaRegStar className="text-slate-400" />
          )}
        </button>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CourseDetail = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [openSection, setOpenSection] = useState(0);

  // ── Guard: redirect if ID is not a valid MongoDB ObjectId ──
  useEffect(() => {
    if (!isValidObjectId(id)) {
      navigate('/explore-courses', { replace: true });
    }
  }, [id, navigate]);

  // ── Fetch course from backend ──
  useEffect(() => {
    if (!isValidObjectId(id)) return; // don't fetch if invalid

    const fetchCourse = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get(`/courses/${id}`);
        setCourse(data.course);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to load course';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  // ── Enroll / Unenroll ──
  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrolling(true);
    setEnrollSuccess('');
    setError('');
    try {
      let data;
      if (course.isEnrolled) {
        data = await api.delete(`/courses/${id}/enroll`);
      } else {
        data = await api.post(`/courses/${id}/enroll`);
      }
      setCourse(data.course);
      setEnrollSuccess(
        course.isEnrolled ? 'Unenrolled successfully.' : 'Enrolled! Start learning now.'
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Action failed';
      setError(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  // ── Submit Rating ──
  const handleRate = async (rating) => {
    if (!course.isEnrolled) return;
    setUserRating(rating);
    setError('');
    try {
      const data = await api.post(`/courses/${id}/rate`, { rating });
      setCourse((prev) => ({
        ...prev,
        rating: data.rating,
        totalRatings: data.totalRatings,
      }));
      setRatingSubmitted(true);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to submit rating';
      setError(errorMessage);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="text-4xl text-primary-500 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading course...</p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error && !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <FaExclamationCircle className="text-5xl text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Course not found</h2>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
          <button
            onClick={() => navigate('/explore-courses')}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-600 transition-all"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

      {/* ── Navbar ── */}
      <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/explore-courses')}
                className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <FaArrowLeft />
                <span className="hidden sm:inline">Back to Courses</span>
              </button>
              <h1 className="text-2xl font-bold text-gradient">Vidyalaya</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden sm:block text-slate-700 dark:text-slate-300">
                Welcome, <span className="font-semibold">{user?.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <div className={`bg-gradient-to-r ${course?.color || 'from-blue-600 to-cyan-500'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <p className="text-white/70 text-sm mb-3 capitalize">
              {course?.category} &rsaquo; <span className="capitalize">{course?.level}</span>
            </p>

            <h2 className="text-4xl font-bold mb-4 leading-tight">{course?.title}</h2>
            <p className="text-white/90 text-lg mb-6">{course?.description}</p>

            {/* Meta row */}
            <div className="flex flex-wrap gap-6 text-sm text-white/80">
              <div className="flex items-center space-x-2">
                <FaStar className="text-yellow-300" />
                <span className="font-semibold text-white">{course?.rating?.toFixed(1)}</span>
                <span>({course?.totalRatings?.toLocaleString()} ratings)</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaUsers />
                <span>{course?.enrollmentCount?.toLocaleString()} students</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaClock />
                <span>{course?.duration}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaGraduationCap />
                <span className="capitalize">{course?.level}</span>
              </div>
            </div>

            <p className="mt-4 text-white/70 text-sm">
              Instructor: <span className="text-white font-medium">{course?.instructor}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Main Content ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Success / Error banners */}
            {enrollSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center space-x-2">
                <FaCheckCircle />
                <span>{enrollSuccess}</span>
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-center space-x-2">
                <FaExclamationCircle />
                <span>{error}</span>
              </div>
            )}

            {/* What you'll learn */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                <FaBook className="text-primary-500" />
                <span>What You'll Learn</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WHAT_YOU_LEARN.map((item, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center space-x-2">
                <FaPlayCircle className="text-primary-500" />
                <span>Course Curriculum</span>
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
                {MOCK_CURRICULUM.reduce((acc, s) => acc + s.lessons.length, 0)} lessons •{' '}
                {course?.duration}
              </p>

              <div className="space-y-3">
                {MOCK_CURRICULUM.map((section, si) => (
                  <div key={si} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    {/* Section header */}
                    <button
                      onClick={() => setOpenSection(openSection === si ? -1 : si)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left"
                    >
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {section.section}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        {section.lessons.length} lessons
                      </span>
                    </button>

                    {/* Lessons */}
                    {openSection === si && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {section.lessons.map((lesson, li) => (
                          <div
                            key={li}
                            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              {lesson.free || course?.isEnrolled ? (
                                <FaPlayCircle className="text-primary-500 flex-shrink-0" />
                              ) : (
                                <FaLock className="text-slate-400 flex-shrink-0" />
                              )}
                              <span
                                className={`text-sm ${
                                  lesson.free || course?.isEnrolled
                                    ? 'text-slate-900 dark:text-white'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {lesson.title}
                              </span>
                              {lesson.free && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                  Free
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                              {lesson.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rate this course — only if enrolled */}
            {course?.isEnrolled && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                  <FaStar className="text-yellow-400" />
                  <span>Rate This Course</span>
                </h3>
                {ratingSubmitted ? (
                  <div className="flex items-center space-x-3 text-green-600 dark:text-green-400">
                    <FaCheckCircle />
                    <span>Thanks for your rating!</span>
                    <StarRating value={userRating} readonly />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      How would you rate this course?
                    </p>
                    <StarRating value={userRating} onRate={handleRate} />
                  </div>
                )}
              </div>
            )}

            {/* AI Tutor CTA */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl p-6 text-white">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">Stuck on something?</h3>
                  <p className="text-primary-100 text-sm mb-4">
                    Your AI Tutor is available 24/7 to explain concepts, answer questions, and help you practice.
                  </p>
                  <button
                    onClick={() => navigate('/ai-tutor')}
                    className="px-5 py-2 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors text-sm"
                  >
                    Chat with AI Tutor
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Enroll Card ── */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sticky top-24 space-y-5">

              {/* Enrolled badge */}
              {course?.isEnrolled && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <FaCheckCircle className="text-green-500" />
                  <span className="text-green-700 dark:text-green-400 text-sm font-semibold">
                    You're enrolled
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                    <FaClock />
                    <span>Duration</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{course?.duration}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                    <FaGraduationCap />
                    <span>Level</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">{course?.level}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                    <FaUsers />
                    <span>Students</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {course?.enrollmentCount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                    <FaStar className="text-yellow-400" />
                    <span>Rating</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {course?.rating?.toFixed(1)} / 5
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                    <FaBook />
                    <span>Lessons</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {MOCK_CURRICULUM.reduce((acc, s) => acc + s.lessons.length, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                    <FaChartLine />
                    <span>Certificate</span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">Yes</span>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-700" />

              {/* Enroll / Unenroll button */}
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 ${
                  course?.isEnrolled
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border border-slate-300 dark:border-slate-600'
                    : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600'
                }`}
              >
                {enrolling ? (
                  <FaSpinner className="animate-spin" />
                ) : course?.isEnrolled ? (
                  <span>Unenroll from Course</span>
                ) : (
                  <span>Enroll Now — It's Free</span>
                )}
              </button>

              {/* Go to AI Tutor */}
              {course?.isEnrolled && (
                <button
                  onClick={() => navigate('/ai-tutor')}
                  className="w-full py-3 px-4 rounded-lg font-semibold border-2 border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center space-x-2"
                >
                  <FaRobot />
                  <span>Ask AI Tutor</span>
                </button>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Free to enroll. Learn at your own pace.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourseDetail;