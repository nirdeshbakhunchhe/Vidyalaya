import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaBookOpen, FaBrain, FaChalkboardTeacher, FaLock, FaUnlock } from 'react-icons/fa';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const goToCourses = () => {
    // Allow guests to browse courses - login only required when enrolling
    navigate('/explore-courses');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300 bg-primary-100/70 dark:bg-primary-900/30 px-3 py-1 rounded-full">
              <FaBrain className="opacity-90" /> AI-Powered Learning Platform
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white">
              Learn faster with <span className="text-gradient">Vidyalaya</span>
            </h1>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg">
              Personalized courses, smart practice, and an AI tutor—built to help students learn with clarity and confidence.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                onClick={goToCourses}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg hover:shadow-xl transition-all"
              >
                <FaBookOpen /> Explore courses
              </button>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
              >
                About Vidyalaya
              </Link>
            </div>


          </div>

          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary-200/40 to-primary-400/20 blur-2xl rounded-3xl" />
            <div className="relative bg-white dark:bg-slate-900/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Adaptive learning</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Paths that fit your level</div>
                </div>
                <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Progress tracking</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Stay consistent daily</div>
                </div>
                <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI Tutor</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ask doubts anytime</div>
                </div>
                <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Curated courses</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Learn the right way</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Features</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Everything you need to learn, practice, and track your growth.
        </p>

        <div className="mt-6 grid md:grid-cols-3 gap-5">
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-bold">
              <FaChalkboardTeacher /> Guided learning
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Structured modules with practice and clear explanations.
            </p>
          </div>
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-bold">
              <FaBrain /> AI assistance
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Get instant help when you're stuck—step-by-step.
            </p>
          </div>
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-bold">
              <FaBookOpen /> Courses & practice
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Explore courses and build skills with hands-on tasks.
            </p>
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Popular Courses</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Explore our comprehensive catalog of courses designed to help you succeed
            </p>
          </div>
          <button
            onClick={goToCourses}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 transition-all"
          >
            <FaBookOpen /> View all courses
          </button>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: 'Web Development', level: 'Beginner to Advanced', icon: '🌐' },
            { title: 'Data Structures', level: 'Core fundamentals', icon: '🔢' },
            { title: 'AI & ML Basics', level: 'Start with concepts', icon: '🤖' },
            { title: 'Aptitude & Reasoning', level: 'Practice daily', icon: '🧠' },
            { title: 'Python Programming', level: 'Hands-on learning', icon: '🐍' },
            { title: 'Interview Prep', level: 'Crack placements', icon: '💼' },
          ].map((c) => (
            <button
              key={c.title}
              onClick={goToCourses}
              className="text-left rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group"
            >
              <div className="text-3xl mb-3">{c.icon}</div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {c.title}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{c.level}</div>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300">
                {isAuthenticated ? (
                  <>
                    <FaUnlock className="text-xs" />
                    Browse course catalog
                  </>
                ) : (
                  <>
                    <FaUnlock className="text-xs" />
                    View details (Login to enroll)
                  </>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="sm:hidden mt-6">
          <button
            onClick={goToCourses}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 transition-all"
          >
            <FaBookOpen /> View all courses
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
