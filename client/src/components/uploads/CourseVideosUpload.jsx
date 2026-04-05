// CourseVideosUpload.jsx

// ── React ─────────────────────────────────────────────────────────────────────
import { useCallback, useRef, useState } from 'react';

// ── API ───────────────────────────────────────────────────────────────────────
import { courseAPI } from '../../services/api';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaVideo,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaExclamationCircle,
  FaCloudUploadAlt,
} from 'react-icons/fa';

// ── Shared progress bar ───────────────────────────────────────────────────────
import UploadProgressBar from './UploadProgressBar';

// =============================================================================
// Helpers
// =============================================================================

// Strips file extension and cleans up separators for use as a default title.
const stripExtension = (name = '') =>
  name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();

const formatBytes = (b) => {
  if (!b) return '';
  return b < 1024 * 1024
    ? `${(b / 1024).toFixed(0)} KB`
    : `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

// =============================================================================
// VideoItem — single video card shown in the queue list
// =============================================================================

// Status display config — pill colours for each upload state.
// "done" uses an icon-based label rendered in JSX below rather than a text string.
const STATUS_CONFIG = {
  pending:   { pillClass: 'bg-slate-100 text-slate-500'  },
  uploading: { pillClass: 'bg-blue-50   text-blue-600'   },
  done:      { pillClass: 'bg-emerald-50 text-emerald-600' },
  error:     { pillClass: 'bg-red-50    text-red-600'    },
};

const VideoItem = ({ item, onTitleChange, onRemove, disabled }) => {
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

  // Pill label — resolved here so JSX stays clean
  const pillLabel = item.status === 'pending'
    ? formatBytes(item.file.size)
    : item.status === 'uploading'
    ? 'Uploading…'
    : item.status === 'done'
    ? null   // rendered as icon below
    : 'Failed';

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white transition-all">

      {/* Header row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
          <FaVideo className="text-[11px] text-violet-500" />
        </div>
        <p className="text-xs font-medium text-slate-600 truncate flex-1 min-w-0">
          {item.file.name}
        </p>

        {/* Status pill */}
        {item.status !== 'done' ? (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.pillClass}`}>
            {pillLabel}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
            <FaCheck className="text-[8px]" /> Done
          </span>
        )}

        {/* Remove button — hidden while uploading or already done */}
        {item.status !== 'uploading' && item.status !== 'done' && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={disabled}
            aria-label={`Remove ${item.file.name}`}
            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-40 focus:outline-none"
          >
            <FaTimes className="text-[10px]" />
          </button>
        )}
      </div>

      {/* Body: editable title + progress */}
      <div className="px-3 py-2.5 space-y-2">
        <input
          type="text"
          value={item.title}
          onChange={(e) => onTitleChange(item.id, e.target.value)}
          disabled={disabled || item.status === 'uploading' || item.status === 'done'}
          placeholder="Video title…"
          maxLength={200}
          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {(item.status === 'uploading' || item.status === 'done') && (
          <UploadProgressBar
            progress={item.status === 'done' ? 100 : item.progress}
            label={item.status === 'done' ? 'Uploaded' : 'Uploading…'}
          />
        )}

        {item.status === 'error' && (
          <p className="text-[11px] text-red-500 flex items-center gap-1">
            <FaExclamationCircle className="text-[10px] flex-shrink-0" />
            {item.error || 'Upload failed — will retry on next upload.'}
          </p>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// CourseVideosUpload — multi-file video queue with sequential upload
// =============================================================================
const CourseVideosUpload = ({ courseId, onUploaded, maxVideos = 10 }) => {
  const inputRef = useRef(null);

  const [items,        setItems]        = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [error,        setError]        = useState('');
  const [dragOver,     setDragOver]     = useState(false);

  // ── File management ─────────────────────────────────────────────────────────
  const addFiles = useCallback((files) => {
    setError('');
    setItems((prev) => {
      const remaining = Math.max(0, maxVideos - prev.length);
      const next = files.slice(0, remaining).map((file) => ({
        id:       `${file.name}_${file.size}_${Date.now()}_${Math.random()}`,
        file,
        title:    stripExtension(file.name).slice(0, 200) || 'Untitled',
        progress: 0,
        status:   'pending',
        error:    '',
      }));
      return [...prev, ...next];
    });
  }, [maxVideos]);

  const handleInput = (e) => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('video/'));
    if (files.length) addFiles(files);
  };

  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeItem = (id) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  // ── Sequential upload (logic unchanged) ────────────────────────────────────
  const handleUploadAll = async () => {
    if (!courseId || !items.length) return;
    setBulkUploading(true);
    setError('');

    for (const it of items) {
      if (it.status === 'done') continue;
      updateItem(it.id, { status: 'uploading', progress: 0, error: '' });
      try {
        await courseAPI.uploadCourseVideo(courseId, it.file, {
          title: it.title,
          onUploadProgress: (evt) => {
            const pct = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0;
            updateItem(it.id, { progress: pct });
          },
        });
        updateItem(it.id, { status: 'done', progress: 100 });
        onUploaded?.();
      } catch (err) {
        updateItem(it.id, {
          status:   'error',
          progress: 0,
          error:    err.response?.data?.message || err.message || 'Video upload failed',
        });
        setError('One or more videos failed. They will retry on next upload.');
      }
    }
    setBulkUploading(false);
  };

  // Derived counts — plain filters on what is typically a small array (<10 items)
  const pendingCount = items.filter((it) => it.status === 'pending' || it.status === 'error').length;
  const doneCount    = items.filter((it) => it.status === 'done').length;
  const canUpload    = !!courseId && pendingCount > 0 && !bulkUploading;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
          <FaVideo className="text-xs text-violet-600" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">Course Videos</h4>
        {doneCount > 0 && (
          <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <FaCheck className="text-[10px]" /> {doneCount} uploaded
          </span>
        )}
        {items.length === 0 && (
          <span className="ml-auto text-xs text-slate-400">Up to {maxVideos} files</span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !bulkUploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload course videos"
        onKeyDown={(e) => e.key === 'Enter' && !bulkUploading && inputRef.current?.click()}
        className={[
          'flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed p-5',
          'cursor-pointer transition-all duration-200 select-none',
          'focus:outline-none focus:ring-2 focus:ring-violet-400',
          bulkUploading ? 'opacity-50 cursor-not-allowed' : '',
          dragOver
            ? 'border-violet-400 bg-violet-50 scale-[1.01]'
            : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/40',
        ].join(' ')}
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
          dragOver ? 'bg-violet-100' : 'bg-white shadow-sm border border-slate-100'
        }`}>
          <FaVideo className={`text-xl ${dragOver ? 'text-violet-500' : 'text-slate-300'}`} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            Drop videos here or{' '}
            <span className="text-violet-600">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">MP4, MOV, WEBM · Multiple files supported</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleInput}
          disabled={bulkUploading}
          className="hidden"
        />
      </div>

      {/* Video queue */}
      {items.length > 0 && (
        <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-0.5">
          {items.map((it) => (
            <VideoItem
              key={it.id}
              item={it}
              onTitleChange={(id, val) => updateItem(id, { title: val })}
              onRemove={removeItem}
              disabled={bulkUploading}
            />
          ))}
        </div>
      )}

      {/* Global error */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <FaExclamationCircle className="text-[10px] flex-shrink-0" /> {error}
        </p>
      )}

      {/* Upload all button — only visible when there are queued videos */}
      {items.length > 0 && (
        <button
          type="button"
          onClick={handleUploadAll}
          disabled={!canUpload}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1"
        >
          {bulkUploading ? (
            <><FaSpinner className="animate-spin" /> Uploading…</>
          ) : (
            <><FaCloudUploadAlt /> Upload {pendingCount} video{pendingCount !== 1 ? 's' : ''}</>
          )}
        </button>
      )}

      {/* Queue status summary */}
      {doneCount > 0 && pendingCount > 0 && !bulkUploading && (
        <p className="text-center text-xs text-slate-400">
          {doneCount} uploaded · {pendingCount} queued
        </p>
      )}
    </div>
  );
};

export default CourseVideosUpload;