import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RESEND_INTERVAL_SECONDS = 60;

const OtpVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtpAndLogin } = useAuth();

  const initialEmail = location.state?.email || '';
  const initialContext = location.state?.from || 'signup'; // 'signup' | 'forgotPassword'

  const [email] = useState(initialEmail);
  const [context] = useState(initialContext);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_INTERVAL_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!email) return;
    setSecondsLeft(RESEND_INTERVAL_SECONDS);
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [email]);

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  if (!email) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!/^\d{6}$/.test(otp)) {
      return setError('Please enter a valid 6‑digit OTP.');
    }

    setLoading(true);
    try {
      if (context === 'signup') {
        await verifyOtpAndLogin(email, otp);
        setSuccess('Email verified successfully!');
        navigate('/dashboard', { replace: true });
      } else if (context === 'forgotPassword' && location.state?.pendingNewPassword) {
        await authAPI.resetPasswordWithOtp(
          email,
          otp,
          location.state.pendingNewPassword
        );
        setSuccess('Password reset successfully. You can now log in.');
        navigate('/login', { replace: true });
      } else {
        setError('Invalid verification context.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to verify OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || resendLoading) return;
    setError('');
    setSuccess('');
    setResendLoading(true);
    try {
      if (context === 'signup') {
        await authAPI.resendSignupOtp(email);
      } else if (context === 'forgotPassword') {
        await authAPI.forgotPassword(email);
      }
      setSuccess('A new OTP has been sent to your email.');
      setSecondsLeft(RESEND_INTERVAL_SECONDS);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to resend OTP. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  const heading =
    context === 'signup'
      ? 'Verify your email'
      : 'Verify OTP to reset password';

  const description =
    context === 'signup'
      ? `We’ve sent a 6‑digit verification code to ${email}.`
      : `We’ve sent a 6‑digit reset code to ${email}.`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {heading}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {description} The code expires in 5 minutes.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Enter 6‑digit OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="w-full text-center tracking-[0.5em] text-lg font-semibold px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                  placeholder="••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500">
              {secondsLeft > 0 ? (
                <span>
                  You can resend a new code in{' '}
                  <strong>{secondsLeft}s</strong>.
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
                >
                  {resendLoading ? 'Resending…' : 'Resend OTP'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OtpVerification;

