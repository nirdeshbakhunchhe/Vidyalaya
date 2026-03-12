import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSpinner } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import logo from '../assets/logo/logo1.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPathname = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate(fromPathname, { replace: true });
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Navbar />
      
      <div className="flex-1 flex">
        {/* ── Left Panel ── */}
        <div
          className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #1e4d8c 40%, #1565c0 100%)' }}
        >
          {/* Dot-grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Decorative blurred circles */}
          <div
            className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #90caf9, transparent 70%)' }}
          />
          <div
            className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #42a5f5, transparent 70%)' }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-12">
            <img src={logo} alt="Vidyalaya" className="w-36 h-36 object-contain mb-6 drop-shadow-2xl" />
            <h1
              className="text-5xl font-extrabold text-white mb-3 tracking-tight"
              style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.5px' }}
            >
              Vidyalaya
            </h1>
            <p
              className="text-lg font-medium mb-2"
              style={{ color: '#90caf9', fontFamily: "'Poppins', sans-serif" }}
            >
              पढ्यो नेपाल बढ्यो नेपाल
            </p>
            <p className="text-sm mt-4 max-w-xs" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: "'Poppins', sans-serif" }}>
              Your AI-powered gateway to smarter learning — anytime, anywhere.
            </p>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-slate-900">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex lg:hidden flex-col items-center mb-8">
              <img src={logo} alt="Vidyalaya" className="w-20 h-20 object-contain mb-3" />
              <h1
                className="text-3xl font-extrabold"
                style={{ color: '#1565c0', fontFamily: "'Poppins', sans-serif" }}
              >
                Vidyalaya
              </h1>
            </div>

            {/* Card */}
            <div
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-100 dark:border-slate-700"
              style={{ boxShadow: '0 8px 40px rgba(21,101,192,0.10)' }}
            >
              <h2
                className="text-2xl font-bold text-slate-900 dark:text-white mb-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Welcome Back
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-7" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Sign in to continue your learning journey
              </p>

              {error && (
                <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:border-transparent bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm"
                    style={{ outline: 'none', '--tw-ring-color': '#1565c0' }}
                    placeholder="you@example.com"
                    onFocus={e => (e.target.style.boxShadow = '0 0 0 3px rgba(21,101,192,0.18)')}
                    onBlur={e => (e.target.style.boxShadow = 'none')}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:border-transparent bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm"
                    placeholder="Enter your password"
                    onFocus={e => (e.target.style.boxShadow = '0 0 0 3px rgba(21,101,192,0.18)')}
                    onBlur={e => (e.target.style.boxShadow = 'none')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm mt-2"
                  style={{
                    background: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)',
                    fontFamily: "'Poppins', sans-serif",
                    boxShadow: '0 4px 18px rgba(21,101,192,0.35)',
                  }}
                  onMouseEnter={e => !loading && (e.target.style.opacity = '0.92')}
                  onMouseLeave={e => (e.target.style.opacity = '1')}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-bold transition-colors"
                    style={{ color: '#1565c0' }}
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
              © 2024 Vidyalaya. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;