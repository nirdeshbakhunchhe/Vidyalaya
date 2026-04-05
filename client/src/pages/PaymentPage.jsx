

// ── React & routing ───────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ── Auth & API ────────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../services/api';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaSpinner,
  FaArrowLeft,
  FaGraduationCap,
  FaClock,
  FaUsers,
  FaShieldAlt,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';

// =============================================================================
// PaymentPage
// =============================================================================
const PaymentPage = () => {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  // Both values are passed from CourseDetail via navigate('/payment', { state })
  const { enrollmentId, courseData } = state || {};

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError,   setPaymentError]   = useState('');

  // Guard: redirect to login if unauthenticated, or back to explore if state is missing
  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!enrollmentId || !courseData) navigate('/explore-courses', { replace: true });
  }, [user, enrollmentId, courseData, navigate]);

  if (!enrollmentId || !courseData) return null;

  // ── Payment handler (logic unchanged) ──────────────────────────────────────
  const handleKhaltiPayment = async () => {
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const response = await paymentAPI.initiate(enrollmentId);
      if (response?.data?.payment_url) {
        // Hand off to Khalti's hosted checkout — they redirect back to /payment/verify
        window.location.href = response.data.payment_url;
      } else {
        setPaymentError('Could not get payment URL from Khalti. Please try again.');
        setPaymentLoading(false);
      }
    } catch (err) {
      setPaymentError(
        err.response?.data?.message || err.message || 'Something went wrong. Please try again.'
      );
      setPaymentLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm transition-colors focus:outline-none focus:underline"
        >
          <FaArrowLeft /><span>Back to Course</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center gap-3 mb-1">
              <FaGraduationCap className="text-2xl" />
              <h1 className="text-xl font-bold">Complete Enrollment</h1>
            </div>
            <p className="text-blue-100 text-sm">
              Your teacher approved your request! Pay to start learning.
            </p>
          </div>

          <div className="p-6 space-y-6">

            {/* Course summary card */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {courseData.thumbnail && (
                <img
                  src={courseData.thumbnail}
                  alt={courseData.title}
                  className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2">
                  {courseData.title}
                </h2>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {courseData.duration && (
                    <span className="flex items-center gap-1">
                      <FaClock className="text-blue-400" />{courseData.duration}
                    </span>
                  )}
                  {courseData.enrollmentCount != null && (
                    <span className="flex items-center gap-1">
                      <FaUsers className="text-blue-400" />
                      {Number(courseData.enrollmentCount).toLocaleString()} students
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Course fee</span>
                <span>NPR {Number(courseData.price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform fee</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                <span>Total</span>
                <span className="text-blue-700 text-lg">
                  NPR {Number(courseData.price).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Benefit checklist */}
            <div className="space-y-2">
              {[
                'Full lifetime access to course content',
                'AI Tutor support available 24/7',
                'Certificate of completion',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <FaCheckCircle className="text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Error banner */}
            {paymentError && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"
              >
                <FaExclamationCircle className="flex-shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handleKhaltiPayment}
              disabled={paymentLoading}
              className={[
                'w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2',
                'transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
                paymentLoading
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-95',
              ].join(' ')}
            >
              {paymentLoading ? (
                <><FaSpinner className="animate-spin" /><span>Redirecting to Khalti…</span></>
              ) : (
                <><FaLock className="text-sm" /><span>Pay NPR {Number(courseData.price).toLocaleString()} via Khalti</span></>
              )}
            </button>

            {/* Security note */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <FaShieldAlt /><span>256-bit SSL encrypted · Powered by Khalti</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
