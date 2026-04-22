// ProfilePage.jsx

// ── React & routing ───────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Auth & API ────────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

// ── Layout shell & components ─────────────────────────────────────────────────
import StudentShell from '../components/StudentShell';
import CloudinaryAvatarUpload from '../components/uploads/CloudinaryAvatarUpload';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSpinner,
  FaShieldAlt,
  FaBell,
  FaTrash,
  FaGraduationCap,
  FaBriefcase,
  FaChalkboardTeacher,
} from 'react-icons/fa';

// =============================================================================
// Constants
// =============================================================================

// Sidebar navigation sections
const SECTIONS = [
  { id: 'profile',       label: 'Profile Info',    icon: FaUser      },
  { id: 'password',      label: 'Password',        icon: FaLock      },
  { id: 'account',       label: 'Account',         icon: FaShieldAlt },
];

// Notification preference list — label + description pairs
const NOTIF_ITEMS = [
  { key: 'newLesson',         label: 'New Lesson Added',         desc: 'When a new lesson is added to your enrolled course' },
  { key: 'deadlineReminder',  label: 'Deadline Reminders',       desc: 'Reminders about upcoming quiz and assignment deadlines' },
  { key: 'announcements',     label: 'Instructor Announcements', desc: 'When your instructor posts an announcement' },
  { key: 'weeklyReport',      label: 'Weekly Progress Report',   desc: 'A summary of your learning activity every week' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared Tailwind string for all text inputs.
// focus:ring-blue-500 replaces the former primary-500 token.
// ─────────────────────────────────────────────────────────────────────────────
const INPUT_CLASS =
  'w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm ' +
  'bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all ' +
  'focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 dark:border-slate-600';

// =============================================================================
// Sub-components
// =============================================================================

// ── StatusBanner ──────────────────────────────────────────────────────────────
// Reusable inline success / error feedback banner used in both form sections.
const StatusBanner = ({ success, error }) => (
  <>
    {success && (
      <div
        role="status"
        className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl text-green-700 text-sm flex items-center gap-2"
      >
        <FaCheckCircle className="flex-shrink-0" /><span>{success}</span>
      </div>
    )}
    {error && (
      <div
        role="alert"
        className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-700 text-sm flex items-center gap-2"
      >
        <FaExclamationCircle className="flex-shrink-0" /><span>{error}</span>
      </div>
    )}
  </>
);

// ── PasswordRule ──────────────────────────────────────────────────────────────
// Single row in the password strength checklist — uses icons instead of emoji.
const PasswordRule = ({ met, label }) => (
  <p className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-slate-400'}`}>
    {met
      ? <FaCheckCircle  className="text-green-500 text-[10px]" />
      : <FaTimesCircle  className="text-slate-300 text-[10px]" />
    }
    {label}
  </p>
);

// ── PrimaryButton ─────────────────────────────────────────────────────────────
// Consistent CTA button used in profile and password forms.
const PrimaryButton = ({ loading, loadingLabel, idleIcon: IdleIcon, idleLabel, ...rest }) => (
  <button
    {...rest}
    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow hover:shadow-md flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
  >
    {loading ? (
      <><FaSpinner className="animate-spin" /><span>{loadingLabel}</span></>
    ) : (
      <><IdleIcon /><span>{idleLabel}</span></>
    )}
  </button>
);

// =============================================================================
// ProfilePage
// =============================================================================
const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const isTeacher = user?.role === 'teacher';

  const [activeSection, setActiveSection] = useState('profile');

  // ── Profile form state ──────────────────────────────────────────────────────
  const [profileData,    setProfileData]    = useState({ name: '', email: '', degree: '', yearsOfTeaching: '', experienceDescription: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError,   setProfileError]   = useState('');

  // Pre-fill form when user data is available
  useEffect(() => {
    if (user) {
      setProfileData({
        name:                  user.name                  || '',
        email:                 user.email                 || '',
        degree:                user.degree                || '',
        yearsOfTeaching:       user.yearsOfTeaching       ?? '',
        experienceDescription: user.experienceDescription || '',
      });
    }
  }, [user]);

  // ── Password form state ─────────────────────────────────────────────────────
  const [passwordData,    setPasswordData]    = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError,   setPasswordError]   = useState('');

  // ── Notification preferences (mock — not wired to API yet) ─────────────────
  const [notifPrefs, setNotifPrefs] = useState({ newLesson: true, deadlineReminder: true, announcements: false, weeklyReport: true });

  // ── Delete account confirmation state ──────────────────────────────────────
  // Using in-component state instead of window.alert() for consistent UX
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Handlers (logic unchanged) ──────────────────────────────────────────────

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const payload = {
        name:  profileData.name,
        email: profileData.email,
        ...(isTeacher && {
          degree:                profileData.degree,
          yearsOfTeaching:       Number(profileData.yearsOfTeaching) || 0,
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword)
      return setPasswordError('New passwords do not match');
    if (passwordData.newPassword.length < 6)
      return setPasswordError('Password must be at least 6 characters');
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <StudentShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Page heading */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">My Profile</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Avatar + identity card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
              <CloudinaryAvatarUpload user={user} onUserUpdated={updateUser} />
              <h3 className="font-bold text-slate-900 dark:text-white mt-2">{user?.name}</h3>
              <p
                className="text-sm text-slate-500 dark:text-slate-400 break-words overflow-hidden"
                title={user?.email}
              >
                {user?.email}
              </p>

              {/* Role badge */}
              <span
                className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  isTeacher
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700'
                }`}
              >
                {isTeacher
                  ? <FaChalkboardTeacher className="text-[10px]" />
                  : <FaGraduationCap     className="text-[10px]" />
                }
                {user?.role}
              </span>

              <p className="text-xs text-slate-400 mt-3">
                Member since{' '}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'N/A'}
              </p>
            </div>

            {/* Section navigation */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  aria-current={activeSection === id ? 'page' : undefined}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left',
                    activeSection === id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900',
                  ].join(' ')}
                >
                  <Icon className="text-sm flex-shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Main content area ───────────────────────────────────────────── */}
          <div className="lg:col-span-3">

            {/* ══ Profile Info ════════════════════════════════════════════════ */}
            {activeSection === 'profile' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                  <FaUser className="text-blue-500" /><span>Profile Information</span>
                </h3>

                <StatusBanner success={profileSuccess} error={profileError} />

                <form onSubmit={handleProfileSave} className="space-y-5">

                  {/* Full name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Your full name"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData((p) => ({ ...p, email: e.target.value }))}
                        placeholder="your@email.com"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {/* Role — read-only, cannot be changed post-registration */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
                    <input
                      type="text"
                      value={user?.role || 'student'}
                      disabled
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 text-sm capitalize cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">Role cannot be changed after registration</p>
                  </div>

                  {/* Teacher-only fields */}
                  {isTeacher && (
                    <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Teacher Details
                      </p>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Degree</label>
                        <div className="relative">
                          <FaGraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                          <input
                            type="text"
                            value={profileData.degree}
                            onChange={(e) => setProfileData((p) => ({ ...p, degree: e.target.value }))}
                            placeholder="e.g. M.Sc. Computer Science"
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Years of Teaching</label>
                        <div className="relative">
                          <FaBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={profileData.yearsOfTeaching}
                            onChange={(e) => setProfileData((p) => ({ ...p, yearsOfTeaching: e.target.value }))}
                            placeholder="e.g. 5"
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
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
                          placeholder="Describe your teaching background, subjects, and expertise…"
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 outline-none resize-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 dark:border-slate-600"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <PrimaryButton
                      type="submit"
                      disabled={profileLoading}
                      loading={profileLoading}
                      loadingLabel="Saving…"
                      idleIcon={FaCheckCircle}
                      idleLabel="Save Changes"
                    />
                  </div>
                </form>
              </div>
            )}

            {/* ══ Password ════════════════════════════════════════════════════ */}
            {activeSection === 'password' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <FaLock className="text-blue-500" /><span>Change Password</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Choose a strong password to keep your account secure.</p>

                <StatusBanner success={passwordSuccess} error={passwordError} />

                <form onSubmit={handlePasswordChange} className="space-y-5">
                  {[
                    { label: 'Current Password',     key: 'currentPassword', placeholder: 'Enter current password' },
                    { label: 'New Password',          key: 'newPassword',     placeholder: 'At least 6 characters'  },
                    { label: 'Confirm New Password',  key: 'confirmPassword', placeholder: 'Repeat new password'    },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
                      <div className="relative">
                        <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                        <input
                          type="password"
                          value={passwordData[field.key]}
                          onChange={(e) => setPasswordData((p) => ({ ...p, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Password strength checklist — only visible while typing */}
                  {passwordData.newPassword && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5">
                      <PasswordRule met={passwordData.newPassword.length >= 6}          label="At least 6 characters"  />
                      <PasswordRule met={/[A-Z]/.test(passwordData.newPassword)}        label="One uppercase letter"   />
                      <PasswordRule met={/[0-9]/.test(passwordData.newPassword)}        label="One number"             />
                    </div>
                  )}

                  <PrimaryButton
                    type="submit"
                    disabled={passwordLoading}
                    loading={passwordLoading}
                    loadingLabel="Updating…"
                    idleIcon={FaShieldAlt}
                    idleLabel="Update Password"
                  />
                </form>
              </div>
            )}

            {/* ══ Account ══════════════════════════════════════════════════════ */}
            {activeSection === 'account' && (
              <div className="space-y-6">

                {/* Account details read-out */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                    <FaShieldAlt className="text-blue-500" /><span>Account Details</span>
                  </h3>
                  <div className="space-y-0 divide-y divide-slate-100">
                    {[
                      { label: 'Account ID',    value: user?.id || 'N/A' },
                      { label: 'Email Verified', value: user?.isEmailVerified ? 'Verified' : 'Not Verified', verified: user?.isEmailVerified },
                      { label: 'Account Type',  value: user?.role || 'student' },
                      { label: 'Joined',         value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
                      ...(isTeacher ? [
                        { label: 'Degree',              value: user?.degree || 'Not set' },
                        { label: 'Teaching Experience', value: user?.yearsOfTeaching != null ? `${user.yearsOfTeaching} years` : 'Not set' },
                      ] : []),
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-3">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className={`text-sm font-medium capitalize ${item.verified === false ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger zone */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-red-200 dark:border-red-800/30 p-6">
                  <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                    <FaTrash /><span>Danger Zone</span>
                  </h3>
                  <div className="space-y-3">

                    {/* Log out all devices */}
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Log out of all devices</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Revoke all active sessions</p>
                      </div>
                      <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        Log Out
                      </button>
                    </div>

                    {/* Delete account — password required to confirm */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Delete Account</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Permanently delete your account, enrollments, progress, and (for teachers) courses you created.
                          </p>
                        </div>
                        {!showDeleteConfirm ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setDeleteError('');
                              setDeletePassword('');
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 self-start"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                      {showDeleteConfirm && (
                        <div className="space-y-2 pt-1 border-t border-red-200/60 dark:border-red-800/40">
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                            Enter your password to confirm
                            <input
                              type="password"
                              autoComplete="current-password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              className={
                                'mt-1 w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm ' +
                                'bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none ' +
                                'focus:ring-2 focus:ring-red-500 focus:border-transparent'
                              }
                              placeholder="Current password"
                            />
                          </label>
                          {deleteError && (
                            <p className="text-xs text-red-600 dark:text-red-400" role="alert">{deleteError}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={deleteLoading}
                              onClick={async () => {
                                setDeleteError('');
                                if (!deletePassword.trim()) {
                                  setDeleteError('Password is required');
                                  return;
                                }
                                setDeleteLoading(true);
                                try {
                                  await authAPI.deleteAccount(deletePassword);
                                  logout();
                                  navigate('/login', { replace: true });
                                } catch (err) {
                                  const msg =
                                    err.response?.data?.message ||
                                    err.response?.data?.errors?.[0]?.msg ||
                                    err.message ||
                                    'Could not delete account';
                                  setDeleteError(msg);
                                } finally {
                                  setDeleteLoading(false);
                                }
                              }}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
                            </button>
                            <button
                              type="button"
                              disabled={deleteLoading}
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeletePassword('');
                                setDeleteError('');
                              }}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
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