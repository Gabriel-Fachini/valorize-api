import { Role } from '@modules/rbac/domain/entities/Role'
import { Permission } from '@modules/rbac/domain/entities/Permission'
import { RoleRepository } from '@modules/rbac/domain/repositories/RoleRepository'
import { PermissionRepository } from '@modules/rbac/domain/repositories/PermissionRepository'
import { UserRoleRepository, RolePermissionRepository } from '@modules/rbac/domain/repositories/AssignmentRepositories'
import { logger } from '@shared/infrastructure/logger/Logger'

export interface CreateRoleRequest {
  name: string
  description?: string
  permissions?: string[] // Permission IDs
}

export interface CreatePermissionRequest {
  name: string
  resource: string
  action: string
  description?: string
}

export interface UserPermissions {
  userId: string
  permissions: string[] // Permission names like "users:read", "admin:access"
  roles: string[] // Role names
}

export class RBACService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly rolePermissionRepository: RolePermissionRepository,
  ) {}

  // Role management
  async createRole(request: CreateRoleRequest): Promise<Role> {
    logger.info('Creating new role', { name: request.name })

    // Check if role already exists
    const existingRole = await this.roleRepository.findByName(request.name)
    if (existingRole) {
      throw new Error(`Role with name '${request.name}' already exists`)
    }

    const role = Role.create({
      name: request.name,
      description: request.description,
    })

    const createdRole = await this.roleRepository.create(role)

    // Assign permissions if provided
    if (request.permissions && request.permissions.length > 0) {
      for (const permissionId of request.permissions) {
        await this.rolePermissionRepository.assignPermission(createdRole.id, permissionId)
      }
    }

    logger.info('Role created successfully', { roleId: createdRole.id, name: createdRole.name })
    return createdRole
  }

  async getRoleById(id: string): Promise<Role | null> {
    return this.roleRepository.findById(id)
  }

  async getRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findByName(name)
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.findAll()
  }

  async getActiveRoles(): Promise<Role[]> {
    return this.roleRepository.findActive()
  }

  // Permission management
  async createPermission(request: CreatePermissionRequest): Promise<Permission> {
    logger.info('Creating new permission', { name: request.name, resource: request.resource, action: request.action })

    // Check if permission already exists
    const existingPermission = await this.permissionRepository.findByResourceAndAction(
      request.resource,
      request.action,
    )
    if (existingPermission) {
      throw new Error(`Permission '${request.resource}:${request.action}' already exists`)
    }

    const permission = Permission.createFromResourceAction(
      request.resource,
      request.action,
      request.description,
    )

    const createdPermission = await this.permissionRepository.create(permission)

    logger.info('Permission created successfully', { 
      permissionId: createdPermission.id, 
      name: createdPermission.name 
    })
    return createdPermission
  }

  async getPermissionById(id: string): Promise<Permission | null> {
    return this.permissionRepository.findById(id)
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.findAll()
  }

  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    return this.permissionRepository.findByResource(resource)
  }

  // Role-Permission assignment
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    logger.info('Assigning permission to role', { roleId, permissionId })

    // Verify role exists
    const role = await this.roleRepository.findById(roleId)
    if (!role) {
      throw new Error(`Role with ID '${roleId}' not found`)
    }

    // Verify permission exists
    const permission = await this.permissionRepository.findById(permissionId)
    if (!permission) {
      throw new Error(`Permission with ID '${permissionId}' not found`)
    }

    // Check if permission is already assigned
    const hasPermission = await this.rolePermissionRepository.hasPermission(roleId, permissionId)
    if (hasPermission) {
      throw new Error(`Permission '${permission.name}' is already assigned to role '${role.name}'`)
    }

    await this.rolePermissionRepository.assignPermission(roleId, permissionId)

    logger.info('Permission assigned to role successfully', { 
      roleId, 
      roleName: role.name, 
      permissionId, 
      permissionName: permission.name 
    })
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    logger.info('Removing permission from role', { roleId, permissionId })

    await this.rolePermissionRepository.removePermission(roleId, permissionId)

    logger.info('Permission removed from role successfully', { roleId, permissionId })
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    return this.permissionRepository.findByRoleId(roleId)
  }

  // User-Role assignment
  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string): Promise<void> {
    logger.info('Assigning role to user', { userId, roleId, assignedBy })

    // Verify role exists and is active
    const role = await this.roleRepository.findById(roleId)
    if (!role) {
      throw new Error(`Role with ID '${roleId}' not found`)
    }

    if (!role.isActive) {
      throw new Error(`Cannot assign inactive role '${role.name}' to user`)
    }

    // Check if role is already assigned
    const hasRole = await this.userRoleRepository.hasRole(userId, roleId)
    if (hasRole) {
      throw new Error(`Role '${role.name}' is already assigned to user`)
    }

    await this.userRoleRepository.assignRole(userId, roleId, assignedBy)

    logger.info('Role assigned to user successfully', { 
      userId, 
      roleId, 
      roleName: role.name,
      assignedBy 
    })
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    logger.info('Removing role from user', { userId, roleId })

    await this.userRoleRepository.removeRole(userId, roleId)

    logger.info('Role removed from user successfully', { userId, roleId })
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const roleIds = await this.userRoleRepository.getUserRoles(userId)
    const roles: Role[] = []

    for (const roleId of roleIds) {
      const role = await this.roleRepository.findById(roleId)
      if (role) {
        roles.push(role)
      }
    }

    return roles.filter(role => role.isActive)
  }

  // Permission checking
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const roles = await this.getUserRoles(userId)
    const permissionSet = new Set<string>()
    const roleNames = roles.map(role => role.name)

    // Collect all permissions from all user roles
    for (const role of roles) {
      const permissions = await this.getRolePermissions(role.id)
      permissions.forEach(permission => permissionSet.add(permission.name))
    }

    return {
      userId,
      permissions: Array.from(permissionSet),
      roles: roleNames,
    }
  }

  async userHasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    const permissionName = `${resource}:${action}`
    
    return userPermissions.permissions.includes(permissionName)
  }

  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return userPermissions.roles.includes(roleName.toLowerCase())
  }

  async userHasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return roleNames.some(roleName => userPermissions.roles.includes(roleName.toLowerCase()))
  }
}