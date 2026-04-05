import { useState } from 'react';
import {
  FaCheckCircle,
  FaEnvelope,
  FaExclamationCircle,
  FaLock,
  FaUser,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import CloudinaryAvatarUpload from '../components/uploads/CloudinaryAvatarUpload';

const AdminProfile = () => {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');


  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');


  const inputClass =
    'w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm';

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const payload = {
        name: profileData.name,
        email: profileData.email,
      };
      const updated = await authAPI.updateProfile(payload);
      updateUser(updated);
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

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View and update your admin account information.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <CloudinaryAvatarUpload user={user} onUserUpdated={updateUser} />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Role: {user?.role}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FaUser className="text-primary-500" />
            <span>Profile details</span>
          </h2>

          {profileSuccess && (
            <div className="mb-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
              <FaCheckCircle />
              <span>{profileSuccess}</span>
            </div>
          )}
          {profileError && (
            <div className="mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <FaExclamationCircle />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full name
              </label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Admin name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2 text-sm"
            >
              {profileLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  <span>Save changes</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FaLock className="text-primary-500" />
            <span>Update password</span>
          </h2>

          {passwordSuccess && (
            <div className="mb-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
              <FaCheckCircle />
              <span>{passwordSuccess}</span>
            </div>
          )}
          {passwordError && (
            <div className="mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <FaExclamationCircle />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              {
                key: 'currentPassword',
                label: 'Current password',
                placeholder: 'Enter current password',
              },
              {
                key: 'newPassword',
                label: 'New password',
                placeholder: 'At least 6 characters',
              },
              {
                key: 'confirmPassword',
                label: 'Confirm new password',
                placeholder: 'Repeat new password',
              },
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
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2 text-sm"
            >
              {passwordLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Updating…</span>
                </>
              ) : (
                <>
                  <FaLock />
                  <span>Change password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;