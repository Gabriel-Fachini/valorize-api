/**
 * @fileoverview Type definitions for Roles Management feature
 *
 * This module contains all TypeScript interfaces and types used throughout
 * the roles management feature, including request/response DTOs, database
 * models, and internal service types.
 *
 * @module features/admin/roles-management/types
 */

/**
 * Permission model as returned from the database
 */
export interface PermissionModel {
  id: string
  name: string
  description?: string
  category: string
}

/**
 * Permission with usage flag indicating if it's assigned to at least one role in the company
 */
export interface PermissionWithUsage extends PermissionModel {
  inUse: boolean
}

/**
 * Permissions grouped by category
 */
export interface PermissionsByCategory {
  category: string
  permissions: PermissionWithUsage[]
}

/**
 * Role model as returned from the database (basic)
 */
export interface RoleModel {
  id: string
  name: string
  description?: string
  companyId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Role with aggregated data (counts and relationships)
 */
export interface RoleWithCounts extends RoleModel {
  usersCount: number
  permissionsCount: number
}

/**
 * Role with all permissions and users
 */
export interface RoleDetail extends RoleWithCounts {
  permissions: PermissionModel[]
  users: UserRoleAssignment[]
}

/**
 * User-Role assignment for role detail view
 */
export interface UserRoleAssignment {
  id: string
  name: string
  email: string
  avatar?: string
}

/**
 * Request body for creating a new role
 */
export interface CreateRoleRequest {
  name: string
  description?: string
  permissionNames?: string[]
}

/**
 * Request body for updating a role (only name and description)
 */
export interface UpdateRoleRequest {
  name?: string
  description?: string
}

/**
 * Request body for setting role permissions (replaces all)
 */
export interface SetRolePermissionsRequest {
  permissionNames: string[]
}

/**
 * Request body for adding permissions to a role (incremental)
 */
export interface AddRolePermissionsRequest {
  permissionNames: string[]
}

/**
 * Request body for removing permissions from a role
 */
export interface RemoveRolePermissionsRequest {
  permissionNames: string[]
}

/**
 * Request body for assigning a role to a user
 */
export interface AssignRoleToUserRequest {
  roleId: string
}

/**
 * Query parameters for listing roles
 */
export interface ListRolesQuery {
  search?: string
  sortBy?: 'name' | 'createdAt' | 'usersCount' | 'permissionsCount'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * Response wrapper for role list
 */
export interface RoleListResponse {
  data: RoleWithCounts[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

/**
 * Response wrapper for permission list
 */
export interface PermissionListResponse {
  categories: PermissionsByCategory[]
  total: number
}

/**
 * Response wrapper for user roles
 */
export interface UserRolesResponse {
  userId: string
  roles: RoleModel[]
  total: number
}

/**
 * Error response for constraint violations
 */
export interface ConflictResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

/**
 * Success response wrapper
 */
export interface SuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}
