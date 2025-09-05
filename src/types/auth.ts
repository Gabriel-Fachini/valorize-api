export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
  user_info: UserInfo
}

export interface UserInfo {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
  [key: string]: unknown
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

export interface SessionInfo {
  isValid: boolean
  user: AuthenticatedUser
  expiresAt: Date
  timeRemaining: number
  needsRefresh: boolean
}

export interface TokenValidationResult {
  valid: boolean
  expired: boolean
  user?: AuthenticatedUser
  expiresAt?: Date
  timeRemaining?: number
  error?: string
}

export interface AuthenticatedUser {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
  [key: string]: unknown
}

export interface AuthError {
  error: string
  error_description?: string
  status_code?: number
}
