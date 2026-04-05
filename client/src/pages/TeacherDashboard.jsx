// TeacherDashboard.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── Auth & API ────────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';
import { courseAPI, enrollmentAPI } from '../services/api';

// ── Shell components ──────────────────────────────────────────────────────────
import DashboardNav from './DashboardNav';
import TeacherSidebar from '../components/TeacherSidebar';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaBook,
  FaUsers,
  FaStar,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChartLine,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaGraduationCap,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaTimes,
  FaChalkboardTeacher,
  FaBriefcase,
  FaUpload,
} from 'react-icons/fa';

// =============================================================================
// Constants
// =============================================================================

const CATEGORIES = ['programming', 'design', 'science', 'mathematics', 'language', 'business', 'arts'];
const LEVELS     = ['beginner', 'intermediate', 'advanced'];

// Color theme options shown in the course card preview selector
const COLORS = [
  { label: 'Blue → Cyan',      value: 'from-blue-500   to-cyan-500'    },
  { label: 'Purple → Pink',    value: 'from-purple-500 to-pink-500'    },
  { label: 'Green → Emerald',  value: 'from-green-500  to-emerald-500' },
  { label: 'Orange → Amber',   value: 'from-orange-500 to-amber-500'   },
  { label: 'Red → Rose',       value: 'from-red-500    to-rose-500'    },
  { label: 'Indigo → Violet',  value: 'from-indigo-500 to-violet-500'  },
];

// Default form state for the create modal
const EMPTY_FORM = {
  title:       '',
  description: '',
  category:    'programming',
  level:       'beginner',
  instructor:  '',
  duration:    '',
  image:       '',
  price:       '',
  color:       'from-blue-500 to-cyan-500',
};

// Level badge colour map — defined at module level so it is not re-created
// on every render of TeacherDashboard.
const LEVEL_COLORS = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced:     'bg-red-100   text-red-700',
};

// Shared Tailwind class string for form inputs inside the modal
const MODAL_INPUT_CLASS =
  'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm ' +
  'bg-white text-slate-900 placeholder-slate-400 outline-none transition-all ' +
  'focus:ring-2 focus:ring-amber-500 focus:border-transparent hover:border-slate-300';

