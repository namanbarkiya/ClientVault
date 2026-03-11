"use client"
import { useEffect } from "react"
import { api, setAccessToken } from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    api
      .post("/api/auth/refresh")
      .then((res) => {
        setAccessToken(res.data.access_token)
        setUser(res.data.user)
        document.cookie = "session=1; path=/; max-age=604800; SameSite=Lax"
      })
      .catch(() => {
        setAccessToken(null)
        setUser(null)
        document.cookie = "session=; path=/; max-age=0"
      })
      .finally(() => setLoading(false))
  }, [setUser, setLoading])

  return <>{children}</>
}
