// services/api.js
// Drop-in replacement / extension for your existing api.js.
// Adds: courseAPI.getCreatedCourses, createCourse, updateCourse, deleteCourse
//       authAPI.updateProfile (extended payload), authAPI.uploadAvatar

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

// ── Auth header injection ────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return { token: data.token, user: data.user };
  },

  // signup accepts a full payload object (including teacher fields)
  signup: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.user;
  },

  verifyOtp: async (email, otp) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    return { token: data.token, user: data.user };
  },

  resendSignupOtp: async (email) => {
    const { data } = await api.post('/auth/resend-signup-otp', { email });
    return data;
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  verifyResetOtp: async (email, otp) => {
    const { data } = await api.post('/auth/verify-reset-otp', { email, otp });
    return data;
  },

  resetPasswordWithOtp: async (email, otp, newPassword) => {
    const { data } = await api.post('/auth/reset-password', {
      email,
      otp,
      newPassword,
    });
    return data;
  },

  // updateProfile accepts a full payload object now (name, email + teacher fields)
  updateProfile: async (payload) => {
    const { data } = await api.put('/auth/profile', payload);
    return data.user;
  },

  updateTheme: async (themePreference) => {
    const { data } = await api.put('/auth/theme', { themePreference });
    return data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
    return data;
  },

  /** Permanently delete the logged-in account (requires current password). */
  deleteAccount: async (password) => {
    const { data } = await api.delete('/auth/account', { data: { password } });
    return data;
  },

  // Upload avatar — sends multipart/form-data
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/auth/avatar', formData);
    return data.user;
  },
};

// ── Admin API (user/teacher management) ───────────────────────────────────────
export const adminAPI = {
  // List users; optional filters via params (e.g. { role: 'teacher' })
  getUsers: async (params = {}) => {
    const { data } = await api.get('/auth/admin/users', { params });
    return data.users;
  },

  // Create a new user (student/teacher/admin)
  createUser: async (payload) => {
    const { data } = await api.post('/auth/admin/users', payload);
    return data.user;
  },

  // Update an existing user
  updateUser: async (id, payload) => {
    const { data } = await api.put(`/auth/admin/users/${id}`, payload);
    return data.user;
  },

  // Delete a user
  deleteUser: async (id) => {
    const { data } = await api.delete(`/auth/admin/users/${id}`);
    return data;
  },

  getPendingTeachers: async () => {
    const { data } = await api.get('/auth/admin/pending-teachers');
    return data.users;
  },

  approveTeacher: async (id) => {
    const { data } = await api.put(`/auth/admin/approve-teacher/${id}`);
    return data.user;
  },

  rejectTeacher: async (id) => {
    const { data } = await api.delete(`/auth/admin/reject-teacher/${id}`);
    return data;
  },

  // Dashboard stats: total users / teachers / admins
  getStats: async () => {
    const { data } = await api.get('/auth/admin/stats');
    return data.stats;
  },
};

// ── Course API ────────────────────────────────────────────────────────────────
export const courseAPI = {
  // Public: list all published courses with optional filters
  getCourses: async (params = {}) => {
    const { data } = await api.get('/courses', { params });
    return data;
  },

  // Public: single course detail
  getCourse: async (id) => {
    const { data } = await api.get(`/courses/${id}`);
    return data;
  },

  // Protected (student): courses the current user is enrolled in
  getEnrolledCourses: async () => {
    const { data } = await api.get('/courses/my/enrolled');
    return data;
  },

  // Protected (teacher/admin): courses created by the current user
  getCreatedCourses: async () => {
    const { data } = await api.get('/courses/my/created');
    return data;
  },

  // Protected (teacher/admin): create a new course
  createCourse: async (payload) => {
    const { data } = await api.post('/courses', payload);
    return data;
  },

  // Protected (teacher/admin): update an existing course
  updateCourse: async (id, payload) => {
    const { data } = await api.put(`/courses/${id}`, payload);
    return data;
  },

  // Protected (teacher/admin): delete a course
  deleteCourse: async (id) => {
    const { data } = await api.delete(`/courses/${id}`);
    return data;
  },

  // Protected (teacher/admin): upload/replace course thumbnail (Cloudinary image)
  uploadCourseThumbnail: async (courseId, file, { onUploadProgress } = {}) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    const { data } = await api.post(`/courses/${courseId}/thumbnail`, formData, {
      onUploadProgress,
    });
    return data.course;
  },

  // Protected (teacher/admin): upload a single course video.
  // Frontend can upload multiple files (1-2 mins each) with separate calls
  // to show progress per file.
  uploadCourseVideo: async (courseId, file, { title, onUploadProgress } = {}) => {
    const formData = new FormData();
    formData.append('video', file);
    if (title) formData.append('title', title);
    const { data } = await api.post(`/courses/${courseId}/videos`, formData, {
      onUploadProgress,
    });
    return { video: data.video, course: data.course };
  },

  // Protected (student): gated course learning content (videos only if access is granted)
  getCourseLearning: async (courseId) => {
    const { data } = await api.get(`/courses/${courseId}/learning`);
    return data;
  },

  // Protected (student): enroll in a course
  enrollCourse: async (id) => {
    const { data } = await api.post('/enrollments', { courseId: id });
    return data;
  },

  // Protected (student): unenroll from a course
  unenrollCourse: async (id) => {
    const { data } = await api.delete(`/courses/${id}/enroll`);
    return data;
  },

  // Protected (enrolled student): rate a course
  rateCourse: async (id, rating) => {
    const { data } = await api.post(`/courses/${id}/rate`, { rating });
    return data;
  },
};

