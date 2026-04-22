
import { useNavigate, useLocation } from 'react-router-dom';

// ── Icons (react-icons/fa only) ───────────────────────────
import {
  FaCheckCircle,
  FaGraduationCap,
  FaHome,
  FaReceipt,
  FaCalendarCheck,
  FaCreditCard,
  FaClock,
} from 'react-icons/fa';

// =============================================================================
// PaymentSuccess
// =============================================================================
const PaymentSuccess = () => {
  const navigate = useNavigate();
  const pd       = useLocation().state?.paymentDetails;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">

          {/* Success header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
            <div className="mx-auto w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-md mb-4">
              <FaCheckCircle className="text-blue-600 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold">Payment Successful!</h2>
            <p className="mt-1 text-blue-100 text-sm">You're now enrolled. Happy learning!</p>
          </div>

          <div className="p-6 space-y-6">

            {/* Payment details table — only shown when details are available */}
            {pd ? (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm divide-y divide-slate-200">
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <div className="p-3">
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <FaCreditCard className="mr-1" />Method
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{pd.method || 'Khalti'}</p>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <FaCalendarCheck className="mr-1" />Date
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {pd.paidAt
                        ? new Date(pd.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <div className="p-3">
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <FaReceipt className="mr-1" />Transaction ID
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 break-all text-xs">
                      {pd.transactionId || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <FaClock className="mr-1" />Status
                    </div>
                    <p className="font-medium text-blue-600">Completed</p>
                  </div>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Total Paid</span>
                  <span className="text-xl font-bold text-blue-700">
                    NPR {pd.amount ? Number(pd.amount).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            ) : (
              /* Fallback when no payment details are available in state */
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 text-center">
                Payment processed. Check your email for the receipt.
              </div>
            )}

            {/* Enrollment confirmation note */}
            <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg p-3 text-sm text-blue-700">
              Your enrollment is confirmed. Start learning right away from My Courses!
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/my-courses')}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                <FaGraduationCap /><span>Go to My Courses</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <FaHome /><span>Home</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-4 text-xs text-slate-400">
          Questions? Contact our support team.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
