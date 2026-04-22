// Login.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// ── Auth context ──────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';

// ── Shared layout components ──────────────────────────────────────────────────
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ── Assets ────────────────────────────────────────────────────────────────────
import logo from '../assets/logo/logo1.png';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaSpinner,
  FaEnvelope,
  FaLock,
  FaExclamationCircle,
  FaBook,
  FaRobot,
  FaStar,
  FaGraduationCap,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Feature pills shown in the left brand panel.
// Mirrors the Signup page so both auth screens share the same visual language.
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: FaBook,          text: 'Access 100+ curated courses' },
  { icon: FaRobot,         text: 'AI-powered personal tutor' },
  { icon: FaStar,          text: 'Track progress & earn badges' },
  { icon: FaGraduationCap, text: 'Learn at your own pace' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared Tailwind class string for text inputs.
// Defined once so email and password fields stay visually identical.
// focus:ring-blue-500 replaces the previous JS onFocus/onBlur boxShadow hack.
// ─────────────────────────────────────────────────────────────────────────────
const INPUT_CLASS =
  'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm ' +
  'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 ' +
  'outline-none transition-all ' +
  'focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'hover:border-slate-300';

// =============================================================================
// Login page
// =============================================================================
const Login = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  // Redirect back to the page the user tried to visit before being sent to /login
  const fromPathname = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // ── Handlers (all logic unchanged) ─────────────────────────────────────────

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error as soon as the user starts typing again
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(fromPathname, { replace: true });
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } finally {
      // Always re-enable the button, even if navigate() throws
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <div className="flex flex-1">

        {/* ── Left brand panel (lg+ screens only) ──────────────────────────────
            Identical gradient, dot-grid, and feature pills to Signup so the
            two auth pages form one cohesive visual flow.                    */}
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

        {/* ── Right login form panel ────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
          <div className="w-full max-w-md">

            {/* Mobile-only logo — shown when the left brand panel is hidden */}
            <div className="flex lg:hidden flex-col items-center mb-8">
              <img src={logo} alt="Vidyalaya logo" className="w-20 h-20 object-contain mb-3" />
              <h1 className="text-3xl font-extrabold text-blue-700">Vidyalaya</h1>
            </div>

            {/* Form card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">

              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Welcome Back</h2>
                <p className="text-sm text-slate-500">Sign in to continue your learning journey</p>
              </div>

              {/* Inline error banner */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 text-sm flex items-center gap-2"
                >
                  <FaExclamationCircle className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`${INPUT_CLASS} pl-10`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className={`${INPUT_CLASS} pl-10`}
                    />
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Submit button
                    hover:opacity-90 replaces the previous JS onMouseEnter/Leave
                    opacity hack — CSS handles this correctly without React re-renders. */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin h-4 w-4" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Sign-up link */}
              <p className="mt-6 text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-600 font-semibold hover:underline focus:underline focus:outline-none"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {/* Copyright — dynamic year so it never goes stale */}
            <p className="mt-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Vidyalaya. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;