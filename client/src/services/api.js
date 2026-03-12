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
    return { token: data.token, user: data.user };
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.user;
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
    const { data } = await api.post(`/courses/${id}/enroll`);
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

export default api;
