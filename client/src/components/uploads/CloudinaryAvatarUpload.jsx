// CloudinaryAvatarUpload.jsx

// ── React ─────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react';

// ── API ───────────────────────────────────────────────────────────────────────
import { authAPI } from '../../services/api';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import { FaCamera, FaSpinner, FaCheck, FaExclamationCircle } from 'react-icons/fa';

// =============================================================================
// CloudinaryAvatarUpload
// Renders a circular avatar that supports click-to-upload and drag-and-drop.
// Calls authAPI.uploadAvatar() and notifies the parent via onUserUpdated().
// =============================================================================
const CloudinaryAvatarUpload = ({ user, onUserUpdated }) => {
  const fileInputRef = useRef(null);

  const [previewSrc, setPreviewSrc] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState('');
  const [dragOver,   setDragOver]   = useState(false);

  // Show the local preview while uploading; fall back to saved avatar
  const avatarSrc = previewSrc || user?.avatar || '';

  // Single letter used as the placeholder when no image is available.
  // Not memoised — charAt(0) is trivially cheap.
  const avatarInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  // ── File processing (logic unchanged) ──────────────────────────────────────
  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setError('');
    setSuccess(false);
    setPreviewSrc(URL.createObjectURL(file));
    setLoading(true);
    try {
      const updatedUser = await authAPI.uploadAvatar(file);
      onUserUpdated(updatedUser);
      setSuccess(true);
      // Reset success state after a brief confirmation moment
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload avatar');
      setPreviewSrc('');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => processFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  // ── Derived ring class ──────────────────────────────────────────────────────
  // Ring colour changes to communicate drag / success states
  const ringClass = dragOver
    ? 'ring-4 ring-blue-400 ring-offset-2 scale-105'
    : success
    ? 'ring-4 ring-emerald-400 ring-offset-2'
    : 'ring-4 ring-blue-100';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-2 mb-2">

      {/* Avatar circle — interactive via click and drag-and-drop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload profile photo"
        className="relative inline-block cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded-full"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !loading && fileInputRef.current?.click()}
        title="Click or drag an image to update your photo"
      >
        {/* Outer ring wrapper — colour reflects state */}
        <div className={`w-20 h-20 rounded-full transition-all duration-200 ${ringClass}`}>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
            {avatarSrc
              ? <img src={avatarSrc} alt="Profile photo" className="w-full h-full object-cover" />
              : avatarInitial
            }
          </div>
        </div>

        {/* Hover / drag / loading overlay */}
        <div
          className={[
            'absolute inset-0 rounded-full flex items-center justify-center transition-opacity duration-200',
            dragOver  ? 'opacity-100 bg-blue-600/60'  : '',
            loading   ? 'opacity-100 bg-black/50'      : '',
            !dragOver && !loading ? 'opacity-0 group-hover:opacity-100 bg-black/40' : '',
          ].join(' ')}
        >
          {loading
            ? <FaSpinner className="text-white text-lg animate-spin" />
            : success
            ? <FaCheck   className="text-white text-lg" />
            : <FaCamera  className="text-white text-lg" />
          }
        </div>

        {/* Small badge in bottom-right corner */}
        {!loading && (
          <div
            className={`absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              success ? 'bg-emerald-500' : 'bg-blue-600 group-hover:bg-blue-700'
            }`}
          >
            {success
              ? <FaCheck  className="text-white text-[11px]" />
              : <FaCamera className="text-white text-[11px]" />
            }
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Hint text */}
      <p className="text-[11px] text-slate-400">
        {dragOver ? 'Drop to upload' : 'Click or drag to change photo'}
      </p>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 text-center max-w-[180px] flex items-center gap-1">
          <FaExclamationCircle className="flex-shrink-0 text-[10px]" />{error}
        </p>
      )}
    </div>
  );
};

export default CloudinaryAvatarUpload;