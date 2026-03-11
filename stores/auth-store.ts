import { create } from "zustand"
import { User } from "@/types"
import { setAccessToken } from "@/lib/api"

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    setAccessToken(null)
    document.cookie = "session=; path=/; max-age=0"
    set({ user: null })
  },
}))