// =============================================================================
// StatCard — summary metric tile used in the dashboard stats row
// =============================================================================
const StatCard = ({ icon: Icon, label, value, gradient, sub }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradient}`}>
      <Icon className="text-white text-xl" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-green-600 font-medium mt-0.5">{sub}</p>}
    </div>
  </div>
);

// =============================================================================
// CourseModal — create / edit course form rendered in a centred overlay
// =============================================================================
const CourseModal = ({ initial, onClose, onSave, loading, error }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const isEdit = !!initial?.id;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit course' : 'Create new course'}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FaBook className="text-amber-500" />
            {isEdit ? 'Edit Course' : 'Create New Course'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <FaTimes className="text-slate-500" />
          </button>
        </div>

        {/* Form body */}
        <div className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2"
            >
              <FaExclamationCircle /><span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Course Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className={MODAL_INPUT_CLASS}
                placeholder="e.g. Introduction to Python"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description *{' '}
                <span className="text-xs text-slate-400 font-normal">
                  ({form.description.length}/1000)
                </span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="What will students learn from this course?"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 placeholder-slate-400 outline-none resize-none transition-all focus:ring-2 focus:ring-amber-500 focus:border-transparent hover:border-slate-300"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={MODAL_INPUT_CLASS}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Level *</label>
              <select
                value={form.level}
                onChange={(e) => set('level', e.target.value)}
                className={MODAL_INPUT_CLASS}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Instructor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Instructor Name *</label>
              <input
                type="text"
                value={form.instructor}
                onChange={(e) => set('instructor', e.target.value)}
                className={MODAL_INPUT_CLASS}
                placeholder="Your name"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration *</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => set('duration', e.target.value)}
                className={MODAL_INPUT_CLASS}
                placeholder="e.g. 6 weeks"
              />
            </div>


            {/* Price */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Course Price (NPR){' '}
                <span className="text-xs text-slate-400 font-normal">(0 = free)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => set('price', e.target.value === '' ? '' : Number(e.target.value))}
                className={MODAL_INPUT_CLASS}
                placeholder="0"
              />
            </div>

            {/* Color theme picker */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Card Colour Theme</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('color', c.value)}
                    className={[
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all focus:outline-none',
                      form.color === c.value
                        ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${c.value}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live preview card */}
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">Preview</p>
            <div className={`h-16 rounded-xl bg-gradient-to-r ${form.color} flex items-center px-4 gap-3`}>
              <FaBook className="text-white text-xl flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">{form.title || 'Course Title'}</p>
                <p className="text-white/70 text-xs capitalize">{form.level} · {form.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.title || !form.description || !form.instructor || !form.duration}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow flex items-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
          >
            {loading
              ? <><FaSpinner className="animate-spin" /><span>Saving…</span></>
              : <><FaCheckCircle /><span>{isEdit ? 'Update' : 'Create'} Course</span></>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// TeacherDashboard
// =============================================================================
const TeacherDashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  // Course list
  const [courses,            setCourses]            = useState([]);
  const [loading,            setLoading]            = useState(true);

  // Enrollment requests
  const [enrollments,        setEnrollments]        = useState([]);
  const [enrollmentLoading,  setEnrollmentLoading]  = useState(true);

  // Modal state (create + edit share the same CourseModal component)
  const [showModal,     setShowModal]     = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [modalLoading,  setModalLoading]  = useState(false);
  const [modalError,    setModalError]    = useState('');

  // Inline delete confirmation — stores the ID awaiting confirmation
  const [deletingId, setDeletingId] = useState(null);

  // Toast notification
  const [toast, setToast] = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await courseAPI.getCreatedCourses();
      setCourses(data.courses || []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    setEnrollmentLoading(true);
    try {
      const data = await enrollmentAPI.getTeachingRequests();
      setEnrollments(data.enrollments || []);
    } catch {
      setEnrollments([]);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, []);

  // Route-driven modal: navigating to /teacher/create-course opens the create form
  useEffect(() => {
    if (location.pathname === '/teacher/create-course') {
      setEditingCourse(null);
      setModalError('');
      setShowModal(true);
    }
  }, [location.pathname]);

  // ── Handlers (logic unchanged) ──────────────────────────────────────────────

  const handleCreate = async (form) => {
    setModalLoading(true);
    setModalError('');
    try {
      const payload = { ...form, price: Number(form.price) || 0 };
      const data = await courseAPI.createCourse(payload);
      await fetchCourses();
      setShowModal(false);
      showToast('Course created! Now upload thumbnail + videos.');
      const newId = data?.course?.id;
      navigate(newId ? `/teacher/courses/${newId}/assets` : '/teacher/courses');
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (form) => {
    setModalLoading(true);
    setModalError('');
    try {
      const payload = { ...form, price: Number(form.price) || 0 };
      await courseAPI.updateCourse(editingCourse.id, payload);
      await fetchCourses();
      setEditingCourse(null);
      showToast('Course updated successfully!');
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await courseAPI.deleteCourse(id);
      setCourses((p) => p.filter((c) => c.id !== id));
      setDeletingId(null);
      showToast('Course deleted.');
    } catch {
      showToast('Failed to delete course.');
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      await courseAPI.updateCourse(course.id, { isPublished: !course.isPublished });
      setCourses((p) =>
        p.map((c) => c.id === course.id ? { ...c, isPublished: !c.isPublished } : c)
      );
      showToast(`Course ${!course.isPublished ? 'published' : 'unpublished'}.`);
    } catch {
      showToast('Failed to update status.');
    }
  };

  const handleEnrollmentAction = async (id, action) => {
    try {
      if (action === 'approve') await enrollmentAPI.approve(id);
      else                      await enrollmentAPI.reject(id);
      showToast(`Enrollment ${action}d.`);
      await Promise.all([fetchEnrollments(), fetchCourses()]);
    } catch {
      showToast('Failed to update enrollment request.');
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────

  const totalStudents = courses.reduce((a, c) => a + (c.enrollmentCount || 0), 0);
  const avgRating     = courses.length > 0
    ? (courses.reduce((a, c) => a + (c.rating || 0), 0) / courses.length).toFixed(1)
    : '—';
  const published  = courses.filter((c) => c.isPublished).length;
  const firstName  = user?.name?.split(' ')[0] || 'Teacher';

  // True when the active route is the "My Courses" view rather than the overview dashboard
  const isMyCourses = location.pathname === '/teacher/courses' || location.pathname === '/teacher/create-course';

  const openCreateModal = () => {
    setEditingCourse(null);
    setModalError('');
    setShowModal(true);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <DashboardNav activePage={location.pathname} />

      <div className="flex flex-1 overflow-hidden">
        <TeacherSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* ── Toast notification ─────────────────────────────────────── */}
            {toast && (
              <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium">
                {toast}
              </div>
            )}

            {/* ── Welcome banner (dashboard route only) ──────────────────── */}
            {!isMyCourses && (
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
                {/* Decorative background circles */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute -top-16 -right-16 w-64 h-64 bg-white rounded-full" />
                  <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white rounded-full" />
                </div>

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FaChalkboardTeacher className="text-yellow-200" />
                      <span className="text-amber-100 text-sm font-medium">Teacher Dashboard</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-1">
                      Welcome, {firstName}! 👨‍🏫
                    </h2>
                    <p className="text-amber-100 text-sm">
                      {user?.degree && (
                        <span className="font-semibold text-white">{user.degree}</span>
                      )}
                      {user?.yearsOfTeaching != null && (
                        <span> · {user.yearsOfTeaching} year{user.yearsOfTeaching !== 1 ? 's' : ''} of experience</span>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-all shadow-lg text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <FaPlus /><span>New Course</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── My Courses page header ──────────────────────────────────── */}
            {isMyCourses && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">My Courses</h2>
                <p className="text-slate-500 text-sm mt-1">Manage and create your courses</p>
              </div>
            )}

            {/* ── Stats row (dashboard only) ──────────────────────────────── */}
            {!isMyCourses && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={FaBook}       label="Total Courses"  value={courses.length}  gradient="from-amber-500 to-orange-500"  sub="Created by you"           />
                <StatCard icon={FaUsers}      label="Total Students" value={totalStudents}   gradient="from-blue-500  to-cyan-500"    sub="Across all courses"        />
                <StatCard icon={FaStar}       label="Avg Rating"     value={avgRating}       gradient="from-yellow-500 to-amber-500"  sub="Student reviews"           />
                <StatCard icon={FaChartLine}  label="Published"      value={published}       gradient="from-green-500 to-emerald-500" sub={`of ${courses.length} courses`} />
              </div>
            )}

            {/* ── Enrollment requests (dashboard only) ────────────────────── */}
            {!isMyCourses && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <FaUsers className="text-amber-500" />Enrollment Requests
                </h3>

                {enrollmentLoading ? (
                  <div className="flex justify-center py-10">
                    <FaSpinner className="text-2xl text-amber-500 animate-spin" />
                  </div>
                ) : enrollments.length === 0 ? (
                  <p className="text-sm text-slate-500">No enrollment requests yet.</p>
                ) : (
                  <div className="space-y-2">
                    {enrollments.map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-wrap items-center gap-3 justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/80"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{req.studentName}</p>
                          <p className="text-xs text-slate-500 truncate">{req.courseTitle}</p>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                          {/* Status pill — colour maps to request status */}
                          <span
                            className={[
                              'px-2 py-0.5 rounded-full font-semibold capitalize',
                              req.status === 'pending'  && 'bg-amber-100 text-amber-700',
                              req.status === 'approved' && 'bg-green-100 text-green-700',
                              req.status === 'rejected' && 'bg-red-100   text-red-700',
                            ].filter(Boolean).join(' ')}
                          >
                            {req.status}
                          </span>
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEnrollmentAction(req.id, 'approve')}
                              className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleEnrollmentAction(req.id, 'reject')}
                              className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── My Courses list ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FaBook className="text-amber-500" />My Courses
                </h3>
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all shadow text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <FaPlus /><span>Create Course</span>
                </button>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex justify-center py-16">
                  <FaSpinner className="text-3xl text-amber-500 animate-spin" />
                </div>
              )}

              {/* Empty state */}
              {!loading && courses.length === 0 && (
                <div className="text-center py-16">
                  <FaGraduationCap className="text-6xl text-slate-200 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-slate-900 mb-2">No Courses Yet</h4>
                  <p className="text-slate-500 text-sm mb-5">Create your first course and start teaching!</p>
                  <button
                    onClick={openCreateModal}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    Create First Course
                  </button>
                </div>
              )}

              {/* Course list */}
              {!loading && courses.length > 0 && (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-200 transition-all"
                    >
                      {/* Course swatch / thumbnail */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-slate-100">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${course.color || 'from-amber-500 to-orange-500'} flex items-center justify-center`}>
                            <FaBook className="text-white text-sm" />
                          </div>
                        )}
                      </div>

                      {/* Course info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 text-sm truncate">{course.title}</p>

                          {/* Level badge */}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${LEVEL_COLORS[course.level] || LEVEL_COLORS.beginner}`}>
                            {course.level}
                          </span>

                          {/* Published / Draft badge */}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            course.isPublished
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        {/* Course meta row */}
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <FaUsers className="text-[10px]" />{course.enrollmentCount || 0} students
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <FaStar className="text-[10px] text-yellow-400" />
                            {course.rating?.toFixed(1) || '0.0'} ({course.totalRatings || 0})
                          </span>
                          <span className="text-xs text-slate-400 capitalize">{course.category}</span>
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                            {course.price && Number(course.price) > 0
                              ? `Paid · NPR ${Number(course.price).toLocaleString()}`
                              : 'Free'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">

                        {/* View */}
                        <button
                          onClick={() => navigate(`/course/${course.id}`)}
                          title="View course"
                          aria-label={`View ${course.title}`}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
                        >
                          <FaEye className="text-sm" />
                        </button>

                        {/* Upload assets */}
                        <button
                          onClick={() => navigate(`/teacher/courses/${course.id}/assets`)}
                          title="Upload thumbnail + videos"
                          aria-label={`Upload assets for ${course.title}`}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors focus:outline-none"
                        >
                          <FaUpload className="text-sm" />
                        </button>

                        {/* Publish toggle */}
                        <button
                          onClick={() => handleTogglePublish(course)}
                          title={course.isPublished ? 'Unpublish' : 'Publish'}
                          aria-label={course.isPublished ? `Unpublish ${course.title}` : `Publish ${course.title}`}
                          className={`p-2 rounded-lg transition-colors focus:outline-none ${
                            course.isPublished
                              ? 'text-green-500 hover:bg-green-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {course.isPublished
                            ? <FaToggleOn  className="text-lg" />
                            : <FaToggleOff className="text-lg" />
                          }
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => { setEditingCourse(course); setModalError(''); }}
                          title="Edit course"
                          aria-label={`Edit ${course.title}`}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors focus:outline-none"
                        >
                          <FaEdit className="text-sm" />
                        </button>

                        {/* Delete — two-step inline confirmation */}
                        {deletingId === course.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(course.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors focus:outline-none"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium transition-colors focus:outline-none"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(course.id)}
                            title="Delete course"
                            aria-label={`Delete ${course.title}`}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Teacher bio card (shown when experienceDescription is set) ─ */}
            {user?.experienceDescription && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FaChalkboardTeacher className="text-amber-500" />About Me
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 mb-3">
                  {user.degree && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FaGraduationCap className="text-amber-500 flex-shrink-0" />
                      <span>{user.degree}</span>
                    </div>
                  )}
                  {user.yearsOfTeaching != null && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FaBriefcase className="text-amber-500 flex-shrink-0" />
                      <span>{user.yearsOfTeaching} year{user.yearsOfTeaching !== 1 ? 's' : ''} of teaching</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{user.experienceDescription}</p>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Create modal */}
      {showModal && (
        <CourseModal
          initial={null}
          onClose={() => {
            setShowModal(false);
            if (location.pathname === '/teacher/create-course') navigate('/teacher/courses');
          }}
          onSave={handleCreate}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {/* Edit modal */}
      {editingCourse && (
        <CourseModal
          initial={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSave={handleUpdate}
          loading={modalLoading}
          error={modalError}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
