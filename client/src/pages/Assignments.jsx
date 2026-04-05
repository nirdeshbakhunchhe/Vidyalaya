// Assignments.jsx

// ── React & auth ──────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
// (no direct auth usage needed here; StudentShell handles protected layout)

// ── Layout shell ──────────────────────────────────────────────────────────────
import StudentShell from '../components/StudentShell';

// ── API ───────────────────────────────────────────────────────────────────────
import { assignmentAPI } from '../services/api';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTrophy,
  FaFileUpload,
  FaChevronRight,
  FaChevronLeft,
  FaTimes,
  FaCheck,
  FaStar,
  FaCalendarAlt,
  FaPlay,
  FaAward,
} from 'react-icons/fa';

// =============================================================================
// Assignments data is loaded from the backend API.
// =============================================================================

// Tab definitions for the list view
const TABS = [
  { id: 'pending',   label: 'Pending'   },
  { id: 'completed', label: 'Submitted' },
  { id: 'graded',    label: 'Graded'    },
];

// =============================================================================
// Sub-components
// =============================================================================

// ── StatusBadge ───────────────────────────────────────────────────────────────
// Pill badge rendered on each assignment card and in the detail header.
const STATUS_CONFIG = {
  pending:   { icon: FaClock,              label: 'Pending',   pill: 'bg-blue-100   text-blue-600'  },
  overdue:   { icon: FaExclamationTriangle,label: 'Overdue',   pill: 'bg-red-100    text-red-600'   },
  completed: { icon: FaCheckCircle,        label: 'Submitted', pill: 'bg-yellow-100 text-yellow-700' },
  graded:    { icon: FaTrophy,             label: 'Graded',    pill: 'bg-green-100  text-green-700' },
};

const StatusBadge = ({ status }) => {
  const cfg  = STATUS_CONFIG[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}>
      <Icon className="text-[10px]" />{cfg.label}
    </span>
  );
};

