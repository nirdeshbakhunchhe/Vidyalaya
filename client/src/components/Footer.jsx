import { Link } from 'react-router-dom';
import logo from '../assets/logo/logo1.png';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaLinkedinIn, 
  FaInstagram, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt 
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/explore-courses' },
    { name: 'Features', path: '/#features' },
    { name: 'About Us', path: '/about' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: FaFacebookF, url: 'https://facebook.com', color: 'hover:text-blue-600' },
    { name: 'Twitter', icon: FaTwitter, url: 'https://twitter.com', color: 'hover:text-sky-500' },
    { name: 'LinkedIn', icon: FaLinkedinIn, url: 'https://linkedin.com', color: 'hover:text-blue-700' },
    { name: 'Instagram', icon: FaInstagram, url: 'https://instagram.com', color: 'hover:text-pink-600' },
  ];

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src={logo} 
                alt="Vidyalaya" 
                className="h-10 w-10 rounded-lg object-contain bg-white transition-transform group-hover:scale-105" 
              />
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Vidyalaya
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              पढ्यो नेपाल बढ्यो नेपाल
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              AI-powered learning platform helping students achieve their academic goals with personalized courses and smart practice.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                <FaMapMarkerAlt className="mt-1 flex-shrink-0 text-primary-600 dark:text-primary-400" />
                <span>Kathmandu, Nepal</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <FaEnvelope className="flex-shrink-0 text-primary-600 dark:text-primary-400" />
                <a 
                  href="mailto:support@vidyalaya.edu.np" 
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  support@vidyalaya.edu.np
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <FaPhone className="flex-shrink-0 text-primary-600 dark:text-primary-400" />
                <a 
                  href="tel:+977-1-1234567" 
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  +977-9762261869
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media & Newsletter */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Connect With Us
            </h3>
            <div className="flex gap-3 mb-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 ${social.color} transition-all hover:scale-110`}
                  aria-label={social.name}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Stay updated with our latest courses and features
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 rounded-lg transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center md:text-left">
              © {currentYear} Vidyalaya. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;