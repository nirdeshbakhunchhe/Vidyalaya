// CourseLearning.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// ── Layout shell & API ────────────────────────────────────────────────────────
import StudentShell from '../components/StudentShell';
import { courseAPI, progressAPI } from '../services/api';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaChevronLeft,
  FaChevronDown,
  FaChevronRight,
  FaClock,
  FaLock,
  FaSpinner,
  FaPlay,
  FaExclamationCircle,
  FaFilm,
  FaBookOpen,
  FaCheckCircle,
} from 'react-icons/fa';

const isValidObjectId = (id) => /^[0-9a-f]{24}$/i.test(id);
const LAST_WATCHED_KEY = 'vidyalaya_last_watched';

// =============================================================================
// CourseLearning — video player + all-courses playlist
// =============================================================================
const CourseLearning = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();

  // ── Current course state ───────────────────────────────────────────────────
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [course,        setCourse]        = useState(null);
  const [videos,        setVideos]        = useState([]);
  const [canWatch,      setCanWatch]      = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);

  // ── All enrolled courses + their videos ───────────────────────────────────
  const [allCourses,        setAllCourses]        = useState([]);   // [{id,title,videos:[]}]
  const [loadingAll,        setLoadingAll]        = useState(true);
  const [expandedCourseId,  setExpandedCourseId]  = useState(courseId); // accordion

  // ── Fetch current course ───────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      if (!courseId) return;
      if (!isValidObjectId(courseId)) {
        setError('Invalid course ID.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await courseAPI.getCourseLearning(courseId);
        setCourse(data.course  || null);
        setCanWatch(Boolean(data.access?.canWatch));
        setVideos(data.videos  || []);
        const navIndex = location.state?.videoIndex;
        setSelectedIndex(typeof navIndex === 'number' ? navIndex : 0);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [courseId]);

  // ── Fetch ALL enrolled courses + their videos for the sidebar ──────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoadingAll(true);
      try {
        // Step 1: get enrolled course list
        const enrolledData = await courseAPI.getEnrolledCourses();
        const enrolled = enrolledData?.courses || [];

        // Step 2: for each course fetch its videos (parallel)
        const withVideos = await Promise.all(
          enrolled.map(async (c) => {
            try {
              const ld = await courseAPI.getCourseLearning(c.id);
              return {
                id:        c.id,
                title:     c.title,
                instructor: c.instructor || '',
                canWatch:  Boolean(ld.access?.canWatch),
                videos:    ld.videos || [],
              };
            } catch {
              return { id: c.id, title: c.title, instructor: c.instructor || '', canWatch: false, videos: [] };
            }
          })
        );
        setAllCourses(withVideos);
      } catch {
        setAllCourses([]);
      } finally {
        setLoadingAll(false);
      }
    };
    fetchAll();
  }, []); // only once on mount

  // ── Always expand the current course in sidebar ────────────────────────────
  useEffect(() => {
    setExpandedCourseId(courseId);
  }, [courseId]);

  // ── Derived: selected video ────────────────────────────────────────────────
  const selectedVideo = useMemo(() => {
    if (!videos.length) return null;
    return videos[Math.max(0, Math.min(selectedIndex, videos.length - 1))];
  }, [videos, selectedIndex]);

  // ── Persist last-watched ───────────────────────────────────────────────────
  useEffect(() => {
    if (!course || !selectedVideo || !courseId) return;
    localStorage.setItem(LAST_WATCHED_KEY, JSON.stringify({
      courseId,
      courseTitle: course.title,
      instructor:  course.instructor || '',
      thumbnail:   course.thumbnail  || course.image || '',
      videoTitle:  selectedVideo.title,
      watchedAt:   Date.now(),
    }));
  }, [courseId, course, selectedVideo, selectedIndex]);

  // ── Fetch Progress ──────────────────────────────────────────────────────────
  useEffect(() => {
     if(courseId && canWatch) {
       progressAPI.getCourseProgress(courseId).then(data => {
         setCompletedLessons(data?.completedLessons?.map(l => l.lessonTitle) || []);
       }).catch(console.error);
     }
  }, [courseId, canWatch]);

  // ── Track Watch Time ────────────────────────────────────────────────────────
  const pendingWatchSecondsRef = useRef(0);
  const isPlayingRef = useRef(false);
  const lastTickMsRef = useRef(Date.now());

  const flushWatchTime = async () => {
    const seconds = Math.floor(pendingWatchSecondsRef.current);
    if (!courseId || seconds <= 0) return;
    pendingWatchSecondsRef.current -= seconds;
    try {
      await progressAPI.addWatchTime(courseId, seconds);
    } catch (err) {
      // restore on failure (best-effort)
      pendingWatchSecondsRef.current += seconds;
      console.error(err);
    }
  };

  const handlePlay = () => {
    isPlayingRef.current = true;
    lastTickMsRef.current = Date.now();
  };

  const handlePauseOrEnd = () => {
    isPlayingRef.current = false;
    void flushWatchTime();
  };

  // Reset tracking when video changes
  useEffect(() => {
    void flushWatchTime();
    pendingWatchSecondsRef.current = 0;
    isPlayingRef.current = false;
    lastTickMsRef.current = Date.now();
  }, [selectedVideo]);

  // Tick while playing; accumulate real time (not logout/click based)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!isPlayingRef.current) return;
      const now = Date.now();
      const delta = Math.min(5, Math.max(0, (now - lastTickMsRef.current) / 1000));
      lastTickMsRef.current = now;
      pendingWatchSecondsRef.current += delta;

      if (pendingWatchSecondsRef.current >= 15) {
        void flushWatchTime();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [courseId]);

  // Flush when tab hides/unmounts
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') {
        isPlayingRef.current = false;
        void flushWatchTime();
      }
    };
    const onPageHide = () => {
      isPlayingRef.current = false;
      void flushWatchTime();
    };
    window.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onPageHide);
      void flushWatchTime();
    };
  }, [courseId]);


  const handleMarkComplete = async () => {
    if(!selectedVideo) return;
    try {
      const data = await progressAPI.markLessonComplete(courseId, selectedVideo.title);
      setCompletedLessons(data?.completedLessons?.map(l => l.lessonTitle) || []);
    } catch(err) {
      console.error('Failed to mark complete', err);
    }
  };

  // ── Navigate to a video in any course ─────────────────────────────────────
  const handleVideoClick = (targetCourseId, videoIndex) => {
    if (targetCourseId === courseId) {
      setSelectedIndex(videoIndex);
    } else {
      navigate(`/student/course/${targetCourseId}/learn`, { state: { videoIndex } });
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <StudentShell>
        <div className="flex items-center justify-center py-32">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      </StudentShell>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <StudentShell>
      <div className="bg-slate-50 dark:bg-slate-900 min-h-full">

        {/* ── Header bar ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 shadow-sm border-b-2 border-blue-500 mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate('/my-courses')}
                  aria-label="Back to My Courses"
                  className="p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 flex-shrink-0"
                >
                  <FaChevronLeft className="text-slate-600 dark:text-slate-300" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {course?.title || 'Course'}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">by {course?.instructor || '—'}</p>
                </div>
              </div>
              {course?.duration && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
                  <FaClock className="text-blue-400" />
                  <span>{course.duration}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">

          {error && (
            <div role="alert" className="mb-6 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4 text-red-700 text-sm">
              <FaExclamationCircle className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Locked ────────────────────────────────────────────────────── */}
          {!canWatch && !error && (
            <div className="mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <FaLock className="text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Content Locked</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    You can watch this course only after teacher approval (free) or payment verification (paid).
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/course/${courseId}`)}
                    className="mt-4 px-5 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Back to Course
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Player + All-courses sidebar ────────────────────────────── */}
          {canWatch && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left — video player */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
                  {selectedVideo ? (
                    <div className="aspect-video bg-slate-900">
                      <video
                        key={selectedVideo.url}
                        className="w-full h-full"
                        src={selectedVideo.url}
                        controls
                        autoPlay
                        preload="metadata"
                        poster={course?.thumbnail || undefined}
                        onPlay={handlePlay}
                        onPause={handlePauseOrEnd}
                        onEnded={handlePauseOrEnd}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
                      <FaFilm className="text-4xl text-slate-300" />
                      <p className="text-sm">No videos uploaded yet.</p>
                    </div>
                  )}
                  <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {selectedVideo?.title || 'Select a video from the playlist'}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {videos.length} video{videos.length !== 1 ? 's' : ''} in this course
                      </p>
                    </div>
                    {selectedVideo && (
                      <button
                        onClick={handleMarkComplete}
                        disabled={completedLessons.includes(selectedVideo.title)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                          completedLessons.includes(selectedVideo.title) 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 cursor-default' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                      >
                         {completedLessons.includes(selectedVideo.title) ? (
                           <><FaCheckCircle /> Completed</>
                         ) : (
                           "Mark as Complete"
                         )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right — all enrolled courses accordion playlist */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-20 overflow-hidden">

                  {/* Sidebar header */}
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <FaBookOpen className="text-blue-500 text-sm" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">My Courses</h3>
                    {!loadingAll && (
                      <span className="ml-auto text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {allCourses.length}
                      </span>
                    )}
                  </div>

                  <div className="max-h-[calc(100vh-280px)] overflow-y-auto">

                    {loadingAll ? (
                      <div className="flex justify-center py-8">
                        <FaSpinner className="animate-spin text-2xl text-blue-400" />
                      </div>
                    ) : allCourses.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">No enrolled courses</p>
                    ) : (
                      allCourses.map((c) => {
                        const isCurrentCourse = c.id === courseId;
                        const isExpanded      = expandedCourseId === c.id;

                        return (
                          <div key={c.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">

                            {/* Course accordion header */}
                            <button
                              type="button"
                              onClick={() => setExpandedCourseId(isExpanded ? null : c.id)}
                              className={[
                                'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors focus:outline-none',
                                isCurrentCourse
                                  ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900',
                              ].join(' ')}
                            >
                              {/* Active dot */}
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isCurrentCourse ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />

                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${isCurrentCourse ? 'text-blue-700' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {c.title}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                  {c.videos.length} video{c.videos.length !== 1 ? 's' : ''}
                                  {!c.canWatch && ' · Locked'}
                                </p>
                              </div>

                              {isExpanded
                                ? <FaChevronDown className="text-slate-400 text-xs flex-shrink-0" />
                                : <FaChevronRight className="text-slate-400 text-xs flex-shrink-0" />
                              }
                            </button>

                            {/* Video list (shown when expanded) */}
                            {isExpanded && (
                              <div className="pb-2 px-3 space-y-1">
                                {!c.canWatch ? (
                                  <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-slate-400">
                                    <FaLock className="text-[10px]" />
                                    <span>Awaiting access</span>
                                  </div>
                                ) : c.videos.length === 0 ? (
                                  <p className="text-xs text-slate-400 px-3 py-2.5">No videos yet</p>
                                ) : (
                                  c.videos.map((v, idx) => {
                                    const isActive = isCurrentCourse && idx === selectedIndex;
                                    return (
                                      <button
                                        key={v.public_id || v.url || idx}
                                        type="button"
                                        onClick={() => handleVideoClick(c.id, idx)}
                                        aria-current={isActive ? 'true' : undefined}
                                        className={[
                                          'w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3',
                                          'focus:outline-none focus:ring-2 focus:ring-blue-400',
                                          isActive
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
                                        ].join(' ')}
                                      >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                          isActive ? 'bg-white dark:bg-slate-900/20 text-white' : 'bg-slate-200 text-slate-500 dark:text-slate-400'
                                        }`}>
                                          {isActive ? <FaPlay className="text-[7px]" /> : idx + 1}
                                        </span>
                                        <span className="text-xs font-medium truncate">{v.title}</span>
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
};

export default CourseLearning;