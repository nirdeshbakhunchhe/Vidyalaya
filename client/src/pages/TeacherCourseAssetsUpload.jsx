// TeacherCourseAssetsUpload.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// ── API ───────────────────────────────────────────────────────────────────────
import { courseAPI } from '../services/api';

// ── Shell components ──────────────────────────────────────────────────────────
import DashboardNav from './DashboardNav';
import TeacherSidebar from '../components/TeacherSidebar';

// ── Upload sub-components ─────────────────────────────────────────────────────
import CourseThumbnailUpload from '../components/uploads/CourseThumbnailUpload';
import CourseVideosUpload from '../components/uploads/CourseVideosUpload';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
  FaSave,
  FaExclamationCircle,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Validates a MongoDB ObjectId (24 hex characters).
// Checked before hitting the API to give instant client-side feedback.
// ─────────────────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => /^[0-9a-f]{24}$/i.test(id);

// ─────────────────────────────────────────────────────────────────────────────
// Shared page shell used by loading, error, and main render states.
// Avoids repeating DashboardNav + TeacherSidebar three times in one file.
// ─────────────────────────────────────────────────────────────────────────────
const PageShell = ({ children }) => (
  <div className="h-screen bg-slate-50 flex flex-col">
    <DashboardNav activePage="/teacher/courses" />
    <div className="flex flex-1 overflow-hidden">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  </div>
);

// =============================================================================
// TeacherCourseAssetsUpload
// Dedicated page for uploading a course thumbnail and video lessons.
// =============================================================================
const TeacherCourseAssetsUpload = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [course,      setCourse]      = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Data fetching ───────────────────────────────────────────────────────────

  // Re-fetches the course after each upload so the thumbnail preview updates.
  const refreshCourse = async () => {
    try {
      const data    = await courseAPI.getCreatedCourses();
      const courses = data?.courses || [];
      const match   = courses.find((c) => c.id?.toString() === courseId?.toString());
      setCourse(match || null);
    } catch {
      setCourse(null);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!courseId || !isValidObjectId(courseId)) {
        setError('Invalid course ID.');
        setLoading(false);
        return;
      }

      setError('');
      setLoading(true);
      await refreshCourse();
      setLoading(false);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // ── Save handler ────────────────────────────────────────────────────────────
  const handleSave = () => {
    setSaveSuccess(true);
    // Brief pause so the user sees the "Saved!" confirmation before navigating
    setTimeout(() => navigate('/teacher/courses'), 800);
  };

  // Gradient used for the course header banner and the thumbnail placeholder
  const headerGradient = course?.color || 'from-amber-500 to-orange-500';

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24">
          <FaSpinner className="animate-spin text-4xl text-amber-500" />
        </div>
      </PageShell>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <PageShell>
        <div className="bg-white border border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <FaExclamationCircle className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-red-700 mb-1">Could not load course</h2>
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => navigate('/teacher/courses')}
                className="mt-4 px-4 py-2 rounded-xl font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Back to My Courses
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <PageShell>

      {/* ── Course header card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">

        {/* Gradient banner with title and back button */}
        <div className={`h-28 bg-gradient-to-r ${headerGradient} p-6 flex items-center gap-3`}>
          <button
            type="button"
            onClick={() => navigate('/teacher/courses')}
            aria-label="Back to My Courses"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 flex-shrink-0"
          >
            <FaArrowLeft />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {course?.title || 'Upload Course Assets'}
            </h1>
            <p className="text-white/80 text-sm truncate">
              {course?.category
                ? `${course.category} · ${course.level}`
                : 'Thumbnail + Videos'}
            </p>
          </div>
        </div>

        {/* Thumbnail preview — shows uploaded image or gradient placeholder */}
        <div className="p-6 bg-white">
          {course?.image ? (
            <img
              src={course.image}
              alt="Course thumbnail"
              className="w-full max-h-56 object-cover rounded-2xl border border-slate-200"
            />
          ) : (
            <div
              className={`h-40 rounded-2xl bg-gradient-to-br ${headerGradient} flex items-center justify-center text-white/80 text-sm font-medium`}
            >
              No thumbnail yet — upload one below
            </div>
          )}
        </div>
      </div>

      {/* ── Upload panels ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Thumbnail</h2>
          <CourseThumbnailUpload courseId={courseId} onUploaded={refreshCourse} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Videos</h2>
          <CourseVideosUpload courseId={courseId} onUploaded={refreshCourse} />
        </div>
      </div>

      {/* ── Save footer ────────────────────────────────────────────────────── */}
      {/* Uploads are persisted immediately by the upload sub-components;
          this button simply confirms the teacher is done and returns them
          to the My Courses list. */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Uploads are saved instantly. Click{' '}
          <span className="font-semibold text-slate-700">Save &amp; Continue</span>{' '}
          when you're done.
        </p>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate('/teacher/courses')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Skip for now
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveSuccess}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-70 disabled:cursor-not-allowed shadow hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
          >
            {saveSuccess ? (
              <><FaCheckCircle /><span>Saved!</span></>
            ) : (
              <><FaSave /><span>Save &amp; Continue</span></>
            )}
          </button>
        </div>
      </div>

    </PageShell>
  );
};

export default TeacherCourseAssetsUpload;
