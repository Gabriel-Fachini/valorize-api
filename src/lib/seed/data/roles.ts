/**
 * Role configuration with permission mappings
 */

export interface RoleConfig {
  name: string
  description: string
  permissions: string[]
}

export const ROLES_CONFIG: RoleConfig[] = [
  {
    name: 'super_admin',
    description: 'Super administrator with full system access',
    permissions: [
      // User management
      'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage_roles',
      // Role management
      'roles:read', 'roles:create', 'roles:update', 'roles:delete', 'roles:manage_permissions',
      // Admin panel
      'admin:access_panel', 'admin:view_analytics', 'admin:manage_company', 'admin:manage_system',
      'company:manage_settings',
      // Praise system
      'praise:send', 'praise:view_all', 'praise:moderate',
      // Coins system
      'coins:view_balance', 'coins:transfer', 'coins:manage_system',
      // Store system
      'store:view_catalog', 'store:redeem_prizes', 'store:manage_catalog',
      // Library system
      'library:view_books', 'library:rate_books', 'library:manage_catalog',
    ],
  },
  {
    name: 'company_admin',
    description: 'Company administrator with full company access',
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:manage_roles',
      'roles:read', 'roles:create', 'roles:update', 'roles:manage_permissions',
      'admin:access_panel', 'admin:view_analytics', 'admin:manage_company', 'company:manage_settings',
      'praise:view_all', 'praise:moderate',
      'coins:manage_system',
      'store:manage_catalog',
      'library:manage_catalog',
    ],
  },
  {
    name: 'hr_manager',
    description: 'HR manager with user and analytics access',
    permissions: [
      'users:read', 'users:update', 'users:manage_roles',
      'roles:read',
      'admin:access_panel', 'admin:view_analytics',
      'praise:view_all', 'praise:moderate',
      'coins:view_balance',
      'store:view_catalog',
      'library:view_books',
    ],
  },
  {
    name: 'team_lead',
    description: 'Team leader with limited administrative access',
    permissions: [
      'users:read',
      'roles:read',
      'praise:send', 'praise:view_all',
      'coins:view_balance', 'coins:transfer',
      'store:view_catalog', 'store:redeem_prizes',
      'library:view_books', 'library:rate_books',
    ],
  },
  {
    name: 'employee',
    description: 'Standard employee with basic access',
    permissions: [
      'praise:send',
      'coins:view_balance', 'coins:transfer',
      'store:view_catalog', 'store:redeem_prizes',
      'library:view_books', 'library:rate_books',
    ],
  },
]
