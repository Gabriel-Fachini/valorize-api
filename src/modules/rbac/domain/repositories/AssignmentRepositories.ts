export interface UserRoleRepository {
  assignRole(userId: string, roleId: string, assignedBy?: string): Promise<void>
  removeRole(userId: string, roleId: string): Promise<void>
  getUserRoles(userId: string): Promise<string[]> // Returns role IDs
  getUsersWithRole(roleId: string): Promise<string[]> // Returns user IDs
  hasRole(userId: string, roleId: string): Promise<boolean>
}

export interface RolePermissionRepository {
  assignPermission(roleId: string, permissionId: string): Promise<void>
  removePermission(roleId: string, permissionId: string): Promise<void>
  getRolePermissions(roleId: string): Promise<string[]> // Returns permission IDs
  getRolesWithPermission(permissionId: string): Promise<string[]> // Returns role IDs
  hasPermission(roleId: string, permissionId: string): Promise<boolean>
}