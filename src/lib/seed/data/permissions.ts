/**
 * Permission definitions for the RBAC system
 */

export interface PermissionData {
  name: string
  description: string
}

export const PERMISSIONS: PermissionData[] = [
  // User management permissions
  { name: 'users:read', description: 'View user information' },
  { name: 'users:create', description: 'Create new users' },
  { name: 'users:update', description: 'Update user information' },
  { name: 'users:delete', description: 'Delete users' },
  { name: 'users:manage_roles', description: 'Assign and remove user roles' },
  
  // Role management permissions
  { name: 'roles:read', description: 'View roles and permissions' },
  { name: 'roles:create', description: 'Create new roles' },
  { name: 'roles:update', description: 'Update existing roles' },
  { name: 'roles:delete', description: 'Delete roles' },
  { name: 'roles:manage_permissions', description: 'Assign permissions to roles' },
  
  // Admin panel permissions
  { name: 'admin:access_panel', description: 'Access administrative panel' },
  { name: 'admin:view_analytics', description: 'View system analytics and reports' },
  { name: 'admin:manage_company', description: 'Manage company settings' },
  { name: 'admin:manage_system', description: 'Manage system-wide settings and operations' },
  { name: 'company:manage_settings', description: 'Manage company-specific settings like values and compliments configuration' },

  // Future features - Praise system
  { name: 'praise:send', description: 'Send praise to colleagues' },
  { name: 'praise:view_all', description: 'View all praise in company' },
  { name: 'praise:moderate', description: 'Moderate and manage praise' },
  
  // Future features - Coins system
  { name: 'coins:view_balance', description: 'View coin balance' },
  { name: 'coins:transfer', description: 'Transfer coins to others' },
  { name: 'coins:manage_system', description: 'Manage coin system settings' },
  
  // Future features - Store system
  { name: 'store:view_catalog', description: 'View prize catalog' },
  { name: 'store:redeem_prizes', description: 'Redeem prizes with coins' },
  { name: 'store:manage_catalog', description: 'Manage prize catalog' },
  
  // Future features - Library system
  { name: 'library:view_books', description: 'View book library' },
  { name: 'library:rate_books', description: 'Rate and review books' },
  { name: 'library:manage_catalog', description: 'Manage book catalog' },
]