// ── Enrollment API (requests) ───────────────────────────────────────────────────
export const enrollmentAPI = {
  // Student: check status for a specific course
  getStatus: async (courseId) => {
    const { data } = await api.get(`/enrollments/status/${courseId}`);
    return data.enrollment;
  },

  // Student: create enrollment request
  requestEnrollment: async (courseId) => {
    const { data } = await api.post('/enrollments', { courseId });
    return data.enrollment;
  },

  // Teacher/Admin: list requests for teaching courses (or all, if admin)
  getTeachingRequests: async () => {
    const { data } = await api.get('/enrollments/teaching');
    return data;
  },

  // Teacher/Admin: approve
  approve: async (id) => {
    const { data } = await api.post(`/enrollments/${id}/approve`);
    return data.enrollment;
  },

  // Teacher/Admin: reject
  reject: async (id) => {
    const { data } = await api.post(`/enrollments/${id}/reject`);
    return data.enrollment;
  },
};

// ── Payment API (Khalti) ───────────────────────────────────────────────────────
export const paymentAPI = {
  // Initiate Khalti checkout for an approved paid enrollment
  // POST /api/payments/initiate { enrollmentId }
  initiate: async (enrollmentId) => {
    const { data } = await api.post('/payments/initiate', { enrollmentId });
    return data;
  },

  // Verify Khalti payment after redirect back to /payment/verify?pidx=...
  // POST /api/payments/verify { pidx }
  verify: async (pidx) => {
    const { data } = await api.post('/payments/verify', { pidx });
    return data;
  },

  // Optional utility: student's own payment history
  history: async () => {
    const { data } = await api.get('/payments/history');
    return data;
  },

  // Teacher: payment history for courses created by the current teacher
  teacherHistory: async () => {
    const { data } = await api.get('/payments/teacher/history');
    return data;
  },

  // Download PDF receipt for a completed payment
  // Returns a Blob
  downloadReceipt: async (paymentId) => {
    const res = await api.get(`/payments/${paymentId}/receipt`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // Teacher: download payment record PDF (teacher-owned course payment)
  // Returns a Blob
  downloadTeacherReceipt: async (paymentId) => {
    const res = await api.get(`/payments/teacher/${paymentId}/receipt`, {
      responseType: 'blob',
    });
    return res.data;
  },
};

// ── Assignments API ──────────────────────────────────────────────────────────
export const assignmentAPI = {
  // Student: list my assignments
  getMyAssignments: async () => {
    const { data } = await api.get('/assignments');
    return data;
  },

  // Teacher: list assignments they created
  getTeacherAssignments: async () => {
    const { data } = await api.get('/assignments/teacher');
    return data;
  },

  // Teacher: create assignment
  createAssignment: async (payload) => {
    const { data } = await api.post('/assignments', payload);
    return data;
  },

  // Student: submit quiz answers
  submitQuiz: async (assignmentId, answers) => {
    const { data } = await api.post(`/assignments/${assignmentId}/submissions/quiz`, { answers });
    return data;
  },

  // Student: submit project file
  submitProject: async (assignmentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(
      `/assignments/${assignmentId}/submissions/project`,
      formData
    );
    return data;
  },

  // Teacher: view submissions for an assignment
  getSubmissions: async (assignmentId) => {
    const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
    return data;
  },

  // Teacher: grade a submission
  gradeSubmission: async (assignmentId, submissionId, payload) => {
    const { data } = await api.post(
      `/assignments/${assignmentId}/submissions/${submissionId}/grade`,
      payload
    );
    return data;
  },
};

// ── Chat API (Gemini tutor) ───────────────────────────────────────────────────
export const chatAPI = {
  // POST /api/chat/gemini (multipart)
  sendGemini: async ({ message, subject = 'general', files = [] }) => {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('subject', subject);
    files.forEach((file) => formData.append('files', file));

    const { data } = await api.post('/chat/gemini', formData);

    return data;
  },

  // GET /api/chat/history?subject=general&limit=50
  getHistory: async ({ subject = 'general', limit = 50 } = {}) => {
    const { data } = await api.get('/chat/history', {
      params: { subject, limit },
    });
    return data;
  },

  // DELETE /api/chat/history?subject=general
  clearHistory: async ({ subject = 'general' } = {}) => {
    const { data } = await api.delete('/chat/history', {
      params: { subject },
    });
    return data;
  },
};

// ── Progress API ─────────────────────────────────────────────────────────────
export const progressAPI = {
  getAllProgress: async () => {
    const { data } = await api.get('/progress');
    // Backend returns {success: true, progresses: [...]}
    return data.progresses; 
  },
  getCourseProgress: async (courseId) => {
    const { data } = await api.get(`/progress/${courseId}`);
    return data.progress;
  },
  markLessonComplete: async (courseId, lessonTitle) => {
    const { data } = await api.post(`/progress/${courseId}/mark-complete`, { lessonTitle });
    return data.progress;
  },
  addWatchTime: async (courseId, timeSpentSeconds) => {
    const { data } = await api.post(`/progress/${courseId}/time`, { timeSpent: timeSpentSeconds });
    return data.progress;
  }
};

// ── Analytics API (Study Analytics) ──────────────────────────────────────────
export const analyticsAPI = {
  getSummary: async (params = {}) => {
    const { data } = await api.get('/analytics/summary', { params });
    return data;
  },
};

export default api;

// ── Leaderboard API ──────────────────────────────────────────────────────────
export const leaderboardAPI = {
  getLeaderboard: async (params = {}) => {
    const { data } = await api.get('/leaderboard', { params });
    return data;
  },
};

// ── Notification API ─────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: async () => {
    const { data } = await api.get('/notifications');
    return data.notifications;
  },
  markAsRead: async (id) => {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data.notification;
  },
  markAllAsRead: async () => {
    const { data } = await api.put('/notifications/read-all');
    return data;
  }
};
