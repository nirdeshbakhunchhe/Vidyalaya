import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { assignmentAPI, courseAPI } from '../services/api';
import DashboardNav from './DashboardNav';
import TeacherSidebar from '../components/TeacherSidebar';

import { useAuth } from '../context/AuthContext';

import {
  FaSpinner,
  FaPlus,
  FaTimes,
  FaClipboardList,
  FaCheckCircle,
  FaExclamationCircle,
  FaFileUpload,
  FaSave,
} from 'react-icons/fa';

const PageShell = ({ children, activePath }) => (
  <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
    <DashboardNav activePage={activePath} />
    <div className="flex flex-1 overflow-hidden">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  </div>
);

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState([]);

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [createForm, setCreateForm] = useState({
    courseId: '',
    type: 'quiz',
    title: '',
    description: '',
    dueAt: '',
    duration: '',
    points: 0,
    questions: [{ question: '', options: ['', ''], correctAnswer: 0 }],
    requirements: [''],
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const activePath = '/teacher/assignments';

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [aData, cData] = await Promise.all([
        assignmentAPI.getTeacherAssignments(),
        courseAPI.getCreatedCourses(),
      ]);
      setTeacherAssignments(aData?.assignments || []);
      setTeacherCourses(cData?.courses || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load');
      setTeacherAssignments([]);
      setTeacherCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadSubmissions = async (assignment) => {
    if (!assignment?.id) return;
    setSelectedAssignment(assignment);
    setLoadingSubmissions(true);
    setSubmissions([]);
    try {
      const data = await assignmentAPI.getSubmissions(assignment.id);
      setSubmissions(data?.submissions || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const onChange = (k, v) => setCreateForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    setCreating(true);
    setCreateError('');
    try {
      const payload = {
        courseId: createForm.courseId,
        type: createForm.type,
        title: createForm.title,
        description: createForm.description,
        dueAt: createForm.dueAt ? new Date(createForm.dueAt).toISOString() : null,
        duration: createForm.duration,
        points: Number(createForm.points) || 0,
      };

      if (createForm.type === 'quiz') {
        if (!createForm.questions || createForm.questions.length === 0) {
          throw new Error('You must provide at least one quiz question.');
        }
        for (const q of createForm.questions) {
          if (!q.question.trim()) throw new Error('All questions must have a prompt.');
          if (q.options.some(opt => !opt.trim())) throw new Error('All options must be filled out.');
        }
        payload.questions = createForm.questions;
      } else {
        payload.requirements = createForm.requirements.filter(req => req.trim() !== '');
      }

      await assignmentAPI.createAssignment(payload);

      // Reset and reload.
      setCreateForm({
        courseId: createForm.courseId,
        type: 'quiz',
        title: '',
        description: '',
        dueAt: '',
        duration: '',
        points: 0,
        questions: [{ question: '', options: ['', ''], correctAnswer: 0 }],
        requirements: [''],
      });

      await loadAll();
    } catch (err) {
      setCreateError(err?.message || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const gradeOne = async (submissionId, grade, feedback) => {
    if (!selectedAssignment?.id || !submissionId) return;
    await assignmentAPI.gradeSubmission(selectedAssignment.id, submissionId, { grade, feedback });
    await loadSubmissions(selectedAssignment);
  };

  const courseLabel = useMemo(() => {
    const map = new Map(teacherCourses.map((c) => [String(c.id), c.title]));
    return map;
  }, [teacherCourses]);

  if (loading) {
    return (
      <PageShell activePath={activePath}>
        <div className="flex items-center justify-center py-24">
          <FaSpinner className="animate-spin text-3xl text-sky-500" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell activePath={activePath}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FaClipboardList className="text-sky-500" />
              Teacher Assignments
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create quizzes/projects and grade student submissions.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Signed in as <span className="text-slate-700 dark:text-slate-300 font-semibold">{user?.name}</span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 text-sm px-4 py-3 rounded-xl"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaPlus className="text-amber-500" />
                Create Assignment
              </h2>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">Course</label>
                  <select
                    value={createForm.courseId}
                    onChange={(e) => onChange('courseId', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select course</option>
                    {teacherCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onChange('type', 'quiz')}
                    className={[
                      'flex-1 px-3 py-2 rounded-xl text-sm font-semibold border',
                      createForm.type === 'quiz'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 text-blue-700'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900',
                    ].join(' ')}
                  >
                    Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange('type', 'project')}
                    className={[
                      'flex-1 px-3 py-2 rounded-xl text-sm font-semibold border',
                      createForm.type === 'project'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 text-blue-700'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900',
                    ].join(' ')}
                  >
                    Project
                  </button>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">Title</label>
                  <input
                    value={createForm.title}
                    onChange={(e) => onChange('title', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">Points</label>
                  <input
                    type="number"
                    value={createForm.points}
                    onChange={(e) => onChange('points', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">Due date</label>
                  <input
                    type="date"
                    value={createForm.dueAt}
                    onChange={(e) => onChange('dueAt', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">Duration (display)</label>
                  <input
                    value={createForm.duration}
                    onChange={(e) => onChange('duration', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => onChange('description', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 min-h-[80px] text-slate-900 dark:text-white"
                  />
                </div>

                {createForm.type === 'quiz' ? (
                  <div className="space-y-4 pt-2">
                    <label className="font-semibold text-sm text-slate-800 dark:text-slate-200">Quiz Questions</label>
                    {createForm.questions.map((q, qIndex) => (
                      <div key={qIndex} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Question {qIndex + 1}</span>
                          {createForm.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newQ = [...createForm.questions];
                                newQ.splice(qIndex, 1);
                                onChange('questions', newQ);
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          value={q.question}
                          onChange={(e) => {
                            const newQ = [...createForm.questions];
                            newQ[qIndex].question = e.target.value;
                            onChange('questions', newQ);
                          }}
                          placeholder="Question prompt"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                        <div className="space-y-2">
                          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Options & Correct Answer</label>
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctAnswer === optIndex}
                                onChange={() => {
                                  const newQ = [...createForm.questions];
                                  newQ[qIndex].correctAnswer = optIndex;
                                  onChange('questions', newQ);
                                }}
                                className="text-blue-600 w-4 h-4 ml-1 cursor-pointer"
                              />
                              <input
                                value={opt}
                                onChange={(e) => {
                                  const newQ = [...createForm.questions];
                                  newQ[qIndex].options[optIndex] = e.target.value;
                                  onChange('questions', newQ);
                                }}
                                placeholder={`Option ${optIndex + 1}`}
                                className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                              />
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQ = [...createForm.questions];
                                    newQ[qIndex].options.splice(optIndex, 1);
                                    if (newQ[qIndex].correctAnswer >= newQ[qIndex].options.length) {
                                      newQ[qIndex].correctAnswer = Math.max(0, newQ[qIndex].options.length - 1);
                                    }
                                    onChange('questions', newQ);
                                  }}
                                  className="text-red-400 hover:text-red-600 px-2 flex-shrink-0"
                                  title="Remove Option"
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newQ = [...createForm.questions];
                              newQ[qIndex].options.push('');
                              onChange('questions', newQ);
                            }}
                            className="text-xs text-blue-600 font-semibold hover:underline mt-1 ml-6 flex items-center gap-1"
                          >
                            <FaPlus className="text-[10px]"/> Add Option
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        onChange('questions', [...createForm.questions, { question: '', options: ['', ''], correctAnswer: 0 }]);
                      }}
                      className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 font-semibold text-sm hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 flex items-center justify-center gap-2 transition-colors"
                    >
                      <FaPlus /> Add Question
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <label className="font-semibold text-sm text-slate-800 dark:text-slate-200">Project Requirements</label>
                    {createForm.requirements.map((req, reqIndex) => (
                      <div key={reqIndex} className="flex gap-2 items-start">
                        <textarea
                          value={req}
                          onChange={(e) => {
                            const newReqs = [...createForm.requirements];
                            newReqs[reqIndex] = e.target.value;
                            onChange('requirements', newReqs);
                          }}
                          placeholder={`Requirement ${reqIndex + 1}`}
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 min-h-[60px] resize-y text-slate-900 dark:text-white"
                        />
                        {createForm.requirements.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newReqs = [...createForm.requirements];
                              newReqs.splice(reqIndex, 1);
                              onChange('requirements', newReqs);
                            }}
                            className="text-red-400 hover:text-red-600 p-2 mt-1"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        onChange('requirements', [...createForm.requirements, '']);
                      }}
                      className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 font-semibold text-sm hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 flex items-center justify-center gap-2 transition-colors"
                    >
                      <FaPlus /> Add Requirement
                    </button>
                  </div>
                )}

                {createError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 text-sm px-3 py-2 rounded-xl">
                    {createError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={creating}
                  onClick={handleCreate}
                  className="w-full py-2.5 rounded-xl font-bold transition-all bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaClipboardList className="text-indigo-500" />
                Your Assignments
              </h2>

              <div className="mt-4 space-y-3">
                {teacherAssignments.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    No assignments yet. Create one on the left.
                  </div>
                ) : (
                  teacherAssignments.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => loadSubmissions(a)}
                      className={[
                        'w-full text-left p-4 rounded-xl border transition-colors',
                        selectedAssignment?.id === a.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{a.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {courseLabel.get(String(a.courseId || a.courseId)) || a.course} · {a.type}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Submissions
                </h2>
                {selectedAssignment ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedAssignment.type.toUpperCase()}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Select an assignment</div>
                )}
              </div>

              {!selectedAssignment ? (
                <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Pick an assignment above to see and grade submissions.
                </div>
              ) : loadingSubmissions ? (
                <div className="mt-4 flex items-center gap-3">
                  <FaSpinner className="animate-spin text-sky-500" />
                  Loading submissions...
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {submissions.length === 0 ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400">No submissions yet.</div>
                  ) : (
                    submissions.map((s) => (
                      <div key={s.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {s.student}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Status: {s.status}
                              {s.submittedAt ? ` · ${new Date(s.submittedAt).toLocaleDateString()}` : ''}
                            </div>
                          </div>
                          {s.file ? (
                            <button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`${s.file}?token=${token}`);
                                  if (!res.ok) throw new Error('Download failed');
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  // Extract original filename from Content-Disposition or fallback
                                  const disp = res.headers.get('Content-Disposition') || '';
                                  const match = disp.match(/filename="?([^"]+)"?/);
                                  a.download = match ? decodeURIComponent(match[1]) : 'submission';
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  URL.revokeObjectURL(url);
                                } catch (err) {
                                  alert('Could not download file: ' + err.message);
                                }
                              }}
                              className="text-xs text-blue-600 hover:underline cursor-pointer"
                            >
                              Download file
                            </button>
                          ) : null}
                        </div>

                        {selectedAssignment.type === 'project' ? (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-slate-600 dark:text-slate-300">Grade</label>
                              <input
                                type="number"
                                defaultValue={s.score ?? ''}
                                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                onChange={(e) => {
                                  s._gradeDraft = e.target.value;
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-600 dark:text-slate-300">Feedback</label>
                              <textarea
                                defaultValue={s.feedback ?? ''}
                                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 min-h-[70px] text-slate-900 dark:text-white"
                                onChange={(e) => {
                                  s._feedbackDraft = e.target.value;
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              className="sm:col-span-2 w-full py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                              onClick={() =>
                                gradeOne(
                                  s.id,
                                  Number(s._gradeDraft ?? s.score ?? 0),
                                  s._feedbackDraft ?? s.feedback ?? ''
                                )
                              }
                            >
                              <FaCheckCircle />
                              Grade
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              Score: {s.score ?? 0} / {selectedAssignment.points ?? 0}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default TeacherAssignments;

