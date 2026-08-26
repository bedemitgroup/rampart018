export const BASE = 'http://localhost:5000';

async function request(path, options = {}) {
  const token = localStorage.getItem('bedem_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Greška na serveru');
  }
  return res.status === 204 ? null : res.json();
}

async function uploadRequest(path, formData) {
  const token = localStorage.getItem('bedem_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Greška na serveru');
  }
  return res.json();
}

export const api = {
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/api/auth/me'),
  getComments: (slug) => request(`/api/comments/${slug}`),
  postComment: (data) => request('/api/comments', { method: 'POST', body: JSON.stringify(data) }),
  approveComment: (id) => request(`/api/comments/${id}/approve`, { method: 'PUT' }),
  deleteComment: (id) => request(`/api/comments/${id}`, { method: 'DELETE' }),
  getVotes: (slug) => request(`/api/votes/vest/${slug}`),
  voteVest: (data) => request('/api/votes/vest', { method: 'POST', body: JSON.stringify(data) }),
  voteComment: (data) => request('/api/votes/comment', { method: 'POST', body: JSON.stringify(data) }),
  getNews: () => request('/api/news'),
  getNewsBySlug: (slug) => request(`/api/news/${slug}`),
  createNews: (data) => request('/api/news', { method: 'POST', body: JSON.stringify(data) }),
  updateNews: (id, data) => request(`/api/news/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNews: (id) => request(`/api/news/${id}`, { method: 'DELETE' }),
  moveNews: (id, direction) => request(`/api/news/${id}/move`, { method: 'PUT', body: JSON.stringify({ direction }) }),
  createMembershipApplication: (data) =>
  request('/api/membership-applications', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

getMembershipApplications: () =>
  request('/api/membership-applications'),

getMembershipApplication: (id) =>
  request(`/api/membership-applications/${id}`),
getProblemReports: () =>
  request('/api/problem-reports'),

getProblemReport: (id) =>
  request(`/api/problem-reports/${id}`),

createProblemReport: (data) =>
  request('/api/problem-reports', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  uploadNewsImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadRequest('/api/news/upload-image', formData);
  },
};
