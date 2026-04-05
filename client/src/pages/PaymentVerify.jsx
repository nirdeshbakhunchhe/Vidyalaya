// PaymentVerify.jsx
//
// Khalti redirects here after checkout: /payment/verify?pidx=xxxx
//
// Flow:
//   1. Extract ?pidx from the URL
//   2. POST to paymentAPI.verify(pidx) — backend does the authoritative lookup
//   3. Backend marks enrollment as 'enrolled' and returns payment details
//   4. Success → show receipt + auto-redirect to /my-courses after 3 seconds
//   5. Failure → show error with recovery options

// ── React & routing ───────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ── Auth & API ────────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../services/api';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHome,
  FaGraduationCap,
  FaCreditCard,
  FaShieldAlt,
  FaArrowRight,
} from 'react-icons/fa';

// =============================================================================
// PaymentVerify
// =============================================================================
const PaymentVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 'verifying' → 'success' | 'error'
  const [status,         setStatus]         = useState('verifying');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [errorMsg,       setErrorMsg]       = useState('');
  const [progress,       setProgress]       = useState(0);

  // Animate the progress bar while the API call is in flight.
  // Caps at 85% to leave room for the final 100% jump on success.
  useEffect(() => {
    if (status !== 'verifying') return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) { clearInterval(interval); return 85; }
        return p + 14;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [status]);

  // ── Verification effect — runs exactly once on mount ───────────────────────
  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }

    const verify = async () => {
      const pidx = new URLSearchParams(location.search).get('pidx');

      if (!pidx) {
        setStatus('error');
        setErrorMsg('No payment ID found in URL. Please contact support.');
        return;
      }

      try {
        // paymentAPI.verify POSTs { pidx } to /api/payments/verify
        const data = await paymentAPI.verify(pidx);
        setProgress(100);

        if (data.status === 'Completed') {
          setStatus('success');
          setPaymentDetails({
            amount:        data.total_amount / 100, // paisa → NPR
            transactionId: data.transaction_id || 'N/A',
            method:        'Khalti',
            paidAt:        new Date(),
            courseId:      data.courseId,
          });
          // Auto-redirect to My Courses after 3 seconds
          setTimeout(() => navigate('/my-courses', { replace: true }), 3000);
        } else {
          setStatus('error');
          setErrorMsg(
            `Payment was not completed (Khalti status: "${data.status}"). ` +
            `Your enrollment request is still saved — go back to the course to try again.`
          );
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg(
          err.response?.data?.message ||
          'Payment verification failed. If money was deducted from your Khalti wallet, please contact support.'
        );
      }
    };

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs exactly once

  // ── Header gradient changes with status ────────────────────────────────────
  const headerGradient =
    status === 'success' ? 'from-blue-600 to-indigo-700'
    : status === 'error' ? 'from-red-500 to-orange-500'
    :                      'from-blue-500 to-indigo-600';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Status header */}
          <div className={`bg-gradient-to-r ${headerGradient} p-6 text-white text-center`}>
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center shadow-md mb-4 ${
              status === 'verifying' ? 'bg-white/20' : 'bg-white'
            }`}>
              {status === 'verifying' && <FaSpinner className="text-white text-3xl animate-spin" />}
              {status === 'success'   && <FaCheckCircle className="text-blue-600 text-4xl" />}
              {status === 'error'     && <FaExclamationTriangle className="text-red-500 text-4xl" />}
            </div>
            <h2 className="text-2xl font-bold">
              {status === 'verifying' && 'Verifying your payment…'}
              {status === 'success'   && 'Payment Successful!'}
              {status === 'error'     && 'Payment Not Completed'}
            </h2>
            <p className="mt-1 text-sm opacity-90">
              {status === 'verifying' && 'Do not close this window.'}
              {status === 'success'   && 'You are now enrolled in the course.'}
              {status === 'error'     && 'Your enrollment request is still saved.'}
            </p>
          </div>

          <div className="p-6">

            {/* ── Verifying state ─────────────────────────────────────────── */}
            {status === 'verifying' && (
              <div className="text-center space-y-6">
                {/* Progress track — uses slate-100 consistent with the rest of the app */}
                <div
                  className="w-full bg-slate-100 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Step indicators */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: FaCreditCard,  label: 'Processing', muted: false },
                    { icon: FaShieldAlt,   label: 'Verifying',  muted: false },
                    { icon: FaArrowRight,  label: 'Enrolling',  muted: true  },
                  ].map(({ icon: Icon, label, muted }) => (
                    <div key={label} className={`rounded-lg p-3 text-center ${muted ? 'bg-slate-50' : 'bg-blue-50'}`}>
                      <div className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center mb-1 ${muted ? 'bg-slate-100' : 'bg-blue-100'}`}>
                        <Icon className={muted ? 'text-slate-400' : 'text-blue-600'} />
                      </div>
                      <p className={`text-xs font-medium ${muted ? 'text-slate-400' : 'text-blue-600'}`}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-500">
                  This usually takes less than a minute. Do not press back or refresh.
                </p>
              </div>
            )}

            {/* ── Success state ────────────────────────────────────────────── */}
            {status === 'success' && (
              <div className="space-y-5">
                {paymentDetails && (
                  <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Paid</span>
                      <span className="font-bold text-blue-700">
                        NPR {Number(paymentDetails.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction ID</span>
                      <span className="font-medium text-slate-700 text-right break-all ml-4">
                        {paymentDetails.transactionId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method</span>
                      <span className="font-medium text-slate-700">{paymentDetails.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="font-medium text-slate-700">
                        {paymentDetails.paidAt?.toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <span className="inline-block rounded-full bg-blue-100 text-blue-800 px-4 py-1 text-xs animate-pulse">
                    Redirecting to My Courses in 3 seconds…
                  </span>
                </div>

                <button
                  onClick={() => navigate('/my-courses')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  <FaGraduationCap /><span>Go to My Courses Now</span>
                </button>
              </div>
            )}

            {/* ── Error state ──────────────────────────────────────────────── */}
            {status === 'error' && (
              <div
                role="alert"
                className="space-y-5"
              >
                <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 text-sm text-red-700">
                  {errorMsg}
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-700 mb-2">What you can do:</p>
                  <ul className="space-y-1 list-disc list-inside text-xs">
                    <li>Go back to the course and click "Pay Now" again</li>
                    <li>Check your Khalti wallet to see if money was deducted</li>
                    <li>Contact support if money was deducted but you're not enrolled</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/explore-courses')}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Back to Courses
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <FaHome /><span>Home</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center mt-4 text-xs text-slate-400">
          {status === 'error'
            ? 'Need help? Contact our support team.'
            : 'Secured by Khalti · Vidyalaya'}
        </p>
      </div>
    </div>
  );
};

export default PaymentVerify;
