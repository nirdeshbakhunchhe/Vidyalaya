// Signup.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ── Auth context ──────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';

// ── Shared layout components ──────────────────────────────────────────────────
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ── Assets ────────────────────────────────────────────────────────────────────
import logo from '../assets/logo/logo1.png';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaBriefcase,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaCamera,
  FaStar,
  FaBook,
  FaRobot,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Feature list shown in the left brand panel.
// Kept as a constant outside the component to avoid re-creating on every render.
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: FaBook,          text: 'Access 100+ curated courses' },
  { icon: FaRobot,         text: 'AI-powered personal tutor' },
  { icon: FaStar,          text: 'Track progress & earn badges' },
  { icon: FaGraduationCap, text: 'Learn at your own pace' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Role options for the "join as" toggle.
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'student', label: 'Student', icon: FaGraduationCap,    desc: 'Learn new skills' },
  { value: 'teacher', label: 'Teacher', icon: FaChalkboardTeacher, desc: 'Share knowledge' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared Tailwind class string for all text inputs.
// Defined once so every field stays visually consistent.
// ─────────────────────────────────────────────────────────────────────────────
const INPUT_CLASS =
  'w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl ' +
  'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm placeholder-slate-400 ' +
  'outline-none transition-all ' +
  'focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'hover:border-slate-300 dark:border-slate-600';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable labelled field wrapper — keeps label + input markup DRY.
// ─────────────────────────────────────────────────────────────────────────────
const Field = ({ label, suffix, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
      {label}
      {suffix && <span className="font-normal normal-case text-slate-400">{suffix}</span>}
    </label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Icon wrapper that positions an icon inside a text input on the left side.
// ─────────────────────────────────────────────────────────────────────────────
const InputIcon = ({ icon: Icon }) => (
  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
);

// =============================================================================
// Signup page
// =============================================================================
const Signup = () => {
  const { signup } = useAuth();
  const navigate   = useNavigate();

  // Form state
  const [role, setRole]           = useState('student');
  const [formData, setFormData]   = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [teacherData, setTeacherData] = useState({ degree: '', yearsOfTeaching: '', experienceDescription: '' });
  const [qualificationFile, setQualificationFile] = useState(null);
  const [avatarFile, setAvatarFile]   = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── Handlers (all logic unchanged) ─────────────────────────────────────────

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTeacherChange = (e) =>
    setTeacherData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleQualificationChange = (e) => {
    const file = e.target.files[0];
    if (file) setQualificationFile(file);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword)
      return setError('Passwords do not match');
    if (formData.password.length < 6)
      return setError('Password must be at least 6 characters');

    if (role === 'teacher') {
      if (!teacherData.degree.trim())                  return setError('Degree is required for teachers');
      if (!teacherData.yearsOfTeaching)                return setError('Years of teaching is required');
      if (!teacherData.experienceDescription.trim())   return setError('Experience description is required');
      if (!qualificationFile)                          return setError('Qualification document is required');
    }

    setLoading(true);
    try {
      let finalPayload;
      if (role === 'teacher') {
        finalPayload = new FormData();
        finalPayload.append('name', formData.name);
        finalPayload.append('email', formData.email);
        finalPayload.append('password', formData.password);
        finalPayload.append('role', role);
        finalPayload.append('degree', teacherData.degree);
        finalPayload.append('yearsOfTeaching', Number(teacherData.yearsOfTeaching));
        finalPayload.append('experienceDescription', teacherData.experienceDescription);
        if (qualificationFile) {
          finalPayload.append('qualificationDoc', qualificationFile);
        }
      } else {
        finalPayload = {
          name:     formData.name,
          email:    formData.email,
          password: formData.password,
          role,
        };
      }
      await signup(finalPayload);
      navigate('/verify-otp', { state: { email: formData.email, from: 'signup', role } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────

  // First letter of name used as avatar placeholder when no image is selected
  const avatarInitial = formData.name?.charAt(0)?.toUpperCase() || '?';

  // Character count suffix displayed next to the textarea label
  const charCount = `(${teacherData.experienceDescription.length}/500)`;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">

      <Navbar />

      <div className="flex flex-1">

        {/* ── Left brand panel (visible on lg+ screens) ────────────────────────
            Uses the same gradient and decorative pattern as the Login page
            so both auth screens feel like one cohesive flow.               */}
        <aside
          className="hidden lg:flex lg:w-[42%] xl:w-[45%] flex-shrink-0 flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a3a6e 0%, #1e50a0 40%, #2563c4 100%)' }}
        >
          {/* Subtle dot-grid texture for depth */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
              backgroundSize:  '28px 28px',
            }}
          />

          {/* Ambient glow blobs — purely decorative */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 dark:bg-slate-900/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-blue-300/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center px-12 py-16 gap-8">

            {/* Logo + wordmark */}
            <div className="flex flex-col items-center gap-3">
              <img
                src={logo}
                alt="Vidyalaya logo"
                className="h-16 w-16 rounded-2xl object-contain bg-white/10 dark:bg-slate-900/10 p-2 shadow-2xl ring-2 ring-white/20"
              />
              <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg">
                Vidyalaya
              </h1>
              <p className="text-blue-200 text-base font-medium">पढ्यो नेपाल बढ्यो नेपाल</p>
            </div>

            <p className="text-white/80 text-base leading-relaxed max-w-xs">
              Your AI-powered gateway to smarter learning —<br />anytime, anywhere.
            </p>

            {/* Feature pills */}
            <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 bg-white/10 dark:bg-slate-900/40 hover:bg-white/20 dark:hover:bg-slate-900/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 dark:bg-slate-900/50 flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white text-sm" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Right signup form panel ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto flex items-start justify-center py-10 px-4 sm:px-8">
          <div className="w-full max-w-md">

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">

              {/* Heading */}
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Create Account</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Join Vidyalaya and start your journey</p>
              </div>

              {/* ── Role toggle ─────────────────────────────────────────────── */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  I want to join as…
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={[
                        'relative flex flex-col items-center justify-center gap-1.5 py-3 px-2',
                        'rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400',
                        role === value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:bg-blue-50 dark:bg-blue-900/20/50',
                      ].join(' ')}
                    >
                      {/* Tick badge shown on the selected role */}
                      {role === value && (
                        <FaCheckCircle className="absolute top-2 right-2 text-blue-500 text-[10px]" />
                      )}
                      <Icon className="text-xl" />
                      <span className="text-sm font-bold">{label}</span>
                      <span className="text-xs opacity-60">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Inline error banner ──────────────────────────────────────── */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 text-sm flex items-center gap-2"
                >
                  <FaExclamationCircle className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Avatar upload ──────────────────────────────────────────
                    Shows either the uploaded image preview or the user's
                    name initial as a coloured circle placeholder.         */}
                <div className="flex flex-col items-center gap-1">
                  <label className="relative cursor-pointer group" aria-label="Upload profile photo">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold overflow-hidden ring-4 ring-blue-100">
                      {avatarPreview
                        ? <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        : <span>{avatarInitial}</span>
                      }
                    </div>
                    {/* Camera overlay badge */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow transition-colors">
                      <FaCamera className="text-[10px]" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-400">Optional profile photo</p>
                </div>

                {/* Full name */}
                <Field label="Full Name">
                  <div className="relative">
                    <InputIcon icon={FaUser} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                      className={INPUT_CLASS}
                    />
                  </div>
                </Field>

                {/* Email */}
                <Field label="Email Address">
                  <div className="relative">
                    <InputIcon icon={FaEnvelope} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className={INPUT_CLASS}
                    />
                  </div>
                </Field>

                {/* Password */}
                <Field label="Password">
                  <div className="relative">
                    <InputIcon icon={FaLock} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      required
                      /* Extra right padding so text doesn't overlap the toggle button */
                      className={`${INPUT_CLASS} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-300 focus:outline-none focus:text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </Field>

                {/* Confirm password */}
                <Field label="Confirm Password">
                  <div className="relative">
                    <InputIcon icon={FaLock} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat your password"
                      required
                      className={INPUT_CLASS}
                    />
                  </div>
                </Field>

                {/* ── Teacher-specific fields (only rendered when role === 'teacher') ── */}
                {role === 'teacher' && (
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Teacher Information
                    </p>

                    <Field label="Degree">
                      <div className="relative">
                        <InputIcon icon={FaGraduationCap} />
                        <input
                          type="text"
                          name="degree"
                          value={teacherData.degree}
                          onChange={handleTeacherChange}
                          placeholder="e.g. M.Sc. Computer Science"
                          required
                          className={INPUT_CLASS}
                        />
                      </div>
                    </Field>

                    <Field label="Years of Teaching">
                      <div className="relative">
                        <InputIcon icon={FaBriefcase} />
                        <input
                          type="number"
                          name="yearsOfTeaching"
                          value={teacherData.yearsOfTeaching}
                          onChange={handleTeacherChange}
                          placeholder="e.g. 5"
                          min="0"
                          max="60"
                          required
                          className={INPUT_CLASS}
                        />
                      </div>
                    </Field>

                    <Field label="Experience Description" suffix={charCount}>
                      <textarea
                        name="experienceDescription"
                        value={teacherData.experienceDescription}
                        onChange={handleTeacherChange}
                        placeholder="Briefly describe your teaching background and expertise…"
                        required
                        rows={3}
                        maxLength={500}
                        /* Uses the same border, radius, and focus ring as text inputs for consistency */
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm placeholder-slate-400 outline-none resize-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 dark:border-slate-600"
                      />
                    </Field>

                    <Field label="Qualification Document">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleQualificationChange}
                          required
                          className="w-full pl-3 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">Upload your degree or certification (PDF or Image, max 5MB).</p>
                    </Field>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Creating account…</span>
                    </>
                  ) : (
                    <span>Create {role === 'teacher' ? 'Teacher' : 'Student'} Account</span>
                  )}
                </button>
              </form>

              {/* Sign-in link */}
              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 font-semibold hover:underline focus:underline focus:outline-none"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Footer copyright note */}
            <p className="mt-4 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Vidyalaya. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Signup;