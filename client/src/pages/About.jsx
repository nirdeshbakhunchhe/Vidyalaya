import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">About Vidyalaya</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg">
          Vidyalaya is a modern learning platform built to help students learn faster with structured courses, practice, and AI help.
        </p>

        <div className="mt-8">
          <img
            src="/logo2.png"
            alt="Vidyalaya"
            className="w-full h-auto max-h-[520px] object-contain rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm"
          />
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Our mission</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Make high-quality learning accessible, interactive, and personalized for every student.
            </p>
          </div>
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">What you get</h2>
            <ul className="mt-2 text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
              <li>Courses with clear modules</li>
              <li>Progress tracking in your dashboard</li>
              <li>AI tutor support for doubts</li>
              <li>Personal profile and enrolled courses</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
