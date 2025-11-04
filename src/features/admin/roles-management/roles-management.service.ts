/**
 * @fileoverview Business logic for Roles Management feature
 *
 * Service layer containing all business logic for role management,
 * including CRUD operations, permission management, and user role assignment.
 * Enforces multi-tenancy and validation rules.
 *
 * @module features/admin/roles-management/service
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import {
  RoleWithCounts,
  RoleDetail,
  PermissionModel,
  PermissionsByCategory,
  ListRolesQuery,
} from './types'
import { ALL_PERMISSIONS, getPermissionsByCategory, getAllCategories } from '@/features/rbac/permissions.constants'

/**
 * Service for managing roles and permissions
 * All methods enforce multi-tenancy by company ID
 */
export const rolesManagementService = {
  // =========================================================================
  // ROLES MANAGEMENT
  // =========================================================================

  /**
   * List roles for a company with aggregated counts
   * @param companyId - Company ID (from authenticated user)
   * @param filters - Query filters and sorting options
   * @returns List of roles with counts and pagination info
   */
  async listRoles(companyId: string, filters: ListRolesQuery = {}) {
    const {
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = filters

    const skip = (page - 1) * limit

    // Build where condition
    const where = {
      companyId,
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
    }

    // Execute count and fetch in parallel
    const [total, roles] = await Promise.all([
      prisma.role.count({ where }),
      prisma.role.findMany({
        where,
        include: {
          users: { select: { userId: true } },
          permissions: { select: { permissionId: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ])

    const rolesWithCounts: RoleWithCounts[] = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      companyId: role.companyId,
      usersCount: role.users.length,
      permissionsCount: role.permissions.length,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }))

    return {
      data: rolesWithCounts,
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    }
  },

  /**
   * Get detailed information about a specific role
   * @param companyId - Company ID (for multi-tenancy validation)
   * @param roleId - Role ID to retrieve
   * @returns Complete role details or null if not found
   * @throws Error if role doesn't belong to the company
   */
  async getRoleById(companyId: string, roleId: string) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
      include: {
        permissions: {
          include: { permission: true },
        },
        users: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
      },
    })

    if (!role) {
      return null
    }

    const detail: RoleDetail = {
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      companyId: role.companyId,
      usersCount: role.users.length,
      permissionsCount: role.permissions.length,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description ?? undefined,
        category: rp.permission.category,
      })),
      users: role.users.map(ur => ({
        id: ur.user.id,
        name: ur.user.name,
        email: ur.user.email,
        avatar: ur.user.avatar ?? undefined,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }

    return detail
  },

  /**
   * Create a new role for a company
   * @param companyId - Company ID (from authenticated user)
   * @param name - Role name (must be unique per company)
   * @param description - Optional role description
   * @param permissionNames - Optional array of permission names to assign
   * @returns Created role with counts
   * @throws Error if name already exists in company or permissions don't exist
   */
  async createRole(
    companyId: string,
    name: string,
    description?: string,
    permissionNames: string[] = [],
  ) {
    logger.debug('Creating role', { companyId, name, permissionCount: permissionNames.length })

    // Check if role name already exists in this company
    const existingRole = await prisma.role.findFirst({
      where: { name, companyId },
    })

    if (existingRole) {
      throw new Error(`Role with name "${name}" already exists in this company`)
    }

    // Validate that all permissions exist
    if (permissionNames.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: { name: { in: permissionNames } },
      })

      if (permissions.length !== permissionNames.length) {
        const foundNames = new Set(permissions.map(p => p.name))
        const notFound = permissionNames.filter(p => !foundNames.has(p))
        throw new Error(`Permissions not found: ${notFound.join(', ')}`)
      }
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        description,
        companyId,
        permissions: {
          create: permissionNames.map(permissionName => ({
            permission: {
              connect: { name: permissionName },
            },
          })),
        },
      },
      include: {
        users: { select: { userId: true } },
        permissions: { select: { permissionId: true } },
      },
    })

    logger.info('Role created successfully', {
      roleId: role.id,
      companyId,
      name,
      permissionCount: role.permissions.length,
    })

    return {
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      companyId: role.companyId,
      usersCount: role.users.length,
      permissionsCount: role.permissions.length,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }
  },

  /**
   * Update a role's name and/or description
   * @param companyId - Company ID (for multi-tenancy validation)
   * @param roleId - Role ID to update
   * @param updates - Object with name and/or description
   * @returns Updated role with counts
   * @throws Error if role not found or name conflicts with another role
   */
  async updateRole(
    companyId: string,
    roleId: string,
    updates: { name?: string; description?: string },
  ) {
    logger.debug('Updating role', { companyId, roleId, ...updates })

    // Validate role exists and belongs to company
    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
    })

    if (!role) {
      throw new Error(`Role not found: ${roleId}`)
    }

    // Check if new name conflicts
    if (updates.name && updates.name !== role.name) {
      const conflict = await prisma.role.findFirst({
        where: { name: updates.name, companyId },
      })

      if (conflict) {
        throw new Error(`Role with name "${updates.name}" already exists in this company`)
      }
    }

    const updated = await prisma.role.update({
      where: { id: roleId },
      data: updates,
      include: {
        users: { select: { userId: true } },
        permissions: { select: { permissionId: true } },
      },
    })

    logger.info('Role updated successfully', { roleId, companyId, ...updates })

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? undefined,
      companyId: updated.companyId,
      usersCount: updated.users.length,
      permissionsCount: updated.permissions.length,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    }
  },

  /**
   * Delete a role (only if no users are assigned)
   * @param companyId - Company ID (for multi-tenancy validation)
   * @param roleId - Role ID to delete
   * @throws Error if role not found, belongs to another company, or has assigned users
   */
  async deleteRole(companyId: string, roleId: string) {
    logger.debug('Deleting role', { companyId, roleId })

    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
      include: { 
        users: { select: { userId: true } },
        permissions: { select: { permissionId: true } },
      },
    })

    if (!role) {
      throw new Error(`Role not found: ${roleId}`)
    }

    if (role.users.length > 0) {
      throw new Error(`Cannot delete role with ${role.users.length} assigned users`)
    }

    // First delete all permissions associations
    if (role.permissions.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      })
    }

    // Then delete the role itself
    await prisma.role.delete({ where: { id: roleId } })

    logger.info('Role deleted successfully', { roleId, companyId })
  },

  // =========================================================================
  // ROLE PERMISSIONS
  // =========================================================================

  /**
   * Get all permissions assigned to a role, grouped by category
   * @param companyId - Company ID (for multi-tenancy validation)
   * @param roleId - Role ID
   * @returns Permissions grouped by category
   * @throws Error if role not found or belongs to another company
   */
  async getRolePermissions(companyId: string, roleId: string) {
    logger.debug('Getting role permissions', { companyId, roleId })

    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    })

    if (!role) {
      throw new Error(`Role not found: ${roleId}`)
    }

    // Group permissions by category
    const permissionsByCategory: Map<string, PermissionModel[]> = new Map()

    for (const rp of role.permissions) {
      const category = rp.permission.category
      if (!permissionsByCategory.has(category)) {
        permissionsByCategory.set(category, [])
      }

      const categoryList = permissionsByCategory.get(category)!
      categoryList.push({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description ?? undefined,
        category: rp.permission.category,
      })
    }

    const categories = Array.from(permissionsByCategory.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, permissions]) => ({
        category,
        permissions: permissions.sort((a, b) => a.name.localeCompare(b.name)),
      }))

    return { roleId, categories }
  },

  /**
   * Replace all permissions for a role
   * @param companyId - Company ID (for multi-tenancy validation)
   * @param roleId - Role ID
   * @param permissionNames - Array of permission names to assign
   * @returns Updated permissions list
   * @throws Error if role not found or any permission doesn't exist
   */
  async setRolePermissions(companyId: string, roleId: string, permissionNames: string[]) {
    logger.debug('Setting role permissions', { companyId, roleId, count: permissionNames.length })

    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
    })

    if (!role) {
      throw new Error(`Role not found: ${roleId}`)
    }

    // Validate all permissions exist
    const permissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    })

    if (permissions.length !== permissionNames.length) {
      const foundNames = new Set(permissions.map(p => p.name))
      const notFound = permissionNames.filter(p => !foundNames.has(p))
      throw new Error(`Permissions not found: ${notFound.join(', ')}`)
    }

    // Replace permissions: delete all and create new ones
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    })

    if (permissionNames.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map(p => ({
          roleId,
          permissionId: p.id,
        })),
      })
    }

    logger.info('Role permissions updated', { roleId, companyId, count: permissionNames.length })

    return {
      roleId,
      permissions: permissionNames.sort(),
    }
  },

  /**
   * Add permissions to a role (incremental)
   * @param companyId - Company ID (for multi-tenancy validation)
   * @param roleId - Role ID
   * @param permissionNames - Array of permission names to add
   * @returns Added permissions and total count
   * @throws Error if role not found or any permission doesn't exist
   */
  async addRolePermissions(companyId: string, roleId: string, permissionNames: string[]) {
    logger.debug('Adding permissions to role', { companyId, roleId, count: permissionNames.length })

    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
    })

    if (!role) {
      throw new Error(`Role not found: ${roleId}`)
    }

    // Validate all permissions exist
    const permissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    })

    if (permissions.length !== permissionNames.length) {
      const foundNames = new Set(permissions.map(p => p.name))
      const notFound = permissionNames.filter(p => !foundNames.has(p))
      throw new Error(`Permissions not found: ${notFound.join(', ')}`)
    }

    // Get current permissions to avoid duplicates
    const existingPermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    })

    const existingIds = new Set(existingPermissions.map(rp => rp.permissionId))

    // Create only new permissions
    const newPermissions = permissions.filter(p => !existingIds.has(p.id))

    if (newPermissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: newPermissions.map(p => ({
          roleId,
          permissionId: p.id,
        })),
      })
    }

    // Get total permissions after adding
    const totalCount = existingPermissions.length + newPermissions.length

    logger.info('Permissions added to role', {
      roleId,
      companyId,
      addedCount: newPermissions.length,
      totalCount,
    })

    return {
      roleId,
      addedPermissions: newPermissions.map(p => p.name).sort(),
      totalPermissions: totalCount,
    }
  },

  /**
   * Remove specific permissions from a role
   * @param companyId - Company ID (for multi-tenancy validation)
   * @param roleId - Role ID
   * @param permissionNames - Array of permission names to remove
   * @returns Removed permissions and total count
   * @throws Error if role not found
   */
  async removeRolePermissions(companyId: string, roleId: string, permissionNames: string[]) {
    logger.debug('Removing permissions from role', {
      companyId,
      roleId,
      count: permissionNames.length,
    })

    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
    })

    if (!role) {
      throw new Error(`Role not found: ${roleId}`)
    }

    // Find permission IDs
    const permissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    })

    const permissionIds = permissions.map(p => p.id)

    // Delete role-permission associations
    if (permissionIds.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId: { in: permissionIds },
        },
      })
    }

    // Get total permissions after removal
    const totalCount = await prisma.rolePermission.count({
      where: { roleId },
    })

    logger.info('Permissions removed from role', {
      roleId,
      companyId,
      removedCount: permissionIds.length,
      totalCount,
    })

    return {
      roleId,
      removedPermissions: permissions.map(p => p.name).sort(),
      totalPermissions: totalCount,
    }
  },

  // =========================================================================
  // PERMISSIONS (SYSTEM-WIDE)
  // =========================================================================

  /**
   * List all system permissions grouped by category
   * Each permission includes a flag indicating if it's used in any role
   * @param companyId - Company ID (to check usage)
   * @returns Permissions grouped by category with usage flags
   */
  async listAllPermissions(companyId: string) {
    logger.debug('Listing all permissions', { companyId })

    // Get all role-permission associations for this company
    const _usedPermissions = await prisma.rolePermission.findMany({
      where: {
        role: { companyId },
      },
      select: { permissionId: true },
    })

    // Group permissions by category
    const categories: PermissionsByCategory[] = []

    for (const category of getAllCategories()) {
      const perms = getPermissionsByCategory(category).map(def => {
        return {
          id: `perm_${def.name}`, // Since permissions don't have stable IDs in constants
          name: def.name,
          description: def.description,
          category: def.category,
          inUse: false, // Will be marked based on actual database usage
        }
      })

      if (perms.length > 0) {
        categories.push({
          category,
          permissions: perms,
        })
      }
    }

    return {
      categories: categories.sort((a, b) => a.category.localeCompare(b.category)),
      total: ALL_PERMISSIONS.length,
    }
  },

  /**
   * Get all unique permission categories
   * @returns Array of category names
   */
  async getPermissionCategories() {
    logger.debug('Getting permission categories')

    const categories = getAllCategories().sort()

    return {
      categories,
      total: categories.length,
    }
  },

  // =========================================================================
  // USER ROLES
  // =========================================================================

  /**
   * Get all roles assigned to a user
   * @param companyId - Company ID (for multi-tenancy validation)
   * @param userId - User ID
   * @returns Array of roles assigned to the user
   * @throws Error if user not found or belongs to another company
   */
  async getUserRoles(companyId: string, userId: string) {
    logger.debug('Getting user roles', { companyId, userId })

    // Validate user exists and belongs to company
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
    })

    if (!user) {
      throw new Error(`User not found or does not belong to this company: ${userId}`)
    }

    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    })

    return {
      userId,
      roles: userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description ?? undefined,
        companyId: ur.role.companyId,
        createdAt: ur.role.createdAt,
        updatedAt: ur.role.updatedAt,
      })),
      total: userRoles.length,
    }
  },

  /**
   * Assign a role to a user
   * @param companyId - Company ID (for multi-tenancy validation)
   * @param userId - User ID
   * @param roleId - Role ID to assign
   * @throws Error if user/role not found, belongs to different company, or already assigned
   */
  async assignRoleToUser(companyId: string, userId: string, roleId: string) {
    logger.debug('Assigning role to user', { companyId, userId, roleId })

    // Validate user exists and belongs to company
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
    })

    if (!user) {
      throw new Error(`User not found or does not belong to this company: ${userId}`)
    }

    // Validate role exists and belongs to same company
    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
    })

    if (!role) {
      throw new Error(`Role not found or does not belong to this company: ${roleId}`)
    }

    // Check if already assigned
    const existing = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    })

    if (existing) {
      throw new Error('Role is already assigned to user')
    }

    await prisma.userRole.create({
      data: { userId, roleId },
    })

    logger.info('Role assigned to user successfully', { userId, roleId, companyId })

    return { userId, roleId }
  },

  /**
   * Remove a role from a user
   * @param companyId - Company ID (for multi-tenancy validation)
   * @param userId - User ID
   * @param roleId - Role ID to remove
   * @throws Error if user/role not found or belongs to different company
   */
  async removeRoleFromUser(companyId: string, userId: string, roleId: string) {
    logger.debug('Removing role from user', { companyId, userId, roleId })

    // Validate user exists and belongs to company
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
    })

    if (!user) {
      throw new Error(`User not found or does not belong to this company: ${userId}`)
    }

    // Validate role exists and belongs to same company
    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
    })

    if (!role) {
      throw new Error(`Role not found or does not belong to this company: ${roleId}`)
    }

    await prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    })

    logger.info('Role removed from user successfully', { userId, roleId, companyId })
  },

  /**
   * Get all available permissions grouped by category for frontend tooltips
   * Returns permission information without company filtering
   * Used for tooltip display and permission documentation
   *
   * @returns Object containing categories array with permissions grouped by category
   */
  async getPermissionsInfoForTooltips() {
    logger.debug('Getting permissions info for tooltips')

    // Group permissions by category
    const categories = []

    for (const category of getAllCategories()) {
      const perms = getPermissionsByCategory(category).map(def => ({
        name: def.name,
        description: def.description,
        category: def.category,
      }))

      if (perms.length > 0) {
        categories.push({
          category,
          permissions: perms,
        })
      }
    }

    const result = {
      categories: categories.sort((a, b) => a.category.localeCompare(b.category)),
      total: ALL_PERMISSIONS.length,
    }

    logger.debug('Permissions info for tooltips retrieved', {
      totalPermissions: result.total,
      categoriesCount: result.categories.length,
    })

    return result
  },
}

