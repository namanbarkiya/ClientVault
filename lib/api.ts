import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const CLIENT_KEY = process.env.NEXT_PUBLIC_PRODUCT_CLIENT_KEY || ""

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Product-Client-Key": CLIENT_KEY,
  },
})

// In-memory access token (XSS-safe, not localStorage)
let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let _refreshPromise: Promise<string | null> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (!_refreshPromise) {
        _refreshPromise = refreshAccessToken().finally(() => {
          _refreshPromise = null
        })
      }
      const newToken = await _refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
    }
    return Promise.reject(error)
  }
)

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true, headers: { "X-Product-Client-Key": CLIENT_KEY } }
    )
    const token = res.data.access_token
    setAccessToken(token)
    return token
  } catch {
    setAccessToken(null)
    return null
  }
}
