const BASE = '/api';
function getToken() { return localStorage.getItem('token') || ''; }
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...authHeaders(), ...(options?.headers || {}) } });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Request failed' })); throw new Error(err.error || 'Request failed'); }
  return res.json();
}
export const api = {
  login: (email: string, password: string) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request<any>('/auth/me'),
  getClients: () => request<any[]>('/clients'),
  getClient: (id: number) => request<any>(`/clients/${id}`),
  createClient: (d: any) => request<any>('/clients', { method: 'POST', body: JSON.stringify(d) }),
  updateClient: (id: number, d: any) => request<any>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteClient: (id: number) => request<any>(`/clients/${id}`, { method: 'DELETE' }),
  getTasks: () => request<any[]>('/tasks'),
  getTask: (id: number) => request<any>(`/tasks/${id}`),
  createTask: (d: any) => request<any>('/tasks', { method: 'POST', body: JSON.stringify(d) }),
  updateTask: (id: number, d: any) => request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteTask: (id: number) => request<any>(`/tasks/${id}`, { method: 'DELETE' }),
  getStaff: () => request<any[]>('/staff'),
  getStaffMember: (id: number) => request<any>(`/staff/${id}`),
  createStaff: (d: any) => request<any>('/staff', { method: 'POST', body: JSON.stringify(d) }),
  updateStaff: (id: number, d: any) => request<any>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteStaff: (id: number) => request<any>(`/staff/${id}`, { method: 'DELETE' }),
  getInvoices: () => request<any[]>('/invoices'),
  getInvoice: (id: number) => request<any>(`/invoices/${id}`),
  createInvoice: (d: any) => request<any>('/invoices', { method: 'POST', body: JSON.stringify(d) }),
  updateInvoice: (id: number, d: any) => request<any>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteInvoice: (id: number) => request<any>(`/invoices/${id}`, { method: 'DELETE' }),
  getSLAs: () => request<any[]>('/slas'),
  getSLA: (id: number) => request<any>(`/slas/${id}`),
  createSLA: (d: any) => request<any>('/slas', { method: 'POST', body: JSON.stringify(d) }),
  updateSLA: (id: number, d: any) => request<any>(`/slas/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteSLA: (id: number) => request<any>(`/slas/${id}`, { method: 'DELETE' }),
  getTemplates: () => request<any[]>('/templates'),
  getTemplate: (id: number) => request<any>(`/templates/${id}`),
  createTemplate: (d: any) => request<any>('/templates', { method: 'POST', body: JSON.stringify(d) }),
  updateTemplate: (id: number, d: any) => request<any>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteTemplate: (id: number) => request<any>(`/templates/${id}`, { method: 'DELETE' }),
  routeTask: (d: any) => request<any>('/ai/route-task', { method: 'POST', body: JSON.stringify(d) }),
  qualityReview: (d: any) => request<any>('/ai/quality-review', { method: 'POST', body: JSON.stringify(d) }),
  clientInsights: (d: any) => request<any>('/ai/client-insights', { method: 'POST', body: JSON.stringify(d) }),
  slaRisk: (d: any) => request<any>('/ai/sla-risk', { method: 'POST', body: JSON.stringify(d) }),
  // New AI features
  churnPredictor: (d: any) => request<any>('/ai/churn-predictor', { method: 'POST', body: JSON.stringify(d) }),
  timeEstimator: (d: any) => request<any>('/ai/time-estimator', { method: 'POST', body: JSON.stringify(d) }),
  sentimentClassifier: (d: any) => request<any>('/ai/sentiment-classifier', { method: 'POST', body: JSON.stringify(d) }),
  invoiceAnomaly: (d: any) => request<any>('/ai/invoice-anomaly', { method: 'POST', body: JSON.stringify(d) }),
  smartDispatch: (d: any) => request<any>('/ai/smart-dispatch', { method: 'POST', body: JSON.stringify(d) }),
  // Utility
  exportCsvUrl: (entity: string) => `${BASE}/export/${entity}`,
  exportCsv: async (entity: string) => {
    const res = await fetch(`${BASE}/export/${entity}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${entity}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
  search: (params: { q?: string; entity?: string; status?: string; tier?: string }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.append(k, v); });
    return request<any>(`/search?${qs.toString()}`);
  },
  getAuditLog: (params?: { action?: string; entity?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.append('action', params.action);
    if (params?.entity) qs.append('entity', params.entity);
    if (params?.limit) qs.append('limit', String(params.limit));
    const s = qs.toString();
    return request<any[]>(`/audit-log${s ? '?' + s : ''}`);
  },
  postAuditLog: (d: any) => request<any>('/audit-log', { method: 'POST', body: JSON.stringify(d) }),
  // Sample data seeding
  seedSampleData: (entity: string) => request<{ inserted: number; entity: string }>(`/admin/sample-data/${entity}`, { method: 'POST', body: JSON.stringify({}) }),
};
