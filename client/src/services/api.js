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

  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
    return data;
  },

  // Upload avatar — sends multipart/form-data
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

export default api;

