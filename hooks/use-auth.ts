"use client"
import { useAuthStore } from "@/stores/auth-store"

export function useAuth() {
  const { user, isLoading, setUser, logout } = useAuthStore()
  return { user, isLoading, isAuthenticated: !!user, setUser, logout }
}
