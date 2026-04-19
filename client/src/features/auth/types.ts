export type Role = 'USER' | 'ADMIN'

export interface User {
  id: string
  email: string
  fullName: string | null
  role: Role
  transcriptionCredits: number
  createdAt: string
}

export interface SendOtpPayload {
  email: string
}
