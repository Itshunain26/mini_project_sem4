/* ============================================================
   API Helper — Centralized fetch wrapper
   ============================================================ */

const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');
const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};
const setAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login.html';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const api = {
  // Auth
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => apiFetch('/auth/me'),

  // Users
  getProfile: () => apiFetch('/users/profile'),
  updateProfile: (body) => apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  updateStudentProfile: (body) => apiFetch('/users/student-profile', { method: 'PUT', body: JSON.stringify(body) }),
  getCategories: () => apiFetch('/users/categories'),

  // Mentors
  getMentors: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/mentors${q ? '?' + q : ''}`);
  },
  getMentorById: (id) => apiFetch(`/mentors/${id}`),
  getMyMentorProfile: () => apiFetch('/mentors/profile/me'),
  updateMentorProfile: (body) => apiFetch('/mentors/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Requests
  getRequests: () => apiFetch('/requests'),
  sendRequest: (body) => apiFetch('/requests', { method: 'POST', body: JSON.stringify(body) }),
  respondToRequest: (id, body) => apiFetch(`/requests/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  cancelRequest: (id) => apiFetch(`/requests/${id}`, { method: 'DELETE' }),

  // Sessions
  getSessions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/sessions${q ? '?' + q : ''}`);
  },
  createSession: (body) => apiFetch('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  updateSession: (id, body) => apiFetch(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  submitFeedback: (id, body) => apiFetch(`/sessions/${id}/feedback`, { method: 'POST', body: JSON.stringify(body) }),

  // Messages
  getConversations: () => apiFetch('/messages'),
  getThread: (userId) => apiFetch(`/messages/${userId}`),
  sendMessage: (body) => apiFetch('/messages', { method: 'POST', body: JSON.stringify(body) }),

  // Resources
  getResources: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/resources${q ? '?' + q : ''}`);
  },
  addResource: (body) => apiFetch('/resources', { method: 'POST', body: JSON.stringify(body) }),
  deleteResource: (id) => apiFetch(`/resources/${id}`, { method: 'DELETE' }),

  // Progress
  getGoals: () => apiFetch('/progress'),
  getProgressSummary: () => apiFetch('/progress/summary'),
  createGoal: (body) => apiFetch('/progress', { method: 'POST', body: JSON.stringify(body) }),
  updateGoal: (id, body) => apiFetch(`/progress/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteGoal: (id) => apiFetch(`/progress/${id}`, { method: 'DELETE' }),

  // Admin
  getAdminStats: () => apiFetch('/admin/stats'),
  getAllUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/admin/users${q ? '?' + q : ''}`);
  },
  toggleUserStatus: (id) => apiFetch(`/admin/users/${id}/toggle`, { method: 'PUT' }),
  deleteUser: (id) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
};

// ── Toast Notifications ──────────────────────────────────────
const showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || icons.info}</span><span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
  toast.onclick = () => toast.remove();
};

// ── Auth Guard ───────────────────────────────────────────────
const requireAuth = (allowedRoles = []) => {
  const user = getUser();
  const token = getToken();
  if (!user || !token) { window.location.href = '/login.html'; return null; }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) { window.location.href = '/login.html'; return null; }
  return user;
};

// ── Render Avatar ────────────────────────────────────────────
const renderAvatar = (name, size = 'md', imgUrl = null) => {
  const initial = (name || '?').charAt(0).toUpperCase();
  if (imgUrl) return `<img src="${imgUrl}" class="avatar avatar-${size}" alt="${name}">`;
  return `<div class="avatar avatar-${size}">${initial}</div>`;
};

// ── Stars renderer ───────────────────────────────────────────
const renderStars = (rating) => {
  let html = '<span class="stars">';
  for (let i = 1; i <= 5; i++) html += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
  return html + '</span>';
};

// ── Logout ───────────────────────────────────────────────────
const logout = () => {
  clearAuth();
  window.location.href = '/index.html';
};
