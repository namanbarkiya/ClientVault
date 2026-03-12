export const queryKeys = {
  user: {
    me: () => ["user", "me"] as const,
    byId: (id: string) => ["user", id] as const,
  },
  billing: {
    plans: () => ["billing", "plans"] as const,
    subscription: () => ["billing", "subscription"] as const,
    invoices: () => ["billing", "invoices"] as const,
  },
  clientvault: {
    dashboard: () => ["clientvault", "dashboard"] as const,
    projects: {
      list: (status?: string) => ["clientvault", "projects", status] as const,
      detail: (id: string) => ["clientvault", "projects", id] as const,
    },
    requests: {
      list: (projectId: string) => ["clientvault", "requests", projectId] as const,
    },
    portal: {
      get: (token: string) => ["clientvault", "portal", token] as const,
      responses: (projectId: string) => ["clientvault", "responses", projectId] as const,
    },
    templates: {
      list: () => ["clientvault", "templates"] as const,
    },
  },
} as const
