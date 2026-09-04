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
  getUsers: () => request('/api/users'),
  createStaffAccount: (data) => request('/api/users/staff', { method: 'POST', body: JSON.stringify(data) }),
  changeUserRole: (id, role) => request(`/api/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deactivateUser: (id) => request(`/api/users/${id}/deactivate`, { method: 'PUT' }),
  activateUser: (id) => request(`/api/users/${id}/activate`, { method: 'PUT' }),
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
  getFinanceOverview: (year) => request(`/api/finance/overview${year ? `?year=${year}` : ''}`),
  getFinanceCategories: () => request('/api/finance/categories'),
  createFinanceCategory: (data) => request('/api/finance/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateFinanceCategory: (id, data) => request(`/api/finance/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFinanceCategory: (id) => request(`/api/finance/categories/${id}`, { method: 'DELETE' }),
  moveFinanceCategory: (id, direction) => request(`/api/finance/categories/${id}/move`, { method: 'PUT', body: JSON.stringify({ direction }) }),
  getFinanceEntries: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.year) params.set('year', filters.year);
    if (filters.type) params.set('type', filters.type);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    const query = params.toString();
    return request(`/api/finance/entries${query ? `?${query}` : ''}`);
  },
  getFinanceEntry: (id) => request(`/api/finance/entries/${id}`),
  createFinanceEntry: (data) => request('/api/finance/entries', { method: 'POST', body: JSON.stringify(data) }),
  updateFinanceEntry: (id, data) => request(`/api/finance/entries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFinanceEntry: (id) => request(`/api/finance/entries/${id}`, { method: 'DELETE' }),
  getFinanceYears: () => request('/api/finance/years'),
  saveFinanceYear: (year, data) => request(`/api/finance/years/${year}`, { method: 'PUT', body: JSON.stringify(data) }),
  saveFinanceQuarter: (year, quarter, status) => request(`/api/finance/quarters/${year}/${quarter}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  createMembershipApplication: (data) => request('/api/membership-applications', { method: 'POST', body: JSON.stringify(data) }),
  getMembershipApplications: () => request('/api/membership-applications'),
  createProblemReport: (data) => request('/api/problem-reports', { method: 'POST', body: JSON.stringify(data) }),
  getProblemReports: () => request('/api/problem-reports'),
  getAuditLogs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.actorUserId) params.set('actorUserId', filters.actorUserId);
    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.action) params.set('action', filters.action);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', filters.page);
    if (filters.pageSize) params.set('pageSize', filters.pageSize);
    const query = params.toString();
    return request(`/api/audit-logs${query ? `?${query}` : ''}`);
  },
  getAuditLogFilters: () => request('/api/audit-logs/filters'),
  getAssemblySessions: (status) =>
    request(`/api/assembly/sessions${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  getCurrentAssemblySession: () => request('/api/assembly/sessions/current'),
  getAssemblySession: (id) => request(`/api/assembly/sessions/${id}`),
  getAssemblyHall: (id) => request(`/api/assembly/sessions/${id}/hall`),
  createAssemblySession: (data) => request('/api/assembly/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateAssemblySession: (id, data) => request(`/api/assembly/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setAssemblySessionStatus: (id, status) => request(`/api/assembly/sessions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteAssemblySession: (id) => request(`/api/assembly/sessions/${id}`, { method: 'DELETE' }),
  setAssemblyRsvp: (id, response, note) => request(`/api/assembly/sessions/${id}/rsvp`, { method: 'PUT', body: JSON.stringify({ response, note }) }),
  setAssemblyCheckIn: (id, mode) => request(`/api/assembly/sessions/${id}/check-in`, { method: 'PUT', body: JSON.stringify({ mode }) }),
  getAssemblyTopics: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.sessionId) params.set('sessionId', filters.sessionId);
    if (filters.backlog) params.set('backlog', 'true');
    const query = params.toString();
    return request(`/api/assembly/topics${query ? `?${query}` : ''}`);
  },
  createAssemblyTopic: (data) => request('/api/assembly/topics', { method: 'POST', body: JSON.stringify(data) }),
  updateAssemblyTopic: (id, data) => request(`/api/assembly/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reviewAssemblyTopic: (id, status, note) => request(`/api/assembly/topics/${id}/review`, { method: 'PUT', body: JSON.stringify({ status, note }) }),
  withdrawAssemblyTopic: (id) => request(`/api/assembly/topics/${id}/withdraw`, { method: 'PUT' }),
  assignAssemblyTopic: (id, sessionId) => request(`/api/assembly/topics/${id}/assign`, { method: 'PUT', body: JSON.stringify({ sessionId }) }),
  moveAssemblyTopic: (id, direction) => request(`/api/assembly/topics/${id}/move`, { method: 'PUT', body: JSON.stringify({ direction }) }),
  deleteAssemblyTopic: (id) => request(`/api/assembly/topics/${id}`, { method: 'DELETE' }),
  setAssemblyVoting: (id, status) => request(`/api/assembly/topics/${id}/voting`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAssemblyTally: (id) => request(`/api/assembly/topics/${id}/tally`),
  castAssemblyVote: (id, choice) => request(`/api/assembly/topics/${id}/votes`, { method: 'POST', body: JSON.stringify({ choice }) }),
  overrideAssemblyAttendance: (sessionId, userId, mode) =>
    request(`/api/assembly/sessions/${sessionId}/attendance/${userId}`, { method: 'PUT', body: JSON.stringify({ mode }) }),
  getAssemblyStandings: (year) =>
    request(`/api/assembly/points${year ? `?year=${year}` : ''}`),
  getAssemblySessionRecord: (id) => request(`/api/assembly/sessions/${id}/record`),
  uploadNewsImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadRequest('/api/news/upload-image', formData);
  },
};
