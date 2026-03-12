import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import DashboardNav from './DashboardNav';
import TeacherSidebar from '../components/TeacherSidebar';
import {
  FaBook, FaUsers, FaStar, FaPlus, FaEdit, FaTrash,
  FaChartLine, FaCheckCircle, FaExclamationCircle,
  FaSpinner, FaGraduationCap, FaEye, FaToggleOn, FaToggleOff,
  FaTimes, FaChalkboardTeacher, FaBriefcase,
} from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

// ── Stat Card ─────────────────────────────────────────────────────────────────
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

// ── Category & level options ──────────────────────────────────────────────────
const CATEGORIES = ['programming', 'design', 'science', 'mathematics', 'language', 'business', 'arts'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const COLORS = [
  { label: 'Blue → Cyan', value: 'from-blue-500 to-cyan-500' },
  { label: 'Purple → Pink', value: 'from-purple-500 to-pink-500' },
  { label: 'Green → Emerald', value: 'from-green-500 to-emerald-500' },
  { label: 'Orange → Amber', value: 'from-orange-500 to-amber-500' },
  { label: 'Red → Rose', value: 'from-red-500 to-rose-500' },
  { label: 'Indigo → Violet', value: 'from-indigo-500 to-violet-500' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'programming',
  level: 'beginner',
  instructor: '',
  duration: '',
  image: '',
  color: 'from-blue-500 to-cyan-500',
};

// ── Create / Edit Course Modal ────────────────────────────────────────────────
const CourseModal = ({ initial, onClose, onSave, loading, error }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const isEdit = !!initial?.id;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const inputClass =
    'w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FaBook className="text-amber-500" />
            {isEdit ? 'Edit Course' : 'Create New Course'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <FaTimes className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <FaExclamationCircle /><span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course Title *</label>
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
                className={inputClass} placeholder="e.g. Introduction to Python" maxLength={100} />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description * <span className="text-xs text-slate-400 font-normal">({form.description.length}/1000)</span>
              </label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                rows={3} maxLength={1000}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                placeholder="What will students learn from this course?" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputClass}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Level *</label>
              <select value={form.level} onChange={(e) => set('level', e.target.value)} className={inputClass}>
                {LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Instructor Name *</label>
              <input type="text" value={form.instructor} onChange={(e) => set('instructor', e.target.value)}
                className={inputClass} placeholder="Your name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration *</label>
              <input type="text" value={form.duration} onChange={(e) => set('duration', e.target.value)}
                className={inputClass} placeholder="e.g. 6 weeks" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cover Image URL (optional)</label>
              <input type="url" value={form.image} onChange={(e) => set('image', e.target.value)}
                className={inputClass} placeholder="https://..." />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Card Color Theme</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c.value} type="button"
                    onClick={() => set('color', c.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      form.color === c.value
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${c.value}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview card */}
          <div className="mt-2">
            <p className="text-xs text-slate-400 mb-2 font-medium">Preview</p>
            <div className={`h-16 rounded-xl bg-gradient-to-r ${form.color} flex items-center px-4 gap-3`}>
              <FaBook className="text-white text-xl" />
              <div>
                <p className="text-white font-bold text-sm">{form.title || 'Course Title'}</p>
                <p className="text-white/70 text-xs capitalize">{form.level} · {form.category}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.title || !form.description || !form.instructor || !form.duration}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 text-sm"
          >
            {loading ? <><FaSpinner className="animate-spin" /><span>Saving…</span></> : <><FaCheckCircle /><span>{isEdit ? 'Update' : 'Create'} Course</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Teacher Dashboard ────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);

  // Toast
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    fetchCourses();
  }, []);

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

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalStudents = courses.reduce((a, c) => a + (c.enrollmentCount || 0), 0);
  const avgRating =
    courses.length > 0
      ? (courses.reduce((a, c) => a + (c.rating || 0), 0) / courses.length).toFixed(1)
      : '—';
  const published = courses.filter((c) => c.isPublished).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    setModalLoading(true);
    setModalError('');
    try {
      await courseAPI.createCourse(form);
      await fetchCourses();
      setShowModal(false);
      showToast('Course created successfully! 🎉');
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
      await courseAPI.updateCourse(editingCourse.id, form);
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

  const levelColors = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const isMyCourses = location.pathname === '/teacher/courses';

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <DashboardNav activePage={location.pathname} />

      <div className="flex flex-1 overflow-hidden">
        <TeacherSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Toast */}
            {toast && (
              <div className="fixed top-20 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in">
                {toast}
              </div>
            )}

            {/* ── Welcome Banner (dashboard only) ── */}
            {!isMyCourses && (
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
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
                    Welcome, {user?.name?.split(' ')[0] || 'Teacher'}! 👨‍🏫
                  </h2>
                  <p className="text-amber-100 text-sm">
                    {user?.degree && <span className="font-semibold text-white">{user.degree}</span>}
                    {user?.yearsOfTeaching != null && (
                      <span> · {user.yearsOfTeaching} year{user.yearsOfTeaching !== 1 ? 's' : ''} of experience</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => { setEditingCourse(null); setModalError(''); setShowModal(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-all shadow-lg text-sm flex-shrink-0"
                >
                  <FaPlus /><span>New Course</span>
                </button>
              </div>
            </div>
            )}

            {/* ── My Courses page header ── */}
            {isMyCourses && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Courses</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and create your courses</p>
              </div>
            )}

            {/* ── Stats (dashboard only) ── */}
            {!isMyCourses && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={FaBook} label="Total Courses" value={courses.length} gradient="from-amber-500 to-orange-500" sub="Created by you" />
              <StatCard icon={FaUsers} label="Total Students" value={totalStudents} gradient="from-blue-500 to-cyan-500" sub="Across all courses" />
              <StatCard icon={FaStar} label="Avg Rating" value={avgRating} gradient="from-yellow-500 to-amber-500" sub="Student reviews" />
              <StatCard icon={FaChartLine} label="Published" value={published} gradient="from-green-500 to-emerald-500" sub={`of ${courses.length} courses`} />
            </div>
            )}

            {/* ── My Courses ── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FaBook className="text-amber-500" />My Courses
                </h3>
                <button
                  onClick={() => { setEditingCourse(null); setModalError(''); setShowModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm text-sm"
                >
                  <FaPlus /><span>Create Course</span>
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <FaSpinner className="text-3xl text-amber-500 animate-spin" />
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-16">
                  <FaGraduationCap className="text-6xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Courses Yet</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Create your first course and start teaching!</p>
                  <button
                    onClick={() => { setEditingCourse(null); setModalError(''); setShowModal(true); }}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
                  >
                    Create First Course
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-800 transition-all"
                    >
                      {/* Color swatch */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${course.color || 'from-amber-500 to-orange-500'} flex items-center justify-center flex-shrink-0`}>
                        <FaBook className="text-white text-sm" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{course.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${levelColors[course.level] || levelColors.beginner}`}>
                            {course.level}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.isPublished ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <FaUsers className="text-[10px]" />{course.enrollmentCount || 0} students
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <FaStar className="text-[10px] text-yellow-400" />{course.rating?.toFixed(1) || '0.0'} ({course.totalRatings || 0})
                          </span>
                          <span className="text-xs text-slate-400 capitalize">{course.category}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/course/${course.id}`)}
                          title="View course"
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(course)}
                          title={course.isPublished ? 'Unpublish' : 'Publish'}
                          className={`p-2 rounded-lg transition-colors ${course.isPublished ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                          {course.isPublished ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                        </button>
                        <button
                          onClick={() => { setEditingCourse(course); setModalError(''); }}
                          title="Edit course"
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        {deletingId === course.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(course.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                            >Confirm</button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs font-medium"
                            >Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(course.id)}
                            title="Delete course"
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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

            {/* Teacher bio card */}
            {(user?.experienceDescription) && (
              <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <FaChalkboardTeacher className="text-amber-500" />About Me
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  {user.degree && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <FaGraduationCap className="text-amber-500 flex-shrink-0" />
                      <span>{user.degree}</span>
                    </div>
                  )}
                  {user.yearsOfTeaching != null && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <FaBriefcase className="text-amber-500 flex-shrink-0" />
                      <span>{user.yearsOfTeaching} year{user.yearsOfTeaching !== 1 ? 's' : ''} of teaching</span>
                    </div>
                  )}
                </div>
                {user.experienceDescription && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                    {user.experienceDescription}
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showModal && (
        <CourseModal
          initial={null}
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {/* Edit Modal */}
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

