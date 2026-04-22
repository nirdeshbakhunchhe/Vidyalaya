import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  FaBookOpen, 
  FaBrain, 
  FaChartLine, 
  FaRobot, 
  FaUsers, 
  FaBell, 
  FaShieldAlt,
  FaGraduationCap,
  FaLightbulb,
  FaTrophy,
  FaFileUpload,
  FaClock
} from 'react-icons/fa';

const Features = () => {
  const features = [
    {
      icon: FaBookOpen,
      title: 'Centralized Study Materials',
      description: 'Access all your study materials in one organized platform. Upload, browse, and download resources by subject, category, and level.',
      color: 'from-blue-500 to-cyan-500',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: FaBrain,
      title: 'AI-Powered Recommendations',
      description: 'Get personalized study material suggestions powered by Gemini AI based on your learning patterns, subject preferences, and academic goals.',
      color: 'from-purple-500 to-pink-500',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: FaChartLine,
      title: 'Study Analytics & Insights',
      description: 'Track your learning progress with detailed analytics. Monitor screen time, subject activity, engagement patterns, and consistency streaks.',
      color: 'from-green-500 to-emerald-500',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: FaGraduationCap,
      title: 'Grade Trend Prediction',
      description: 'Receive intelligent grade predictions based on your study engagement, participation level, and learning consistency using advanced algorithms.',
      color: 'from-orange-500 to-red-500',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      icon: FaRobot,
      title: 'AI Tutor Support',
      description: 'Get instant help when you\'re stuck. Ask questions and receive step-by-step explanations from our intelligent AI tutor available 24/7.',
      color: 'from-indigo-500 to-blue-500',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      icon: FaBell,
      title: 'Real-Time Notifications',
      description: 'Stay updated with instant notifications powered by Socket.IO. Get alerts for new materials, course updates, and important announcements.',
      color: 'from-yellow-500 to-amber-500',
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      icon: FaUsers,
      title: 'Collaborative Learning',
      description: 'Join a vibrant academic community. Share notes, collaborate with peers from different institutions, and learn together.',
      color: 'from-teal-500 to-cyan-500',
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20'
    },
    {
      icon: FaFileUpload,
      title: 'Easy Material Upload',
      description: 'Contribute to the learning community by uploading your own study materials. All uploads are verified by moderators for quality assurance.',
      color: 'from-rose-500 to-pink-500',
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20'
    },
    {
      icon: FaShieldAlt,
      title: 'Secure Admin Dashboard',
      description: 'Administrators can manage uploads, verify content quality, moderate users, and ensure platform integrity through a comprehensive dashboard.',
      color: 'from-slate-500 to-gray-500',
      iconColor: 'text-slate-600 dark:text-slate-300',
      bgColor: 'bg-slate-50 dark:bg-slate-900/20'
    },
    {
      icon: FaTrophy,
      title: 'Learning Achievements',
      description: 'Track your milestones, earn badges, and celebrate your progress. Stay motivated with gamified learning elements and achievement tracking.',
      color: 'from-amber-500 to-yellow-500',
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      icon: FaLightbulb,
      title: 'Adaptive Learning Paths',
      description: 'Experience personalized learning journeys that adapt to your pace and style. Get content recommendations that match your skill level.',
      color: 'from-violet-500 to-purple-500',
      iconColor: 'text-violet-600',
      bgColor: 'bg-violet-50 dark:bg-violet-900/20'
    },
    {
      icon: FaClock,
      title: 'Progress Tracking',
      description: 'Monitor your daily study habits, track time spent on each subject, and maintain consistency with detailed progress reports and insights.',
      color: 'from-cyan-500 to-blue-500',
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20'
    }
  ];

  const benefits = [
    {
      title: 'For Students',
      items: [
        'Access structured learning materials anytime, anywhere',
        'Receive personalized study recommendations',
        'Track progress and improve study habits',
        'Get instant AI tutoring support',
        'Connect with peers across institutions'
      ]
    },
    {
      title: 'For Educators',
      items: [
        'Share quality educational resources',
        'Monitor student engagement and progress',
        'Provide targeted learning support',
        'Build collaborative learning communities',
        'Ensure content quality through moderation'
      ]
    },
    {
      title: 'For Institutions',
      items: [
        'Centralized platform for academic resources',
        'Data-driven insights into student learning',
        'Reduce educational inequality',
        'Foster cross-institutional collaboration',
        'Modern, scalable learning infrastructure'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                Powerful Features for Smarter Learning
              </h1>
              <p className="text-xl text-primary-100 max-w-3xl mx-auto">
                Discover how Vidyalaya combines AI technology, analytics, and collaborative tools to transform your learning experience
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`text-2xl ${feature.iconColor} dark:text-white`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-white dark:bg-slate-900 py-16 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
                Benefits for Everyone
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Vidyalaya is designed to support every stakeholder in the educational ecosystem
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    {benefit.title}
                  </h3>
                  <ul className="space-y-4">
                    {benefit.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
                        </div>
                        <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Powered by cutting-edge technologies for a fast, secure, and reliable experience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'React.js', description: 'Modern UI' },
              { name: 'Node.js', description: 'Scalable Backend' },
              { name: 'MongoDB', description: 'Flexible Database' },
              { name: 'Gemini AI', description: 'Smart Recommendations' },
              { name: 'Socket.IO', description: 'Real-time Updates' },
              { name: 'Express.js', description: 'Robust API' },
              { name: 'Vercel', description: 'Fast Hosting' },
              { name: 'Render', description: 'Reliable Deployment' }
            ].map((tech, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {tech.name}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {tech.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of students already learning smarter with Vidyalaya
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-primary-600 bg-white dark:bg-slate-900 hover:bg-primary-50 shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Free
              </Link>
              <Link
                to="/explore-courses"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-white border-2 border-white hover:bg-white dark:bg-slate-900/10 transition-all"
              >
                Explore Courses
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
