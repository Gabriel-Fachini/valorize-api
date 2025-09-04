import { Permission } from '../entities/Permission'

export interface PermissionRepository {
  create(permission: Permission): Promise<Permission>
  findById(id: string): Promise<Permission | null>
  findByName(name: string): Promise<Permission | null>
  findByResourceAndAction(resource: string, action: string): Promise<Permission | null>
  findAll(): Promise<Permission[]>
  findByResource(resource: string): Promise<Permission[]>
  findByRoleId(roleId: string): Promise<Permission[]>
  update(permission: Permission): Promise<Permission>
  delete(id: string): Promise<void>
}