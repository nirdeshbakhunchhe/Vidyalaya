// CourseAssetsUploadModal.jsx

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import { FaTimes } from 'react-icons/fa';

// ── Upload sub-components ─────────────────────────────────────────────────────
import CourseThumbnailUpload from './CourseThumbnailUpload';
import CourseVideosUpload from './CourseVideosUpload';

// =============================================================================
// CourseAssetsUploadModal
// Centred overlay modal for uploading a course thumbnail and video lessons.
// Rendered from TeacherDashboard when a teacher wants to add assets to a course.
// =============================================================================
const CourseAssetsUploadModal = ({ course, onClose, onAssetsUploaded }) => {
  if (!course) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Upload assets for ${course.title}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">Upload Course Assets</h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">{course.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-4 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <FaTimes />
          </button>
        </div>

        {/* Scrollable body — thumbnail first, then videos */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <CourseThumbnailUpload
            courseId={course.id}
            onUploaded={onAssetsUploaded}
          />

          <div className="border-t border-slate-100" />

          <CourseVideosUpload
            courseId={course.id}
            onUploaded={onAssetsUploaded}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseAssetsUploadModal;