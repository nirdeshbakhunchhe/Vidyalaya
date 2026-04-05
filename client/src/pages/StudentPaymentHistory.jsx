// StudentPaymentHistory.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── API ───────────────────────────────────────────────────────────────────────
import { paymentAPI } from '../services/api';

// ── Layout shell ──────────────────────────────────────────────────────────────
import StudentShell from '../components/StudentShell';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaSpinner,
  FaReceipt,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationCircle,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Status display metadata — defined at module level (not inside the component)
// since it never changes and does not depend on any props or state.
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_META = {
  completed: {
    label: 'Completed',
    icon:  FaCheckCircle,
    pill:  'bg-green-100 text-green-700',
  },
  pending: {
    label: 'Pending',
    icon:  FaClock,
    pill:  'bg-amber-100 text-amber-700',
  },
  failed: {
    label: 'Failed',
    icon:  FaTimesCircle,
    pill:  'bg-red-100 text-red-700',
  },
};

// =============================================================================
// StudentPaymentHistory
// Lists the student's Khalti payment records and allows PDF receipt download.
// =============================================================================
const StudentPaymentHistory = () => {
  const navigate = useNavigate();

  const [payments,      setPayments]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  // Fetch payment history on mount (API call unchanged)
  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await paymentAPI.history();
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

  // ── Receipt download ────────────────────────────────────────────────────────
  // Creates a temporary anchor element, triggers the browser download, then
  // cleans up the object URL to avoid memory leaks.
  const downloadReceipt = async (payment) => {
    try {
      setDownloadingId(payment._id);
      const blob     = await paymentAPI.downloadReceipt(payment._id);
      const url      = window.URL.createObjectURL(blob);
      const anchor   = document.createElement('a');
      anchor.href    = url;
      anchor.download = `vidyalaya-receipt-${payment.transactionId || payment.pidx || payment._id}.pdf`;
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
    <StudentShell>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
          <p className="text-sm text-slate-500 mt-1">
            All payments you made for paid courses via Khalti.
          </p>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center py-12">
            <FaSpinner className="text-2xl text-blue-500 animate-spin" />
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
              // Fall back to 'pending' if the status value is unexpected
              const meta       = STATUS_META[p.status] || STATUS_META.pending;
              const StatusIcon = meta.icon;
              const paidDate   = p.paidAt || p.updatedAt || p.createdAt;
              const isDownloading = downloadingId === p._id;

              return (
                <div
                  key={p._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors"
                >
                  {/* Course info + meta */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {p.course?.title || 'Course'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>NPR {Number(p.amount || 0).toLocaleString()}</span>

                      {/* Status pill with icon */}
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
                      <FaExternalLinkAlt className="text-xs" />
                      View
                    </button>

                    {/* Download receipt — only available for completed payments */}
                    <button
                      disabled={p.status !== 'completed' || isDownloading}
                      onClick={() => downloadReceipt(p)}
                      title={
                        p.status !== 'completed'
                          ? 'Receipt available for completed payments only'
                          : 'Download PDF receipt'
                      }
                      className="px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
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
    </StudentShell>
  );
};

export default StudentPaymentHistory;
