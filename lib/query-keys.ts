export const queryKeys = {
  user: {
    me: () => ["user", "me"] as const,
    byId: (id: string) => ["user", id] as const,
  },
  // Add product-specific key factories below, e.g.:
  // orders: {
  //   list: () => ["orders"] as const,
  //   detail: (id: string) => ["orders", id] as const,
  // },
} as const
