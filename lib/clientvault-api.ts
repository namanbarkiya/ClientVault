import { api } from "@/lib/api"
import type {
  ContentRequest,
  DashboardStats,
  PortalData,
  Project,
  Reminder,
  RequestItem,
  Submission,
  Template,
} from "@/types/clientvault"

const BASE = "/api/clientvault"

// ── Projects ──────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: (status?: string) =>
    api.get<Project[]>(`${BASE}/projects`, { params: status ? { status } : {} }).then((r) => r.data),

  get: (id: string) =>
    api.get<Project>(`${BASE}/projects/${id}`).then((r) => r.data),

  create: (data: {
    name: string
    client_name: string
    client_email?: string
    description?: string
    branding_color?: string
    due_date?: string
  }) => api.post<Project>(`${BASE}/projects`, data).then((r) => r.data),

  update: (id: string, data: Partial<Project>) =>
    api.patch<Project>(`${BASE}/projects/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`${BASE}/projects/${id}`).then((r) => r.data),

  getResponses: (id: string) =>
    api.get<PortalData>(`${BASE}/projects/${id}/responses`).then((r) => r.data),
}

// ── Content Requests ──────────────────────────────────────────────────────────

export const requestsApi = {
  list: (projectId: string) =>
    api.get<ContentRequest[]>(`${BASE}/projects/${projectId}/requests`).then((r) => r.data),

  create: (projectId: string, data: { title: string; description?: string; sort_order?: number }) =>
    api.post<ContentRequest>(`${BASE}/projects/${projectId}/requests`, data).then((r) => r.data),

  update: (id: string, data: Partial<ContentRequest>) =>
    api.patch<ContentRequest>(`${BASE}/requests/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`${BASE}/requests/${id}`).then((r) => r.data),

  reorder: (projectId: string, ids: string[]) =>
    api.patch(`${BASE}/projects/${projectId}/requests/reorder`, { ids }).then((r) => r.data),
}

// ── Request Items ─────────────────────────────────────────────────────────────

export const itemsApi = {
  create: (requestId: string, data: {
    label: string
    item_type: string
    description?: string
    is_required?: boolean
    options?: string[]
    sort_order?: number
  }) => api.post<RequestItem>(`${BASE}/requests/${requestId}/items`, data).then((r) => r.data),

  update: (id: string, data: Partial<RequestItem>) =>
    api.patch<RequestItem>(`${BASE}/items/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`${BASE}/items/${id}`).then((r) => r.data),

  reorder: (requestId: string, ids: string[]) =>
    api.patch(`${BASE}/requests/${requestId}/items/reorder`, { ids }).then((r) => r.data),
}

// ── Portal (public) ───────────────────────────────────────────────────────────

export const portalApi = {
  get: (token: string) =>
    api.get<PortalData>(`${BASE}/portal/${token}`).then((r) => r.data),

  submit: (token: string, items: Array<{ request_item_id: string; text_value?: string }>) =>
    api.post(`${BASE}/portal/${token}/submit`, { items }).then((r) => r.data),

  uploadFile: (token: string, itemId: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api.post<Submission>(`${BASE}/portal/${token}/upload/${itemId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data)
  },
}

// ── Templates ─────────────────────────────────────────────────────────────────

export const templatesApi = {
  list: () => api.get<Template[]>(`${BASE}/templates`).then((r) => r.data),

  create: (data: { name: string; sections: Template["sections"] }) =>
    api.post<Template>(`${BASE}/templates`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`${BASE}/templates/${id}`).then((r) => r.data),

  apply: (projectId: string, templateId: string) =>
    api.post(`${BASE}/projects/${projectId}/apply-template/${templateId}`).then((r) => r.data),
}

// ── Dashboard & Reminders ─────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => api.get<DashboardStats>(`${BASE}/dashboard`).then((r) => r.data),
}

export const remindersApi = {
  send: (projectId: string, message?: string) =>
    api.post<Reminder>(`${BASE}/projects/${projectId}/remind`, { message }).then((r) => r.data),
}
