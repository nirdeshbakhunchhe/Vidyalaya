import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentShell from '../components/StudentShell';
import { 
  FaPlay, 
  FaChevronLeft, 
  FaChevronRight, 
  FaCheckCircle,
  FaCircle,
  FaDownload,
  FaFilePdf,
  FaFileWord,
  FaClock,
  FaStickyNote,
  FaSave,
  FaTrash
} from 'react-icons/fa';

const CourseLearning = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // Demo popular learning videos
  const demoVideos = [
    {
      id: 'dQw4w9WgXcQ',
      title: 'Introduction to Web Development',
      duration: '15:30',
      description: 'Learn the fundamentals of building modern websites'
    },
    {
      id: 'Ke90Tje7VS0',
      title: 'React Tutorial for Beginners',
      duration: '45:20',
      description: 'Complete React.js crash course from scratch'
    },
    {
      id: 'PkZNo7MFNFg',
      title: 'JavaScript ES6 Features',
      duration: '28:15',
      description: 'Master modern JavaScript features and syntax'
    },
    {
      id: 'rfscVS0vtbw',
      title: 'Python Programming Basics',
      duration: '32:45',
      description: 'Start your Python programming journey'
    }
  ];

  const [course, setCourse] = useState({
    title: 'Complete Web Development Bootcamp',
    instructor: 'Dr. Sarah Johnson',
    progress: 65,
    modules: [
      {
        id: 1,
        title: 'Getting Started',
        lessons: [
          { id: 1, title: 'Welcome & Course Overview', videoId: demoVideos[0].id, duration: '15:30', completed: true },
          { id: 2, title: 'Setting Up Your Environment', videoId: demoVideos[1].id, duration: '12:45', completed: true },
        ]
      },
      {
        id: 2,
        title: 'HTML & CSS Fundamentals',
        lessons: [
          { id: 3, title: 'HTML Basics', videoId: demoVideos[2].id, duration: '28:15', completed: true },
          { id: 4, title: 'CSS Styling', videoId: demoVideos[3].id, duration: '32:45', completed: false },
          { id: 5, title: 'Responsive Design', videoId: demoVideos[0].id, duration: '25:20', completed: false },
        ]
      },
      {
        id: 3,
        title: 'JavaScript Essentials',
        lessons: [
          { id: 6, title: 'JavaScript Introduction', videoId: demoVideos[1].id, duration: '22:10', completed: false },
          { id: 7, title: 'DOM Manipulation', videoId: demoVideos[2].id, duration: '30:00', completed: false },
        ]
      }
    ],
    resources: [
      { id: 1, name: 'Course Syllabus.pdf', type: 'pdf', size: '2.5 MB', url: '#' },
      { id: 2, name: 'HTML Cheat Sheet.pdf', type: 'pdf', size: '1.2 MB', url: '#' },
      { id: 3, name: 'Project Files.zip', type: 'zip', size: '15.8 MB', url: '#' },
      { id: 4, name: 'Code Examples.docx', type: 'word', size: '890 KB', url: '#' },
    ]
  });

  const [currentLesson, setCurrentLesson] = useState(course.modules[0].lessons[0]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [expandedModules, setExpandedModules] = useState([1, 2, 3]);

  // Get all lessons in order
  const getAllLessons = () => {
    return course.modules.flatMap(module => module.lessons);
  };

  const currentLessonIndex = getAllLessons().findIndex(l => l.id === currentLesson.id);
  const allLessons = getAllLessons();
  const hasNext = currentLessonIndex < allLessons.length - 1;
  const hasPrevious = currentLessonIndex > 0;

  const handleNextLesson = () => {
    if (hasNext) {
      setCurrentLesson(allLessons[currentLessonIndex + 1]);
    }
  };

  const handlePreviousLesson = () => {
    if (hasPrevious) {
      setCurrentLesson(allLessons[currentLessonIndex - 1]);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const markAsComplete = () => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => 
          lesson.id === currentLesson.id 
            ? { ...lesson, completed: true }
            : lesson
        )
      }))
    }));
  };

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, {
        id: Date.now(),
        text: newNote,
        lessonId: currentLesson.id,
        lessonTitle: currentLesson.title,
        timestamp: new Date().toLocaleString()
      }]);
      setNewNote('');
    }
  };

  const deleteNote = (noteId) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const getIconForFileType = (type) => {
    switch (type) {
      case 'pdf': return <FaFilePdf className="text-red-500" />;
      case 'word': return <FaFileWord className="text-blue-500" />;
      default: return <FaDownload className="text-slate-500" />;
    }
  };

  return (
    <StudentShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-lg border-b-4 border-blue-400">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/student/my-courses')}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <FaChevronLeft className="text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {course.title}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    by {course.instructor}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Course Progress</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {course.progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Video Player */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border-2 border-blue-200 dark:border-blue-900">
                <div className="relative aspect-video bg-slate-900">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${currentLesson.videoId}`}
                    title={currentLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {currentLesson.title}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center space-x-1">
                          <FaClock />
                          <span>{currentLesson.duration}</span>
                        </span>
                        {currentLesson.completed && (
                          <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                            <FaCheckCircle />
                            <span>Completed</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {!currentLesson.completed && (
                      <button
                        onClick={markAsComplete}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <FaCheckCircle />
                        <span>Mark Complete</span>
                      </button>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handlePreviousLesson}
                      disabled={!hasPrevious}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                        hasPrevious
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <FaChevronLeft />
                      <span>Previous Lesson</span>
                    </button>
                    <button
                      onClick={handleNextLesson}
                      disabled={!hasNext}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                        hasNext
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Next Lesson</span>
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-blue-200 dark:border-blue-900">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                  <FaStickyNote className="text-blue-500" />
                  <span>My Notes</span>
                </h3>

                {/* Add Note */}
                <div className="mb-6">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Take notes while learning..."
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                    rows="3"
                  />
                  <button
                    onClick={addNote}
                    className="mt-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <FaSave />
                    <span>Save Note</span>
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                      No notes yet. Start taking notes to remember important points!
                    </p>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 bg-blue-50 dark:bg-slate-700 rounded-lg border-l-4 border-blue-500"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {note.lessonTitle} • {note.timestamp}
                          </p>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                        <p className="text-slate-800 dark:text-white">{note.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Resources */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-blue-200 dark:border-blue-900">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                  <FaDownload className="text-blue-500" />
                  <span>Course Resources</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700"
                    >
                      <div className="text-2xl">
                        {getIconForFileType(resource.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {resource.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {resource.size}
                        </p>
                      </div>
                      <FaDownload className="text-blue-500" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Course Modules */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-blue-200 dark:border-blue-900 sticky top-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Course Content
                </h3>
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {course.modules.map((module) => (
                    <div key={module.id} className="border-2 border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-900 dark:text-white text-left">
                          {module.title}
                        </span>
                        <FaChevronRight
                          className={`transition-transform ${
                            expandedModules.includes(module.id) ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {expandedModules.includes(module.id) && (
                        <div className="p-2 space-y-1">
                          {module.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => setCurrentLesson(lesson)}
                              className={`w-full text-left px-3 py-3 rounded-lg transition-all flex items-center space-x-3 ${
                                currentLesson.id === lesson.id
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-600'
                              }`}
                            >
                              {lesson.completed ? (
                                <FaCheckCircle className="text-green-400 flex-shrink-0" />
                              ) : (
                                <FaCircle className="text-slate-400 text-xs flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  currentLesson.id === lesson.id
                                    ? 'text-white'
                                    : 'text-slate-900 dark:text-white'
                                }`}>
                                  {lesson.title}
                                </p>
                                <p className={`text-xs ${
                                  currentLesson.id === lesson.id
                                    ? 'text-blue-100'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                  {lesson.duration}
                                </p>
                              </div>
                              {currentLesson.id === lesson.id && (
                                <FaPlay className="text-white flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentShell>
  );
};

export default CourseLearning;
