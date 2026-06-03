const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error || data.errors?.[0]?.msg || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

export const authApi = {
  signup: (body) => api('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
};

export const projectApi = {
  list: () => api('/projects'),
  get: (id) => api(`/projects/${id}`),
  create: (body) => api('/projects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => api(`/projects/${id}`, { method: 'DELETE' }),
};

export const memberApi = {
  list: (projectId) => api(`/projects/${projectId}/members`),
  add: (projectId, body) =>
    api(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(body) }),
  updateRole: (projectId, memberId, role) =>
    api(`/projects/${projectId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  remove: (projectId, memberId) =>
    api(`/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }),
};

export const taskApi = {
  listAll: (params = '') => api(`/tasks${params ? `?${params}` : ''}`),
  list: (projectId) => api(`/${projectId}/tasks`),
  create: (projectId, body) =>
    api(`/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  update: (projectId, taskId, body) =>
    api(`/${projectId}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (projectId, taskId) =>
    api(`/${projectId}/tasks/${taskId}`, { method: 'DELETE' }),
};

export const dashboardApi = {
  get: () => api('/dashboard'),
};
// rebuild
