const BASE = '/api'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? '请求失败')
  }
  return res.json()
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? '请求失败')
  }
  return res.blob()
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: import('../types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  getDimensions: () => request<{ dimensions: import('../types').Dimension[] }>('/quote/dimensions'),
  getAgencies: () => request<{ agencies: import('../types').Agency[] }>('/quote/agencies'),
  getDefaults: () => request<{ selections: import('../types').QuoteSelections }>('/quote/defaults'),
  calculate: (selections: import('../types').QuoteSelections, arrivalDate?: string) =>
    request<import('../types').QuoteCalculateResult>('/quote/calculate', {
      method: 'POST',
      body: JSON.stringify({ selections, arrivalDate: arrivalDate || undefined }),
    }),
  getAdminConfig: () => request<import('../types').SystemConfig>('/admin/config'),
  saveAdminConfig: (config: import('../types').SystemConfig) =>
    request<import('../types').SystemConfig>('/admin/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  resetAdminConfig: () =>
    request<import('../types').SystemConfig>('/admin/config/reset', { method: 'POST' }),
  createShareLink: (payload: import('../types').QuoteSharePayload) =>
    request<{ id: string; expiresAt: string }>('/quote/export/link', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getShare: (id: string) => request<import('../types').QuoteShareSnapshot>(`/share/${id}`),
  exportPdf: (id: string) =>
    requestBlob('/quote/export/pdf', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  exportImage: (id: string) =>
    requestBlob('/quote/export/image', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
}