// =============================================================================
// Assignments
// =============================================================================
const Assignments = () => {
  // Loading + list state
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState('');

  const [activeTab,           setActiveTab]           = useState('pending');
  const [selectedAssignment,  setSelectedAssignment]  = useState(null);
  const [quizMode,            setQuizMode]            = useState(false);
  const [currentQuestion,     setCurrentQuestion]     = useState(0);
  const [quizAnswers,         setQuizAnswers]         = useState({});
  const [quizSubmitted,       setQuizSubmitted]       = useState(false);
  const [quizScore,           setQuizScore]           = useState(0);
  const [uploadedFile,        setUploadedFile]        = useState(null);

  const refreshAssignments = async () => {
    setLoadingAssignments(true);
    setAssignmentsError('');
    try {
      const data = await assignmentAPI.getMyAssignments();
      setAssignments(data?.assignments || []);
    } catch (err) {
      setAssignmentsError(err?.response?.data?.message || err.message || 'Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    refreshAssignments();
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === 'pending')   return a.status === 'pending' || a.status === 'overdue';
    if (activeTab === 'completed') return a.status === 'completed';
    if (activeTab === 'graded')    return a.status === 'graded';
    return true;
  });

  const stats = {
    pending:      assignments.filter((a) => a.status === 'pending').length,
    overdue:      assignments.filter((a) => a.status === 'overdue').length,
    completed:    assignments.filter((a) => a.status === 'completed').length,
    graded:       assignments.filter((a) => a.status === 'graded').length,
    averageGrade: (() => {
      const graded = assignments.filter((a) => a.grade != null);
      if (!graded.length) return 0;
      return graded.reduce((sum, a) => sum + (a.grade / a.points) * 100, 0) / graded.length;
    })(),
  };

  // ── Quiz handlers ───────────────────────────────────────────────────────────
  const startQuiz = (assignment) => {
    setSelectedAssignment(assignment);
    setQuizMode(true);
    setCurrentQuestion(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleAnswerSelect = (questionKey, answerIndex) => {
    setQuizAnswers((prev) => ({ ...prev, [questionKey]: answerIndex }));
  };

  const submitQuiz = async () => {
    if (!selectedAssignment?.id) return;
    const answers = (selectedAssignment.questions || []).map((q, idx) => {
      const key = String(q.id ?? q._id ?? idx);
      return { questionId: key, selectedIndex: quizAnswers[key] };
    });

    try {
      const resp = await assignmentAPI.submitQuiz(selectedAssignment.id, answers);
      const submission = resp?.submission;
      const correctCount = resp?.correctCount;
      const grade = resp?.grade ?? submission?.score ?? null;
      const feedback = submission?.feedback ?? null;

      if (submission?.status === 'graded') {
        setSelectedAssignment((prev) => ({
          ...prev,
          status: 'graded',
          grade,
          feedback,
        }));
      }

      setQuizScore(correctCount ?? 0);
      setQuizSubmitted(true);
    } catch (err) {
      setAssignmentsError(err?.response?.data?.message || err.message || 'Quiz submission failed');
    }
  };

  // ── File / project handlers ─────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const submitAssignment = async () => {
    if (!selectedAssignment?.id || !uploadedFile) return;
    try {
      await assignmentAPI.submitProject(selectedAssignment.id, uploadedFile);
    } catch (err) {
      setAssignmentsError(err?.response?.data?.message || err.message || 'Submission failed');
      return;
    }
    setSelectedAssignment(null);
    setUploadedFile(null);
    await refreshAssignments();
  };

  // ── Quiz view ───────────────────────────────────────────────────────────────
  if (quizMode && selectedAssignment) {
    const totalQ    = selectedAssignment.questions.length;

    // Results screen shown after submission
    if (quizSubmitted) {
      const pct = Math.round((quizScore / totalQ) * 100);
      return (
        <StudentShell>
          <div className="flex items-center justify-center py-16 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 text-center p-10">
              <div className={`w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center ${pct >= 60 ? 'bg-green-100' : 'bg-red-100'}`}>
                {pct >= 60
                  ? <FaAward  className="text-4xl text-green-500" />
                  : <FaTimes  className="text-4xl text-red-400"   />
                }
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Quiz Complete!</h2>
              <p className="text-slate-500 text-sm mb-6">{selectedAssignment.title}</p>
              <div className={`text-5xl font-black mb-2 ${pct >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                {pct}%
              </div>
              <p className="text-slate-500 text-sm mb-8">
                {quizScore} out of {totalQ} correct
              </p>
              <button
                onClick={async () => {
                  setQuizMode(false);
                  setSelectedAssignment(null);
                  setQuizSubmitted(false);
                  setQuizScore(0);
                  setQuizAnswers({});
                  await refreshAssignments();
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Back to Assignments
              </button>
            </div>
          </div>
        </StudentShell>
      );
    }

    // Active quiz question
    const currentQ = selectedAssignment.questions[currentQuestion];
    const currentQKey = String(currentQ?.id ?? currentQ?._id ?? currentQuestion);
    const progress = ((currentQuestion + 1) / totalQ) * 100;

    return (
      <StudentShell>
        <div className="flex items-center justify-center py-8 px-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">

            {/* Quiz header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">{selectedAssignment.title}</h2>
                <button
                  onClick={() => setQuizMode(false)}
                  aria-label="Exit quiz"
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex items-center justify-between text-sm text-white/90 mb-3">
                <span>Question {currentQuestion + 1} of {totalQ}</span>
                <span className="flex items-center gap-1.5">
                  <FaClock className="text-xs" />{selectedAssignment.duration}
                </span>
              </div>
              {/* Progress track */}
              <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={currentQuestion + 1}
                  aria-valuemax={totalQ}
                />
              </div>
            </div>

            {/* Question */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">{currentQ.question}</h3>
              <div className="space-y-3">
                {currentQ.options.map((option, index) => {
                  const selected = quizAnswers[currentQKey] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQKey, index)}
                      className={[
                        'w-full p-4 text-left rounded-xl border-2 transition-all focus:outline-none',
                        selected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/40',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-3">
                        {/* Radio dot */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                          }`}
                        >
                          {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-slate-800 text-sm">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <FaChevronLeft className="text-xs" /><span>Previous</span>
                </button>

                {currentQuestion === totalQ - 1 ? (
                  <button
                    onClick={submitQuiz}
                    className="flex items-center gap-2 px-7 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all shadow focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <FaCheck /><span>Submit Quiz</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion((q) => Math.min(totalQ - 1, q + 1))}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <span>Next</span><FaChevronRight className="text-xs" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </StudentShell>
    );
  }

  // ── Assignment detail view ──────────────────────────────────────────────────
  if (selectedAssignment && !quizMode) {
    return (
      <StudentShell>
        <div className="flex items-center justify-center py-8 px-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">

            {/* Detail header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-8">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-2xl font-bold leading-tight pr-4">{selectedAssignment.title}</h2>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  aria-label="Close detail"
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none flex-shrink-0"
                >
                  <FaTimes />
                </button>
              </div>
              <p className="text-white/90 mb-4 text-sm">{selectedAssignment.course}</p>
              <div className="flex flex-wrap gap-2 text-sm">
                {selectedAssignment.dueDate && (
                  <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
                    <FaCalendarAlt className="text-xs" />
                    Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                  </span>
                )}
                {selectedAssignment.duration && (
                  <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
                    <FaClock className="text-xs" />{selectedAssignment.duration}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
                  <FaStar className="text-xs" />{selectedAssignment.points} points
                </span>
              </div>
            </div>

            {/* Detail body */}
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{selectedAssignment.description}</p>
              </div>

              {/* Start quiz CTA */}
              {selectedAssignment.type === 'quiz' &&
                (selectedAssignment.status === 'pending' || selectedAssignment.status === 'overdue') && (
                <button
                  onClick={() => startQuiz(selectedAssignment)}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold transition-all shadow flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <FaPlay className="text-sm" /><span>Start Quiz</span>
                </button>
              )}

              {/* Project submission */}
              {selectedAssignment.type === 'project' &&
                (selectedAssignment.status === 'pending' || selectedAssignment.status === 'overdue') && (
                <div className="space-y-5">
                  {selectedAssignment.requirements && (
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-3">Requirements</h3>
                      <ul className="space-y-1.5">
                        {selectedAssignment.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <FaCheckCircle className="text-green-500 text-xs mt-0.5 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* File drop zone */}
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.zip"
                  />
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-300 transition-colors">
                    {uploadedFile ? (
                      <div>
                        <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-3" />
                        <p className="text-slate-700 font-semibold text-sm mb-2">{uploadedFile.name}</p>
                        <button
                          onClick={() => setUploadedFile(null)}
                          className="text-red-500 hover:text-red-600 text-xs underline focus:outline-none"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        <FaFileUpload className="text-4xl text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-400">PDF, DOC, ZIP (max 10 MB)</p>
                      </label>
                    )}
                  </div>

                  <button
                    onClick={submitAssignment}
                    disabled={!uploadedFile}
                    className="w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600 text-white shadow"
                  >
                    <FaCheckCircle className="text-sm" /><span>Submit Assignment</span>
                  </button>
                </div>
              )}

              {/* Grade display */}
              {selectedAssignment.grade != null && (
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900">Your Grade</h3>
                    <div className="text-2xl font-black text-green-600">
                      {selectedAssignment.grade}/{selectedAssignment.points}
                      <span className="text-base font-semibold ml-2 text-green-500">
                        ({((selectedAssignment.grade / selectedAssignment.points) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  {selectedAssignment.feedback && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Instructor Feedback
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">{selectedAssignment.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </StudentShell>
    );
  }

  // ── Main list view ──────────────────────────────────────────────────────────
  return (
    <StudentShell>
      <div className="py-8 px-4 sm:px-6">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <FaClipboardList className="text-blue-500" />
            My Assignments & Quizzes
          </h1>
          <p className="text-slate-500 text-sm mt-1">Complete your assignments and track your progress</p>
        </div>

        {assignmentsError && (
          <div
            role="alert"
            className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl"
          >
            {assignmentsError}
          </div>
        )}

        {loadingAssignments ? (
          <div className="flex items-center justify-center mb-8 py-10">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          /* Stats row */
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Pending',   value: stats.pending,                   icon: FaClock,              color: 'text-blue-500'   },
              { label: 'Overdue',   value: stats.overdue,                   icon: FaExclamationTriangle, color: 'text-red-500'    },
              { label: 'Submitted', value: stats.completed,                 icon: FaCheckCircle,         color: 'text-yellow-500' },
              { label: 'Graded',    value: stats.graded,                    icon: FaTrophy,              color: 'text-green-500'  },
              { label: 'Avg Grade', value: `${stats.averageGrade.toFixed(0)}%`, icon: FaStar,           color: 'text-blue-500'   },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500">{label}</p>
                  <Icon className={`text-sm ${color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-pressed={activeTab === id}
              className={[
                'px-5 py-2.5 font-semibold rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400',
                activeTab === id
                  ? 'bg-blue-500 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Assignment list */}
        <div className="space-y-3">
          {loadingAssignments ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
              <FaClipboardList className="text-5xl text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">No assignments in this category</p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              /* Semantically a button so it's keyboard-accessible */
              <button
                key={assignment.id}
                onClick={() => setSelectedAssignment(assignment)}
                className="w-full text-left bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all border border-slate-200 hover:border-blue-300 group focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {assignment.title}
                      </h3>
                      <StatusBadge status={assignment.status} />
                    </div>
                    <p className="text-slate-500 text-sm mb-3">{assignment.course}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      {assignment.dueDate && (
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt />Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {assignment.duration && (
                        <span className="flex items-center gap-1">
                          <FaClock />{assignment.duration}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FaStar />{assignment.points} pts
                      </span>
                      {assignment.type === 'quiz' && assignment.totalQuestions && (
                        <span className="flex items-center gap-1">
                          <FaClipboardList />{assignment.totalQuestions} questions
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {assignment.grade != null && (
                      <span className="text-base font-bold text-green-600">
                        {((assignment.grade / assignment.points) * 100).toFixed(0)}%
                      </span>
                    )}
                    <FaChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors text-sm" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </StudentShell>
  );
};

export default Assignments;