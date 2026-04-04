export interface User {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  created_at: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user: User
}
