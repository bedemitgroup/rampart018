const BASE = 'http://localhost:5000';

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
};
