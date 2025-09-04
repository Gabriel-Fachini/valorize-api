import { UserRoleRepository, RolePermissionRepository } from '@modules/rbac/domain/repositories/AssignmentRepositories'
import { prisma } from '@shared/infrastructure/database/db'
import { logger } from '@shared/infrastructure/logger/Logger'

export class UserRoleRepositoryImpl implements UserRoleRepository {
  async assignRole(userId: string, roleId: string, assignedBy?: string): Promise<void> {
    try {
      await prisma.userRole.create({
        data: {
          userId,
          roleId,
          assignedBy,
        },
      })

      logger.info('Role assigned to user', { userId, roleId, assignedBy })
    } catch (error) {
      logger.error('Error assigning role to user', {
        userId,
        roleId,
        assignedBy,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    try {
      await prisma.userRole.deleteMany({
        where: {
          userId,
          roleId,
        },
      })

      logger.info('Role removed from user', { userId, roleId })
    } catch (error) {
      logger.error('Error removing role from user', {
        userId,
        roleId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        select: { roleId: true },
      })

      return userRoles.map(ur => ur.roleId)
    } catch (error) {
      logger.error('Error getting user roles', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async getUsersWithRole(roleId: string): Promise<string[]> {
    try {
      const userRoles = await prisma.userRole.findMany({
        where: { roleId },
        select: { userId: true },
      })

      return userRoles.map(ur => ur.userId)
    } catch (error) {
      logger.error('Error getting users with role', {
        roleId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async hasRole(userId: string, roleId: string): Promise<boolean> {
    try {
      const userRole = await prisma.userRole.findFirst({
        where: {
          userId,
          roleId,
        },
      })

      return !!userRole
    } catch (error) {
      logger.error('Error checking if user has role', {
        userId,
        roleId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}

export class RolePermissionRepositoryImpl implements RolePermissionRepository {
  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    try {
      await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
        },
      })

      logger.info('Permission assigned to role', { roleId, permissionId })
    } catch (error) {
      logger.error('Error assigning permission to role', {
        roleId,
        permissionId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    try {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId,
        },
      })

      logger.info('Permission removed from role', { roleId, permissionId })
    } catch (error) {
      logger.error('Error removing permission from role', {
        roleId,
        permissionId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async getRolePermissions(roleId: string): Promise<string[]> {
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId },
        select: { permissionId: true },
      })

      return rolePermissions.map(rp => rp.permissionId)
    } catch (error) {
      logger.error('Error getting role permissions', {
        roleId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async getRolesWithPermission(permissionId: string): Promise<string[]> {
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { permissionId },
        select: { roleId: true },
      })

      return rolePermissions.map(rp => rp.roleId)
    } catch (error) {
      logger.error('Error getting roles with permission', {
        permissionId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async hasPermission(roleId: string, permissionId: string): Promise<boolean> {
    try {
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId,
          permissionId,
        },
      })

      return !!rolePermission
    } catch (error) {
      logger.error('Error checking if role has permission', {
        roleId,
        permissionId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}