// UploadProgressBar.jsx
//
// Generic upload progress indicator used by CourseThumbnailUpload and
// CourseVideosUpload. Switches to an emerald colour palette when progress
// reaches 100% to signal completion.

// =============================================================================
// UploadProgressBar
// Props:
//   progress  — number 0–100
//   label     — optional string shown above the bar
//   variant   — 'thumbnail' | 'default'
//               'thumbnail' uses an amber fill; default uses blue
// =============================================================================
const UploadProgressBar = ({ progress, label, variant = 'default' }) => {
  const safeProgress = Number.isFinite(progress)
    ? Math.max(0, Math.min(100, progress))
    : 0;

  const isDone = safeProgress === 100;

  // Fill colour — emerald when done; amber for thumbnail variant; blue otherwise
  const fillClass = isDone
    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
    : variant === 'thumbnail'
    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
    : 'bg-gradient-to-r from-blue-500 to-cyan-500';

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-medium ${
              isDone ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            {/* Check mark prefix shown only when done — avoids emoji rendering variance */}
            {isDone && '✓ '}{label}
          </span>
          <span
            className={`text-xs font-semibold tabular-nums ${
              isDone ? 'text-emerald-600' : 'text-slate-600'
            }`}
          >
            {safeProgress}%
          </span>
        </div>
      )}

      <div
        className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"
        role="progressbar"
        aria-valuenow={safeProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-1.5 ${fillClass} rounded-full transition-all duration-200 ease-out`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};

export default UploadProgressBar;