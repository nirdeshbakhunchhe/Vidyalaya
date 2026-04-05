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
  const unsubmittedWatchTime = useRef(0);
  const lastTimeRef = useRef(0);

  const handleTimeUpdate = (e) => {
    if (!courseId) return;
    const current = e.target.currentTime;
    const previous = lastTimeRef.current;
    
    // Calculate difference (allow max 2s jump to ignore seeking)
    const diff = current - previous;
    if (diff > 0 && diff <= 2) {
      unsubmittedWatchTime.current += diff;
    }
    lastTimeRef.current = current;

    // Sync every 5 seconds
    if (unsubmittedWatchTime.current >= 5) {
      const timeToSync = Math.floor(unsubmittedWatchTime.current);
      unsubmittedWatchTime.current -= timeToSync; 
      progressAPI.addWatchTime(courseId, timeToSync).catch(console.error);
    }
  };

  const handleSeeked = (e) => {
    lastTimeRef.current = e.target.currentTime;
  };

  // Reset tracking when video changes
  useEffect(() => {
    unsubmittedWatchTime.current = 0;
    lastTimeRef.current = 0;
  }, [selectedVideo]);


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
      <div className="bg-slate-50 min-h-full">

        {/* ── Header bar ──────────────────────────────────────────────────── */}
        <div className="bg-white shadow-sm border-b-2 border-blue-500 mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate('/my-courses')}
                  aria-label="Back to My Courses"
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 flex-shrink-0"
                >
                  <FaChevronLeft className="text-slate-600" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                    {course?.title || 'Course'}
                  </h1>
                  <p className="text-sm text-slate-500">by {course?.instructor || '—'}</p>
                </div>
              </div>
              {course?.duration && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500 flex-shrink-0">
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
            <div role="alert" className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              <FaExclamationCircle className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Locked ────────────────────────────────────────────────────── */}
          {!canWatch && !error && (
            <div className="mt-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <FaLock className="text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Content Locked</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
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
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
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
                        onTimeUpdate={handleTimeUpdate}
                        onSeeked={handleSeeked}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-100 flex flex-col items-center justify-center gap-3 text-slate-400">
                      <FaFilm className="text-4xl text-slate-300" />
                      <p className="text-sm">No videos uploaded yet.</p>
                    </div>
                  )}
                  <div className="p-5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 mb-1">
                        {selectedVideo?.title || 'Select a video from the playlist'}
                      </h2>
                      <p className="text-sm text-slate-400">
                        {videos.length} video{videos.length !== 1 ? 's' : ''} in this course
                      </p>
                    </div>
                    {selectedVideo && (
                      <button
                        onClick={handleMarkComplete}
                        disabled={completedLessons.includes(selectedVideo.title)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                          completedLessons.includes(selectedVideo.title) 
                            ? 'bg-green-100 text-green-700 cursor-default' 
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
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 sticky top-20 overflow-hidden">

                  {/* Sidebar header */}
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                    <FaBookOpen className="text-blue-500 text-sm" />
                    <h3 className="text-base font-bold text-slate-900">My Courses</h3>
                    {!loadingAll && (
                      <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
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
                          <div key={c.id} className="border-b border-slate-100 last:border-0">

                            {/* Course accordion header */}
                            <button
                              type="button"
                              onClick={() => setExpandedCourseId(isExpanded ? null : c.id)}
                              className={[
                                'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors focus:outline-none',
                                isCurrentCourse
                                  ? 'bg-blue-50 hover:bg-blue-100'
                                  : 'hover:bg-slate-50',
                              ].join(' ')}
                            >
                              {/* Active dot */}
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isCurrentCourse ? 'bg-blue-500' : 'bg-slate-300'}`} />

                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${isCurrentCourse ? 'text-blue-700' : 'text-slate-800'}`}>
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
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700',
                                        ].join(' ')}
                                      >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
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