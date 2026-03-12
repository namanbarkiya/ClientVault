export type ProjectStatus = "active" | "completed" | "archived"
export type ItemType = "file_upload" | "short_text" | "long_text" | "url" | "credentials" | "choice"

export interface Project {
  id: string
  user_id: string
  name: string
  client_name: string
  client_email: string | null
  description: string | null
  status: ProjectStatus
  branding_color: string | null
  branding_logo_url: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  total_items: number
  submitted_items: number
  completion_percent: number
  portal_token: string | null
}

export interface RequestItem {
  id: string
  content_request_id: string
  label: string
  description: string | null
  item_type: ItemType
  is_required: boolean
  options: string[] | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ContentRequest {
  id: string
  project_id: string
  title: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
  items: RequestItem[]
}

export interface Submission {
  id: string
  request_item_id: string
  portal_id: string
  text_value: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  submitted_at: string
}

export interface PortalItem {
  id: string
  label: string
  description: string | null
  item_type: ItemType
  is_required: boolean
  options: string[] | null
  sort_order: number
  submission: Submission | null
}

export interface PortalSection {
  id: string
  title: string
  description: string | null
  sort_order: number
  items: PortalItem[]
}

export interface PortalProject {
  id: string
  name: string
  client_name: string
  description: string | null
  branding_color: string | null
  branding_logo_url: string | null
  due_date: string | null
}

export interface PortalData {
  portal_id: string
  project: PortalProject
  sections: PortalSection[]
  total_items: number
  submitted_items: number
  completion_percent: number
}

export interface Template {
  id: string
  user_id: string
  name: string
  sections: Array<{
    title: string
    description?: string
    items: Array<{
      label: string
      item_type: ItemType
      description?: string
      is_required: boolean
      options?: string[]
    }>
  }>
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_projects: number
  active_projects: number
  completed_projects: number
  total_pending_items: number
  total_submitted_items: number
  overall_completion_percent: number
  projects_with_portals: number
}

export interface Reminder {
  id: string
  project_id: string
  reminder_type: string
  message: string | null
  channel: string
  sent_at: string
}
