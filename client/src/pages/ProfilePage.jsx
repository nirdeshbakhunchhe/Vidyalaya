import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import StudentShell from '../components/StudentShell';
import {
  FaUser, FaEnvelope, FaLock, FaCamera, FaCheckCircle,
  FaExclamationCircle, FaSpinner, FaShieldAlt, FaBell,
  FaTrash, FaGraduationCap, FaBriefcase, FaChalkboardTeacher,
} from 'react-icons/fa';

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const isTeacher = user?.role === 'teacher';

  const [activeSection, setActiveSection] = useState('profile');

  // ── Profile state ────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    degree: '',
    yearsOfTeaching: '',
    experienceDescription: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        degree: user.degree || '',
        yearsOfTeaching: user.yearsOfTeaching ?? '',
        experienceDescription: user.experienceDescription || '',
      });
    }
  }, [user]);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // ── Avatar state ─────────────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // ── Password state ───────────────────────────────────────────────────────
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ── Notification prefs (mock) ────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    newLesson: true,
    deadlineReminder: true,
    announcements: false,
    weeklyReport: true,
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const payload = {
        name: profileData.name,
        email: profileData.email,
        ...(isTeacher && {
          degree: profileData.degree,
          yearsOfTeaching: Number(profileData.yearsOfTeaching) || 0,
          experienceDescription: profileData.experienceDescription,
        }),
      };
      const updatedUser = await authAPI.updateProfile(payload);
      updateUser(updatedUser);
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show the new photo immediately everywhere (profile + top nav)
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    updateUser({ ...(user || {}), avatar: previewUrl });

    setAvatarLoading(true);
    setAvatarError('');
    try {
      // Persist avatar on the server and update with the final URL
      const updatedUser = await authAPI.uploadAvatar(file);
      updateUser(updatedUser);
    } catch (err) {
      // Revert to previous user state on failure
      setAvatarError(err.response?.data?.message || 'Failed to upload avatar');
      setAvatarPreview('');
      if (user) {
        updateUser(user);
      }
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordError('New passwords do not match');
    }
    if (passwordData.newPassword.length < 6) {
      return setPasswordError('Password must be at least 6 characters');
    }
    setPasswordLoading(true);
    try {
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Sidebar sections ─────────────────────────────────────────────────────
  const sections = [
    { id: 'profile', label: 'Profile Info', icon: FaUser },
    { id: 'password', label: 'Password', icon: FaLock },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'account', label: 'Account', icon: FaShieldAlt },
  ];

  // Compute avatar display (supports both absolute and legacy relative URLs)
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const API_ROOT = API_BASE.replace(/\/api\/?$/, '');
  const rawAvatar = avatarPreview || user?.avatar || '';
  const avatarSrc =
    rawAvatar && !rawAvatar.startsWith('http')
      ? `${API_ROOT}${rawAvatar}`
      : rawAvatar;
  const avatarInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const inputClass =
    'w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm';

  return (
    <StudentShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">My Profile</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">

            {/* Avatar Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center mb-4">
              <div className="relative inline-block mb-4">
                {/* Avatar image or initial */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold mx-auto overflow-hidden ring-4 ring-primary-100 dark:ring-primary-900/30">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    avatarInitial
                  )}
                </div>

                {/* Camera button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors shadow-lg disabled:opacity-60"
                  title="Upload photo"
                >
                  {avatarLoading ? (
                    <FaSpinner className="text-xs animate-spin" />
                  ) : (
                    <FaCamera className="text-xs" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>

              {avatarError && (
                <p className="text-xs text-red-500 mb-2">{avatarError}</p>
              )}

              <h3 className="font-bold text-slate-900 dark:text-white">{user?.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>

              {/* Role badge */}
              <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                isTeacher
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
              }`}>
                {isTeacher ? <FaChalkboardTeacher className="text-xs" /> : <FaGraduationCap className="text-xs" />}
                {user?.role}
              </span>

              <p className="text-xs text-slate-400 mt-3">
                Member since{' '}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'N/A'}
              </p>
            </div>

            {/* Nav */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                    activeSection === s.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <s.icon className="text-sm flex-shrink-0" />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="lg:col-span-3">

            {/* ── Profile Info Section ── */}
            {activeSection === 'profile' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
                  <FaUser className="text-primary-500" /><span>Profile Information</span>
                </h3>

                {profileSuccess && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm flex items-center space-x-2">
                    <FaCheckCircle /><span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center space-x-2">
                    <FaExclamationCircle /><span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSave} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                    <div className="relative">
                      <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData((p) => ({ ...p, name: e.target.value }))}
                        className={inputClass}
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData((p) => ({ ...p, email: e.target.value }))}
                        className={inputClass}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  {/* Role (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
                    <input
                      type="text"
                      value={user?.role || 'student'}
                      disabled
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm capitalize cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">Role cannot be changed after registration</p>
                  </div>

                  {/* ── Teacher-only fields ── */}
                  {isTeacher && (
                    <>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                          Teacher Details
                        </p>
                      </div>

                      {/* Degree */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Degree</label>
                        <div className="relative">
                          <FaGraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                          <input
                            type="text"
                            value={profileData.degree}
                            onChange={(e) => setProfileData((p) => ({ ...p, degree: e.target.value }))}
                            className={inputClass}
                            placeholder="e.g. M.Sc. Computer Science"
                          />
                        </div>
                      </div>

                      {/* Years of Teaching */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Years of Teaching</label>
                        <div className="relative">
                          <FaBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={profileData.yearsOfTeaching}
                            onChange={(e) => setProfileData((p) => ({ ...p, yearsOfTeaching: e.target.value }))}
                            className={inputClass}
                            placeholder="e.g. 5"
                          />
                        </div>
                      </div>

                      {/* Experience Description */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Experience Description
                          <span className="ml-2 text-xs text-slate-400 font-normal">
                            ({profileData.experienceDescription.length}/500)
                          </span>
                        </label>
                        <textarea
                          value={profileData.experienceDescription}
                          onChange={(e) => setProfileData((p) => ({ ...p, experienceDescription: e.target.value }))}
                          rows={4}
                          maxLength={500}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                          placeholder="Describe your teaching background, subjects, and expertise…"
                        />
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                    >
                      {profileLoading
                        ? <><FaSpinner className="animate-spin" /><span>Saving…</span></>
                        : <><FaCheckCircle /><span>Save Changes</span></>
                      }
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Password Section ── */}
            {activeSection === 'password' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center space-x-2">
                  <FaLock className="text-primary-500" /><span>Change Password</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Choose a strong password to keep your account secure.
                </p>

                {passwordSuccess && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm flex items-center space-x-2">
                    <FaCheckCircle /><span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center space-x-2">
                    <FaExclamationCircle /><span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-5">
                  {[
                    { label: 'Current Password', key: 'currentPassword', placeholder: 'Enter current password' },
                    { label: 'New Password', key: 'newPassword', placeholder: 'At least 6 characters' },
                    { label: 'Confirm New Password', key: 'confirmPassword', placeholder: 'Repeat new password' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {field.label}
                      </label>
                      <div className="relative">
                        <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input
                          type="password"
                          value={passwordData[field.key]}
                          onChange={(e) => setPasswordData((p) => ({ ...p, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ))}

                  {passwordData.newPassword && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <p className={passwordData.newPassword.length >= 6 ? 'text-green-600 dark:text-green-400' : ''}>
                        {passwordData.newPassword.length >= 6 ? '✅' : '❌'} At least 6 characters
                      </p>
                      <p className={/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600 dark:text-green-400' : ''}>
                        {/[A-Z]/.test(passwordData.newPassword) ? '✅' : '❌'} One uppercase letter
                      </p>
                      <p className={/[0-9]/.test(passwordData.newPassword) ? 'text-green-600 dark:text-green-400' : ''}>
                        {/[0-9]/.test(passwordData.newPassword) ? '✅' : '❌'} One number
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    {passwordLoading
                      ? <><FaSpinner className="animate-spin" /><span>Updating…</span></>
                      : <><FaShieldAlt /><span>Update Password</span></>
                    }
                  </button>
                </form>
              </div>
            )}

            {/* ── Notifications Section ── */}
            {activeSection === 'notifications' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center space-x-2">
                  <FaBell className="text-primary-500" /><span>Notification Preferences</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Choose what updates you want to receive.</p>

                <div className="space-y-4">
                  {[
                    { key: 'newLesson', label: 'New Lesson Added', desc: 'When a new lesson is added to your enrolled course' },
                    { key: 'deadlineReminder', label: 'Deadline Reminders', desc: 'Reminders about upcoming quiz and assignment deadlines' },
                    { key: 'announcements', label: 'Instructor Announcements', desc: 'When your instructor posts an announcement' },
                    { key: 'weeklyReport', label: 'Weekly Progress Report', desc: 'A summary of your learning activity every week' },
                  ].map((pref) => (
                    <div key={pref.key} className="flex items-start justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{pref.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{pref.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifPrefs((p) => ({ ...p, [pref.key]: !p[pref.key] }))}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notifPrefs[pref.key] ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifPrefs[pref.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>

                <button className="mt-6 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg flex items-center space-x-2 text-sm">
                  <FaCheckCircle /><span>Save Preferences</span>
                </button>
              </div>
            )}

            {/* ── Account Section ── */}
            {activeSection === 'account' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                    <FaShieldAlt className="text-primary-500" /><span>Account Details</span>
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Account ID', value: user?.id || 'N/A' },
                      { label: 'Email Verified', value: user?.isEmailVerified ? '✅ Verified' : '❌ Not Verified' },
                      { label: 'Account Type', value: user?.role || 'student' },
                      { label: 'Joined', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
                      ...(isTeacher ? [
                        { label: 'Degree', value: user?.degree || 'Not set' },
                        { label: 'Teaching Experience', value: user?.yearsOfTeaching != null ? `${user.yearsOfTeaching} years` : 'Not set' },
                      ] : []),
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 p-6">
                  <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center space-x-2">
                    <FaTrash /><span>Danger Zone</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Log out of all devices</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Revoke all active sessions</p>
                      </div>
                      <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        Log Out
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Delete Account</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permanently delete your account and all data</p>
                      </div>
                      <button
                        onClick={() => alert('Contact support to delete your account')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentShell>
  );
};

export default ProfilePage;
