const BASE = ''

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

export const api = {
  // Auth
  login: (login: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Users
  getUsers: () => request('/api/users'),
  createUser: (data: { login: string; password: string; role: string }) =>
    request('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: Record<string, unknown>) =>
    request(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: number) =>
    request(`/api/users/${id}`, { method: 'DELETE' }),
  getAccess: (id: number) => request(`/api/users/${id}/access`),
  setAccess: (id: number, data: { source_ids?: number[]; mv_ids?: number[] }) =>
    request(`/api/users/${id}/access`, { method: 'PUT', body: JSON.stringify(data) }),

  // Sources & MVs
  getSources: () => request('/api/sources'),
  getMultiviewers: () => request('/api/multiviewers'),
  getMultiviewer: (id: number) => request(`/api/multiviewers/${id}`),
  setLayout: (id: number, layout: number) =>
    request(`/api/multiviewers/${id}/layout`, { method: 'POST', body: JSON.stringify({ layout }) }),
  setWindow: (id: number, windowIndex: number, data: Record<string, unknown>) =>
    request(`/api/multiviewers/${id}/windows/${windowIndex}`, { method: 'POST', body: JSON.stringify(data) }),

  // Routing
  getRouting: () => request('/api/routing'),
  switchRoute: (output: number, input: number) =>
    request('/api/routing/switch', { method: 'POST', body: JSON.stringify({ output, input }) }),

  // Refresh
  refresh: () => request('/api/refresh', { method: 'POST' }),
  refreshStatus: () => request('/api/refresh/status'),

  // Integrations
  getIntegrations: () => request('/api/integrations'),
  saveIntegration: (data: Record<string, unknown>) =>
    request('/api/integrations', { method: 'POST', body: JSON.stringify(data) }),
  deleteIntegration: (protocol: string) =>
    request(`/api/integrations/${protocol}`, { method: 'DELETE' }),

  // Presets
  getPresets: () => request('/api/presets'),
  createPreset: (data: { name: string; payload: Record<string, unknown> }) =>
    request('/api/presets', { method: 'POST', body: JSON.stringify(data) }),
  getPreset: (id: number) => request(`/api/presets/${id}`),
  deletePreset: (id: number) => request(`/api/presets/${id}`, { method: 'DELETE' }),
  applyPreset: (id: number) => request(`/api/presets/${id}/apply`, { method: 'POST' }),
  exportPreset: (id: number) => `${BASE}/api/presets/${id}/export`,
}
