export interface User {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  email_verified: boolean
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}
