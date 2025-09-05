export interface UserCreateInput {
  auth0Id: string
  email: string
  name: string
  isActive?: boolean
}

export interface UserUpdateInput {
  name?: string
}

export interface UserResponse {
  id: string
  auth0Id: string
  email: string
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SignUpResult {
  user: UserResponse
  isNewUser: boolean
}

export interface LoginResult {
  user: UserResponse
  lastLoginAt: Date
}
