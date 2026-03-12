import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import StudentShell from '../components/StudentShell';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  FaBook, 
  FaCode, 
  FaPalette, 
  FaFlask, 
  FaCalculator, 
  FaLanguage,
  FaChartLine,
  FaMusic,
  FaSearch,
  FaClock,
  FaStar,
  FaUsers,
  FaFilter,
  FaSpinner,
  FaExclamationCircle,
  FaLock,
  FaUnlock,
} from 'react-icons/fa';

const ExploreCourses = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = [
    { id: 'all', name: 'All Courses', icon: FaBook },
    { id: 'programming', name: 'Programming', icon: FaCode },
    { id: 'design', name: 'Design', icon: FaPalette },
    { id: 'science', name: 'Science', icon: FaFlask },
    { id: 'mathematics', name: 'Mathematics', icon: FaCalculator },
    { id: 'language', name: 'Languages', icon: FaLanguage },
    { id: 'business', name: 'Business', icon: FaChartLine },
    { id: 'arts', name: 'Arts', icon: FaMusic },
  ];

  // Fetch courses from backend whenever filters change
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (selectedCategory !== 'all') params.category = selectedCategory;
        if (selectedLevel !== 'all') params.level = selectedLevel;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const data = await courseAPI.getCourses(params);
        setCourses(data.courses || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search input by 400ms; fire immediately for category/level changes
    const delay = searchQuery ? 400 : 0;
    const timer = setTimeout(fetchCourses, delay);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedLevel]);

  const handleCourseClick = (courseId) => {
    // Check if user is authenticated before navigating to course details
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/course/${courseId}` } } });
      return;
    }
    navigate(`/course/${courseId}`);
  };

  // If user is authenticated, render with StudentShell
  if (isAuthenticated) {
    return (
      <StudentShell>
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600 text-white py-8 rounded-2xl px-6 mb-8">
          <h2 className="text-3xl font-bold mb-2">Explore Courses</h2>
          <p className="text-primary-100">
            Discover the perfect course to enhance your skills and advance your career
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="py-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 mb-8">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <FaFilter className="text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Categories</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedCategory === category.id
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Icon className="text-sm" />
                      <span className="text-sm">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Level</h3>
              <div className="flex flex-wrap gap-2">
                {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                      selectedLevel === level
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {level === 'all' ? 'All Levels' : level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-center space-x-2">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <FaSpinner className="text-4xl text-primary-500 animate-spin" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Loading courses...</p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-6">
                <p className="text-slate-600 dark:text-slate-400">
                  Showing <span className="font-semibold text-slate-900 dark:text-white">{courses.length}</span> course{courses.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Course Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Course Image with Gradient Overlay */}
                    <div className="relative h-48 overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${course.color || 'from-blue-500 to-cyan-500'} opacity-90`}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h3 className="text-white text-xl font-bold text-center px-4">{course.title}</h3>
                      </div>
                      <span className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-slate-800/90 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                        {course.level}
                      </span>
                    </div>

                    {/* Course Details */}
                    <div className="p-6">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      <div className="flex items-center space-x-2 mb-3 text-sm text-slate-600 dark:text-slate-400">
                        <FaUsers />
                        <span>{course.instructor}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                          <FaClock />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                          <FaUsers />
                          <span>{(course.enrollmentCount ?? 0).toLocaleString()} students</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-1">
                          <FaStar className="text-yellow-500" />
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {course.rating?.toFixed(1) ?? '0.0'}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 text-sm">
                            ({course.totalRatings ?? 0} ratings)
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCourseClick(course.id)}
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl"
                      >
                        View Course
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* No Results */}
              {courses.length === 0 && !error && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                    <FaBook className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No courses found</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all'
                      ? 'Try adjusting your filters or search query'
                      : 'No courses have been added yet. Check back soon!'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </StudentShell>
    );
  }

  // Guest view - with Navbar and Footer instead of StudentShell
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600 text-white py-8 rounded-2xl px-6 mb-8">
            <h2 className="text-3xl font-bold mb-2">Explore Courses</h2>
            <p className="text-primary-100">
              Discover the perfect course to enhance your skills and advance your career
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="py-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 mb-8">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <FaFilter className="text-slate-600 dark:text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Categories</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedCategory === category.id
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        <Icon className="text-sm" />
                        <span className="text-sm">{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Level Filter */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Level</h3>
                <div className="flex flex-wrap gap-2">
                  {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                        selectedLevel === level
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {level === 'all' ? 'All Levels' : level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-center space-x-2">
                <FaExclamationCircle />
                <span>{error}</span>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <FaSpinner className="text-4xl text-primary-500 animate-spin" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">Loading courses...</p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-6">
                  <p className="text-slate-600 dark:text-slate-400">
                    Showing <span className="font-semibold text-slate-900 dark:text-white">{courses.length}</span> course{courses.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Course Image with Gradient Overlay */}
                      <div className="relative h-48 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${course.color || 'from-blue-500 to-cyan-500'} opacity-90`}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <h3 className="text-white text-xl font-bold text-center px-4">{course.title}</h3>
                        </div>
                        <span className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-slate-800/90 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                          {course.level}
                        </span>
                      </div>

                      {/* Course Details */}
                      <div className="p-6">
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>

                        <div className="flex items-center space-x-2 mb-3 text-sm text-slate-600 dark:text-slate-400">
                          <FaUsers />
                          <span>{course.instructor}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                            <FaClock />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                            <FaUsers />
                            <span>{(course.enrollmentCount ?? 0).toLocaleString()} students</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-1">
                            <FaStar className="text-yellow-500" />
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {course.rating?.toFixed(1) ?? '0.0'}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 text-sm">
                              ({course.totalRatings ?? 0} ratings)
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCourseClick(course.id)}
                          className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <FaLock className="text-xs" />
                          View Details (Login to Enroll)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* No Results */}
                {courses.length === 0 && !error && (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                      <FaBook className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No courses found</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all'
                        ? 'Try adjusting your filters or search query'
                        : 'No courses have been added yet. Check back soon!'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExploreCourses;
