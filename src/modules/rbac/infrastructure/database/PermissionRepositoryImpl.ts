import { Permission } from '@modules/rbac/domain/entities/Permission'
import { PermissionRepository } from '@modules/rbac/domain/repositories/PermissionRepository'
import { prisma } from '@shared/infrastructure/database/db'
import { logger } from '@shared/infrastructure/logger/Logger'

export class PermissionRepositoryImpl implements PermissionRepository {
  async create(permission: Permission): Promise<Permission> {
    try {
      const created = await prisma.permission.create({
        data: {
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
        },
      })

      return this.toDomainEntity(created)
    } catch (error) {
      logger.error('Error creating permission', {
        permissionId: permission.id,
        permissionName: permission.name,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async findById(id: string): Promise<Permission | null> {
    try {
      const permission = await prisma.permission.findUnique({
        where: { id },
      })

      return permission ? this.toDomainEntity(permission) : null
    } catch (error) {
      logger.error('Error finding permission by ID', {
        permissionId: id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async findByName(name: string): Promise<Permission | null> {
    try {
      const permission = await prisma.permission.findUnique({
        where: { name },
      })

      return permission ? this.toDomainEntity(permission) : null
    } catch (error) {
      logger.error('Error finding permission by name', {
        permissionName: name,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async findByResourceAndAction(resource: string, action: string): Promise<Permission | null> {
    try {
      const permission = await prisma.permission.findFirst({
        where: {
          resource: resource.toLowerCase(),
          action: action.toLowerCase(),
        },
      })

      return permission ? this.toDomainEntity(permission) : null
    } catch (error) {
      logger.error('Error finding permission by resource and action', {
        resource,
        action,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async findAll(): Promise<Permission[]> {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      })

      return permissions.map((permission: any) => this.toDomainEntity(permission))
    } catch (error) {
      logger.error('Error finding all permissions', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async findByResource(resource: string): Promise<Permission[]> {
    try {
      const permissions = await prisma.permission.findMany({
        where: { resource: resource.toLowerCase() },
        orderBy: { action: 'asc' },
      })

      return permissions.map((permission: any) => this.toDomainEntity(permission))
    } catch (error) {
      logger.error('Error finding permissions by resource', {
        resource,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async findByRoleId(roleId: string): Promise<Permission[]> {
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          permission: true,
        },
      })

      return rolePermissions.map((rp: any) => this.toDomainEntity(rp.permission))
    } catch (error) {
      logger.error('Error finding permissions by role ID', {
        roleId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async update(permission: Permission): Promise<Permission> {
    try {
      const updated = await prisma.permission.update({
        where: { id: permission.id },
        data: {
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          updatedAt: permission.updatedAt,
        },
      })

      return this.toDomainEntity(updated)
    } catch (error) {
      logger.error('Error updating permission', {
        permissionId: permission.id,
        permissionName: permission.name,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.permission.delete({
        where: { id },
      })
    } catch (error) {
      logger.error('Error deleting permission', {
        permissionId: id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private toDomainEntity(permissionData: any): Permission {
    return Permission.create({
      id: permissionData.id,
      name: permissionData.name,
      resource: permissionData.resource,
      action: permissionData.action,
      description: permissionData.description,
      createdAt: permissionData.createdAt,
      updatedAt: permissionData.updatedAt,
    })
  }
}