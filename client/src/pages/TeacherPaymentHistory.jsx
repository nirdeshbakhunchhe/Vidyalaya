// TeacherPaymentHistory.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── API ───────────────────────────────────────────────────────────────────────
import { paymentAPI } from '../services/api';

// ── Shell components ──────────────────────────────────────────────────────────
import DashboardNav from './DashboardNav';
import TeacherSidebar from '../components/TeacherSidebar';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaSpinner,
  FaReceipt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUserGraduate,
  FaExclamationCircle,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Status display metadata — module-level constant (not a useMemo with no deps).
// Consistent with StudentPaymentHistory's STATUS_META.
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_META = {
  completed: { label: 'Completed', icon: FaCheckCircle, pill: 'bg-green-100 text-green-700' },
  pending:   { label: 'Pending',   icon: FaClock,       pill: 'bg-amber-100 text-amber-700' },
  failed:    { label: 'Failed',    icon: FaTimesCircle, pill: 'bg-red-100   text-red-700'   },
};

// =============================================================================
// TeacherPaymentHistory
// Lists payments received for courses created by the logged-in teacher.
// Allows downloading a PDF payment record per completed payment.
// =============================================================================
const TeacherPaymentHistory = () => {
  const navigate = useNavigate();

  const [payments,      setPayments]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  // Fetch teacher's payment history on mount (API call unchanged)
  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await paymentAPI.teacherHistory();
        setPayments(data.payments || []);
      } catch (err) {
        setPayments([]);
        setError(err.response?.data?.message || 'Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  // ── PDF download ────────────────────────────────────────────────────────────
  // Creates a temporary anchor, triggers download, cleans up the object URL.
  const downloadPdf = async (payment) => {
    try {
      setDownloadingId(payment._id);
      const blob   = await paymentAPI.downloadTeacherReceipt(payment._id);
      const url    = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href  = url;
      anchor.download = `vidyalaya-payment-record-${payment.transactionId || payment.pidx || payment._id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <DashboardNav activePage="/teacher/payments" />

      <div className="flex flex-1 overflow-hidden">
        <TeacherSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

              {/* Section header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Payments received for your courses via Khalti.
                </p>
              </div>

              {/* ── Loading ── */}
              {loading && (
                <div className="flex justify-center py-12">
                  <FaSpinner className="text-2xl text-amber-500 animate-spin" />
                </div>
              )}

              {/* ── Error banner ── */}
              {!loading && error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm"
                >
                  <FaExclamationCircle className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ── Empty state ── */}
              {!loading && !error && payments.length === 0 && (
                <div className="text-center py-12">
                  <FaReceipt className="text-4xl text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No payments found yet.</p>
                </div>
              )}

              {/* ── Payment list ── */}
              {!loading && !error && payments.length > 0 && (
                <div className="space-y-3">
                  {payments.map((p) => {
                    const meta          = STATUS_META[p.status] || STATUS_META.pending;
                    const StatusIcon    = meta.icon;
                    const paidDate      = p.paidAt || p.updatedAt || p.createdAt;
                    const isDownloading = downloadingId === p._id;

                    return (
                      <div
                        key={p._id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors"
                      >
                        {/* Course + student info */}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {p.course?.title || 'Course'}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {/* Student name with icon */}
                            <span className="inline-flex items-center gap-1">
                              <FaUserGraduate className="text-amber-500" />
                              {p.student?.name || 'Student'}
                            </span>

                            <span>NPR {Number(p.amount || 0).toLocaleString()}</span>

                            {/* Status pill */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${meta.pill}`}>
                              <StatusIcon className="text-[11px]" />
                              {meta.label}
                            </span>

                            {paidDate && (
                              <span>{new Date(paidDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">

                          {/* View course */}
                          <button
                            onClick={() => p.course?._id && navigate(`/course/${p.course._id}`)}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                          >
                            View
                          </button>

                          {/* Download PDF — only for completed payments */}
                          <button
                            disabled={p.status !== 'completed' || isDownloading}
                            onClick={() => downloadPdf(p)}
                            title={
                              p.status !== 'completed'
                                ? 'PDF available for completed payments only'
                                : 'Download PDF record'
                            }
                            className="px-3 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
                          >
                            {isDownloading
                              ? <FaSpinner className="animate-spin" />
                              : <FaReceipt />
                            }
                            Receipt
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherPaymentHistory;
