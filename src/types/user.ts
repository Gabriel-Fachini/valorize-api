export interface UserCreateInput {
  authUserId: string
  email: string
  name: string
  isActive?: boolean
  jobTitleId?: string | null
  departmentId?: string | null
}

export interface UserUpdateInput {
  name?: string
  jobTitleId?: string | null
  departmentId?: string | null
}

export interface UserResponse {
  id: string
  authUserId: string
  email: string
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  jobTitle?: {
    id: string
    name: string
  } | null
  department?: {
    id: string
    name: string
  } | null
}

export interface SignUpResult {
  user: UserResponse
  isNewUser: boolean
}

export interface LoginResult {
  user: UserResponse
  lastLoginAt: Date
}
