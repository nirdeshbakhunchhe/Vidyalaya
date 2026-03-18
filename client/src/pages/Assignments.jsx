import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import StudentShell from '../components/StudentShell';
import { 
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTrophy,
  FaFileUpload,
  FaChevronRight,
  FaChevronLeft,
  FaDownload,
  FaTimes,
  FaCheck,
  FaStar,
  FaCalendarAlt,
  FaPlay,
  FaHourglassHalf,
  FaAward
} from 'react-icons/fa';

const Assignments = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Demo assignments data
  const assignments = [
    {
      id: 1,
      title: 'HTML & CSS Fundamentals Quiz',
      course: 'Web Development Bootcamp',
      type: 'quiz',
      dueDate: '2024-03-20',
      duration: '30 minutes',
      status: 'pending',
      points: 100,
      totalQuestions: 5,
      description: 'Test your knowledge of HTML tags, CSS selectors, and responsive design principles.',
      questions: [
        {
          id: 1,
          question: 'What does HTML stand for?',
          options: [
            'Hyper Text Markup Language',
            'High Tech Modern Language',
            'Home Tool Markup Language',
            'Hyperlinks and Text Markup Language'
          ],
          correctAnswer: 0
        },
        {
          id: 2,
          question: 'Which CSS property is used to change text color?',
          options: ['text-color', 'color', 'font-color', 'text-style'],
          correctAnswer: 1
        },
        {
          id: 3,
          question: 'What is the correct HTML element for inserting a line break?',
          options: ['<break>', '<lb>', '<br>', '<line>'],
          correctAnswer: 2
        },
        {
          id: 4,
          question: 'Which property is used to change the background color?',
          options: ['bgcolor', 'background-color', 'color-background', 'bg-color'],
          correctAnswer: 1
        },
        {
          id: 5,
          question: 'How do you make text bold in CSS?',
          options: ['font-weight: bold;', 'text-style: bold;', 'font: bold;', 'text-weight: bold;'],
          correctAnswer: 0
        }
      ]
    },
    {
      id: 2,
      title: 'React Components Project',
      course: 'React Fundamentals',
      type: 'project',
      dueDate: '2024-03-25',
      duration: 'No time limit',
      status: 'pending',
      points: 200,
      description: 'Build a todo list application using React hooks and component composition. Include add, delete, and mark complete functionality.',
      requirements: [
        'Use functional components with hooks',
        'Implement state management',
        'Add styling with CSS or Tailwind',
        'Include proper error handling'
      ]
    },
    {
      id: 3,
      title: 'JavaScript Arrays & Objects Quiz',
      course: 'JavaScript Essentials',
      type: 'quiz',
      dueDate: '2024-03-18',
      duration: '20 minutes',
      totalQuestions: 8,
      status: 'overdue',
      points: 80,
      description: 'Assessment covering array methods, object manipulation, and destructuring.'
    },
    {
      id: 4,
      title: 'CSS Flexbox Layout',
      course: 'Web Development Bootcamp',
      type: 'project',
      dueDate: '2024-03-15',
      status: 'completed',
      submittedDate: '2024-03-14',
      points: 150,
      grade: null,
      description: 'Create a responsive navigation bar using CSS Flexbox.'
    },
    {
      id: 5,
      title: 'Git & GitHub Basics Quiz',
      course: 'Version Control',
      type: 'quiz',
      dueDate: '2024-03-10',
      status: 'graded',
      submittedDate: '2024-03-09',
      points: 100,
      grade: 85,
      feedback: 'Good understanding of basic concepts. Review merge conflicts section.',
      description: 'Test your knowledge of Git commands and GitHub workflows.'
    },
    {
      id: 6,
      title: 'Database Design Project',
      course: 'Backend Development',
      type: 'project',
      dueDate: '2024-03-12',
      status: 'graded',
      submittedDate: '2024-03-11',
      points: 200,
      grade: 190,
      feedback: 'Excellent work! Well-structured schema and proper normalization.',
      description: 'Design a database schema for an e-commerce application.'
    }
  ];

  const filteredAssignments = assignments.filter(assignment => {
    if (activeTab === 'pending') return assignment.status === 'pending' || assignment.status === 'overdue';
    if (activeTab === 'completed') return assignment.status === 'completed';
    if (activeTab === 'graded') return assignment.status === 'graded';
    return true;
  });

  const stats = {
    pending: assignments.filter(a => a.status === 'pending').length,
    overdue: assignments.filter(a => a.status === 'overdue').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    graded: assignments.filter(a => a.status === 'graded').length,
    averageGrade: assignments
      .filter(a => a.grade)
      .reduce((sum, a) => sum + (a.grade / a.points) * 100, 0) / 
      assignments.filter(a => a.grade).length || 0
  };

  const startQuiz = (assignment) => {
    setSelectedAssignment(assignment);
    setQuizMode(true);
    setCurrentQuestion(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: answerIndex
    });
  };

  const submitQuiz = () => {
    setQuizSubmitted(true);
    let correct = 0;
    selectedAssignment.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) correct++;
    });
    console.log(`Score: ${correct}/${selectedAssignment.questions.length}`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const submitAssignment = () => {
    console.log('Submitting assignment:', uploadedFile);
    setSelectedAssignment(null);
    setUploadedFile(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: (
        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
          <FaClock className="text-xs" />
          <span>Pending</span>
        </span>
      ),
      overdue: (
        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-full text-xs font-medium">
          <FaExclamationTriangle className="text-xs" />
          <span>Overdue</span>
        </span>
      ),
      completed: (
        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-xs font-medium">
          <FaCheckCircle className="text-xs" />
          <span>Submitted</span>
        </span>
      ),
      graded: (
        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
          <FaTrophy className="text-xs" />
          <span>Graded</span>
        </span>
      )
    };
    return badges[status] || null;
  };

  // Quiz View
  if (quizMode && selectedAssignment) {
    const currentQ = selectedAssignment.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedAssignment.questions.length) * 100;

    return (
      <StudentShell>
        <div className="min-h-screen flex items-center justify-center py-8 px-4">
          <div className="w-full max-w-3xl">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">{selectedAssignment.title}</h2>
                  <button
                    onClick={() => setQuizMode(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Question {currentQuestion + 1} of {selectedAssignment.questions.length}</span>
                  <span className="flex items-center space-x-2">
                    <FaClock />
                    <span>{selectedAssignment.duration}</span>
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-white h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Question Content */}
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  {currentQ.question}
                </h3>
                <div className="space-y-3">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQ.id, index)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                        quizAnswers[currentQ.id] === index
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          quizAnswers[currentQ.id] === index
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {quizAnswers[currentQ.id] === index && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-slate-800 dark:text-slate-200">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                      currentQuestion === 0
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    <FaChevronLeft />
                    <span>Previous</span>
                  </button>

                  {currentQuestion === selectedAssignment.questions.length - 1 ? (
                    <button
                      onClick={submitQuiz}
                      className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg"
                    >
                      <FaCheck />
                      <span>Submit Quiz</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuestion(Math.min(selectedAssignment.questions.length - 1, currentQuestion + 1))}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
                    >
                      <span>Next</span>
                      <FaChevronRight />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </StudentShell>
    );
  }

  // Assignment Detail View
  if (selectedAssignment && !quizMode) {
    return (
      <StudentShell>
        <div className="min-h-screen flex items-center justify-center py-8 px-4">
          <div className="w-full max-w-3xl">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">{selectedAssignment.title}</h2>
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
                <p className="text-white/90 mb-4">{selectedAssignment.course}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                    <FaCalendarAlt />
                    <span>Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</span>
                  </span>
                  <span className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                    <FaClock />
                    <span>{selectedAssignment.duration}</span>
                  </span>
                  <span className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                    <FaStar />
                    <span>{selectedAssignment.points} points</span>
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Description</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedAssignment.description}
                  </p>
                </div>

                {selectedAssignment.type === 'quiz' && selectedAssignment.status === 'pending' && (
                  <button
                    onClick={() => startQuiz(selectedAssignment)}
                    className="w-full mt-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    <FaPlay />
                    <span>Start Quiz</span>
                  </button>
                )}

                {selectedAssignment.type === 'project' && selectedAssignment.status === 'pending' && (
                  <div className="mt-8">
                    {selectedAssignment.requirements && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Requirements</h3>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                          {selectedAssignment.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.zip"
                    />
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
                      {uploadedFile ? (
                        <div>
                          <FaCheckCircle className="text-5xl text-emerald-500 mx-auto mb-3" />
                          <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">
                            {uploadedFile.name}
                          </p>
                          <button
                            onClick={() => setUploadedFile(null)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <FaFileUpload className="text-5xl text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-600 dark:text-slate-400 mb-2">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-sm text-slate-500">
                            PDF, DOC, ZIP (max 10MB)
                          </p>
                        </label>
                      )}
                    </div>
                    <button
                      onClick={submitAssignment}
                      disabled={!uploadedFile}
                      className={`w-full mt-6 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center space-x-2 ${
                        uploadedFile
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <FaCheckCircle />
                      <span>Submit Assignment</span>
                    </button>
                  </div>
                )}

                {selectedAssignment.grade !== null && selectedAssignment.grade !== undefined && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-400">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Grade</h3>
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedAssignment.grade}/{selectedAssignment.points}
                        <span className="text-lg ml-2">
                          ({((selectedAssignment.grade / selectedAssignment.points) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    {selectedAssignment.feedback && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Instructor Feedback:
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">{selectedAssignment.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </StudentShell>
    );
  }

  // Main Assignments List View
  return (
    <StudentShell>
      <div className="py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center space-x-3">
            <FaClipboardList className="text-blue-500" />
            <span>My Assignments & Quizzes</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Complete your assignments and track your progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
              <FaClock className="text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Overdue</p>
              <FaExclamationTriangle className="text-red-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.overdue}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Submitted</p>
              <FaCheckCircle className="text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Graded</p>
              <FaTrophy className="text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.graded}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg Grade</p>
              <FaStar className="text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.averageGrade.toFixed(0)}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          {['pending', 'completed', 'graded'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center border border-slate-200 dark:border-slate-700">
              <FaClipboardList className="text-6xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-xl text-slate-600 dark:text-slate-400">
                No assignments in this category
              </p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() => setSelectedAssignment(assignment)}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {assignment.title}
                      </h3>
                      {getStatusBadge(assignment.status)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                      {assignment.course}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center space-x-1">
                        <FaCalendarAlt className="text-xs" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FaClock className="text-xs" />
                        <span>{assignment.duration}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FaStar className="text-xs" />
                        <span>{assignment.points} pts</span>
                      </span>
                      {assignment.type === 'quiz' && assignment.totalQuestions && (
                        <span className="flex items-center space-x-1">
                          <FaClipboardList className="text-xs" />
                          <span>{assignment.totalQuestions} questions</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {assignment.status === 'overdue' && (
                      <span className="px-3 py-1 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-full text-xs font-medium">
                        Late
                      </span>
                    )}
                    {assignment.grade !== null && assignment.grade !== undefined && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {((assignment.grade / assignment.points) * 100).toFixed(0)}%
                        </p>
                      </div>
                    )}
                    <FaChevronRight className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </StudentShell>
  );
};

export default Assignments;
