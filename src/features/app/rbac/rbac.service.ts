import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * Validates that a permission follows the pattern: feature:objective
 * @param permission - The permission string to validate
 * @returns true if valid, false otherwise
 */
function validatePermissionPattern(permission: string): boolean {
  // Check if permission contains exactly one colon and has content before and after it
  const parts = permission.split(':')
  if (parts.length !== 2) {
    return false
  }
  
  const [feature, objective] = parts
  
  // Both parts must be non-empty and contain only valid characters
  // Allow letters, numbers, underscores, and hyphens
  const validPattern = /^[a-zA-Z0-9_-]+$/
  
  return (
    feature.trim().length > 0 &&
    objective.trim().length > 0 &&
    validPattern.test(feature.trim()) &&
    validPattern.test(objective.trim())
  )
}

/**
 * Validates an array of permissions
 * @param permissions - Array of permission strings to validate
 * @throws Error if any permission is invalid
 */
function validatePermissions(permissions: string[]): void {
  const invalidPermissions = permissions.filter(permission => !validatePermissionPattern(permission))
  
  if (invalidPermissions.length > 0) {
    throw new Error(
      'Invalid permissions found. Permissions must follow the pattern \'feature:objective\'. ' +
      `Permissões inválidas: ${invalidPermissions.join(', ')}`,
    )
  }
}

export const rbacService = {
  async checkPermission(authUserId: string, permission: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { authUserId },
      select: { id: true, companyId: true },
    })
    if (!user) return false
    logger.debug('User found', { user })

    const record = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        role: {
          companyId: user.companyId,
          permissions: {
            some: { permission: { name: permission } },
          },
        },
      },
    })
    logger.debug('User role found', { record })

    return !!record
  },

  async createRole(
    companyId: string,
    name: string,
    permissions: string[] = [],
    description?: string,
  ) {
    // Validate permissions pattern before creating the role
    if (permissions.length > 0) {
      validatePermissions(permissions)
      logger.debug('Permissions validated successfully', { permissions })
    }

    return prisma.role.create({
      data: {
        name,
        description,
        companyId,
        permissions: {
          create: permissions.map(p => ({
            permission: {
              connectOrCreate: {
                where: { name: p },
                create: {
                  name: p,
                  category: 'Custom', // Default category for dynamically created permissions
                },
              },
            },
          })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
      },
    })
  },

  async assignRoleToUser(userId: string, roleId: string) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    })
  },

  async getUserPermissions(authUserId: string) {
    const user = await prisma.user.findUnique({
      where: { authUserId },
      select: { 
        id: true, 
        companyId: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    logger.debug('Getting user permissions', { userId: user.id })

    // Collect all unique permissions from all user roles
    const permissions = new Set<string>()
    const roles: Array<{ id: string; name: string; description: string | null }> = []

    for (const userRole of user.roles) {
      const role = userRole.role
      roles.push({
        id: role.id,
        name: role.name,
        description: role.description,
      })

      for (const rolePermission of role.permissions) {
        permissions.add(rolePermission.permission.name)
      }
    }

    const result = {
      permissions: Array.from(permissions).sort(),
      roles: roles,
    }

    logger.debug('User permissions retrieved', { 
      userId: user.id, 
      permissionsCount: result.permissions.length,
      rolesCount: result.roles.length,
    })

    return result
  },

  async checkPermissionWithDetails(authUserId: string, permission: string) {
    const user = await prisma.user.findUnique({
      where: { authUserId },
      select: { 
        id: true, 
        companyId: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return {
        allowed: false,
        userPermissions: [],
      }
    }

    logger.debug('Checking permission with details', { userId: user.id, permission })

    // Collect all unique permissions from all user roles
    const userPermissions = new Set<string>()
    
    for (const userRole of user.roles) {
      for (const rolePermission of userRole.role.permissions) {
        userPermissions.add(rolePermission.permission.name)
      }
    }

    const userPermissionsArray = Array.from(userPermissions).sort()
    const allowed = userPermissionsArray.includes(permission)

    logger.debug('Permission check with details result', { 
      userId: user.id, 
      permission,
      allowed,
      userPermissionsCount: userPermissionsArray.length,
    })

    return {
      allowed,
      userPermissions: userPermissionsArray,
    }
  },
}

