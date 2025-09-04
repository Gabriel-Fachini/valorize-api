import { Role } from '@modules/rbac/domain/entities/Role'
import { RoleRepository } from '@modules/rbac/domain/repositories/RoleRepository'
import { prisma } from '@shared/infrastructure/database/db'
import { logger } from '@shared/infrastructure/logger/Logger'

export class RoleRepositoryImpl implements RoleRepository {
  async create(role: Role): Promise<Role> {
    try {
      const created = await prisma.role.create({
        data: {
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive,
        },
      })

      return this.toDomainEntity(created)
    } catch (error) {
      logger.error('Error creating role', {
        roleId: role.id,
        roleName: role.name,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async findById(id: string): Promise<Role | null> {
    try {
      const role = await prisma.role.findUnique({
        where: { id },
      })

      return role ? this.toDomainEntity(role) : null
    } catch (error) {
      logger.error('Error finding role by ID', {
        roleId: id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async findByName(name: string): Promise<Role | null> {
    try {
      const role = await prisma.role.findUnique({
        where: { name: name.toLowerCase() },
      })

      return role ? this.toDomainEntity(role) : null
    } catch (error) {
      logger.error('Error finding role by name', {
        roleName: name,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async findAll(): Promise<Role[]> {
    try {
      const roles = await prisma.role.findMany({
        orderBy: { name: 'asc' },
      })

      return roles.map((role: any) => this.toDomainEntity(role))
    } catch (error) {
      logger.error('Error finding all roles', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async findActive(): Promise<Role[]> {
    try {
      const roles = await prisma.role.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })

      return roles.map((role: any) => this.toDomainEntity(role))
    } catch (error) {
      logger.error('Error finding active roles', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async update(role: Role): Promise<Role> {
    try {
      const updated = await prisma.role.update({
        where: { id: role.id },
        data: {
          name: role.name,
          description: role.description,
          isActive: role.isActive,
          updatedAt: role.updatedAt,
        },
      })

      return this.toDomainEntity(updated)
    } catch (error) {
      logger.error('Error updating role', {
        roleId: role.id,
        roleName: role.name,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.role.delete({
        where: { id },
      })
    } catch (error) {
      logger.error('Error deleting role', {
        roleId: id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private toDomainEntity(roleData: any): Role {
    return Role.create({
      id: roleData.id,
      name: roleData.name,
      description: roleData.description,
      isActive: roleData.isActive,
      createdAt: roleData.createdAt,
      updatedAt: roleData.updatedAt,
    })
  }
}