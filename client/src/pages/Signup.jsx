
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import logo from '../assets/logo/logo1.png';
import {
  FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaGraduationCap, FaChalkboardTeacher, FaBriefcase,
  FaCheckCircle, FaExclamationCircle, FaSpinner, FaCamera,
  FaStar, FaBook, FaRobot,
} from 'react-icons/fa';

const FEATURES = [
  { icon: FaBook,          text: 'Access 100+ curated courses' },
  { icon: FaRobot,         text: 'AI-powered personal tutor' },
  { icon: FaStar,          text: 'Track progress & earn badges' },
  { icon: FaGraduationCap, text: 'Learn at your own pace' },
];

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [teacherData, setTeacherData] = useState({
    degree: '',
    yearsOfTeaching: '',
    experienceDescription: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleTeacherChange = (e) =>
    setTeacherData((p) => ({ ...p, [e.target.name]: e.target.value }));

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
      if (!teacherData.degree.trim())       return setError('Degree is required for teachers');
      if (!teacherData.yearsOfTeaching)     return setError('Years of teaching is required');
      if (!teacherData.experienceDescription.trim()) return setError('Experience description is required');
    }
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
        ...(role === 'teacher' && {
          degree: teacherData.degree,
          yearsOfTeaching: Number(teacherData.yearsOfTeaching),
          experienceDescription: teacherData.experienceDescription,
        }),
      };
      await signup(payload);
      navigate('/verify-otp', {
        state: {
          email: formData.email,
          from: 'signup',
          role,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm placeholder-slate-400 outline-none transition-all';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Split-panel body ──────────────────────────────────────────────── */}
      <div className="flex flex-1">

        {/* LEFT — Blue brand panel (matches login page exactly) */}
        <div
          className="hidden lg:flex lg:w-[42%] xl:w-[45%] flex-shrink-0 flex-col items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a3a6e 0%, #1e50a0 40%, #2563c4 100%)',
            minHeight: 'calc(100vh - 64px)', // subtract navbar height
          }}
        >
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-blue-300/10 blur-2xl pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-12 py-16 gap-8">
            {/* Logo + wordmark */}
            <div className="flex flex-col items-center gap-3">
              <img
                src={logo}
                alt="Vidyalaya"
                className="h-16 w-16 rounded-2xl object-contain bg-white/10 p-2 shadow-2xl ring-2 ring-white/20"
              />
              <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg">
                Vidyalaya
              </h1>
              <p className="text-blue-200 text-base font-medium">
                पढ्यो नेपाल बढ्यो नेपाल
              </p>
            </div>

            <p className="text-white/80 text-base leading-relaxed max-w-xs">
              Your AI-powered gateway to smarter learning —<br />anytime, anywhere.
            </p>

            {/* Feature pills */}
            <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/15 transition-colors backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white text-sm" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Signup form */}
        <div className="flex-1 overflow-y-auto flex items-start justify-center py-10 px-4 sm:px-8">
          <div className="w-full max-w-md">

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">

              <div className="mb-5">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Create Account</h2>
                <p className="text-slate-500 text-sm">Join Vidyalaya and start your journey</p>
              </div>

              {/* Role toggle */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  I want to join as…
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'student', label: 'Student', icon: FaGraduationCap, desc: 'Learn new skills' },
                    { value: 'teacher', label: 'Teacher', icon: FaChalkboardTeacher, desc: 'Share knowledge' },
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                        role === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50/50'
                      }`}
                    >
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

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <FaExclamationCircle className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-1">
                  <label className="relative cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold overflow-hidden ring-4 ring-blue-100">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{formData.name?.charAt(0)?.toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow group-hover:bg-blue-700 transition-colors">
                      <FaCamera className="text-[10px]" />
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                  <p className="text-xs text-slate-400">Optional profile photo</p>
                </div>

                {/* Full name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input type="text" name="name" value={formData.name}
                      onChange={handleChange} placeholder="Your full name"
                      required className={inputClass} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input type="email" name="email" value={formData.email}
                      onChange={handleChange} placeholder="you@example.com"
                      required className={inputClass} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password" value={formData.password}
                      onChange={handleChange} placeholder="Enter your password"
                      required className={`${inputClass} pr-11`}
                    />
                    <button type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input type="password" name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange} placeholder="Repeat your password"
                      required className={inputClass} />
                  </div>
                </div>

                {/* Teacher-specific fields */}
                {role === 'teacher' && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Teacher Information
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Degree
                      </label>
                      <div className="relative">
                        <FaGraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input type="text" name="degree" value={teacherData.degree}
                          onChange={handleTeacherChange}
                          placeholder="e.g. M.Sc. Computer Science"
                          required={role === 'teacher'} className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Years of Teaching
                      </label>
                      <div className="relative">
                        <FaBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input type="number" name="yearsOfTeaching"
                          value={teacherData.yearsOfTeaching}
                          onChange={handleTeacherChange}
                          placeholder="e.g. 5" min="0" max="60"
                          required={role === 'teacher'} className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Experience Description
                        <span className="ml-2 font-normal normal-case text-slate-400">
                          ({teacherData.experienceDescription.length}/500)
                        </span>
                      </label>
                      <textarea name="experienceDescription"
                        value={teacherData.experienceDescription}
                        onChange={handleTeacherChange}
                        placeholder="Briefly describe your teaching background and expertise…"
                        required={role === 'teacher'} rows={3} maxLength={500}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm placeholder-slate-400 outline-none resize-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full py-3 mt-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                  {loading
                    ? <><FaSpinner className="animate-spin" /><span>Creating account…</span></>
                    : <span>Create {role === 'teacher' ? 'Teacher' : 'Student'} Account</span>
                  }
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Vidyalaya. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
};

export default Signup;

