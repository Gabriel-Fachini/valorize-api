/**
 * @fileoverview Centralized permission definitions for the RBAC system
 *
 * This file serves as the single source of truth for all permissions in the application.
 * All permissions are defined here and used across:
 * - Application code (middleware, routes, services)
 * - Database seeding
 * - Type checking and validation
 *
 * @module features/rbac/permissions.constants
 */

/**
 * Permission definition structure
 */
export interface PermissionDefinition {
  name: string
  description: string
  category: string
}

/**
 * Strongly-typed permission keys
 * Use these constants instead of string literals throughout the application
 */
export const PERMISSION = {
  // User management permissions
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',

  // Role management permissions
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  ROLES_MANAGE_PERMISSIONS: 'roles:manage_permissions',

  // Admin panel permissions
  ADMIN_ACCESS_PANEL: 'admin:access_panel',
  ADMIN_VIEW_ANALYTICS: 'admin:view_analytics',
  ADMIN_MANAGE_COMPANY: 'admin:manage_company',
  ADMIN_MANAGE_SYSTEM: 'admin:manage_system',
  COMPANY_MANAGE_SETTINGS: 'company:manage_settings',

  // Praise system permissions
  PRAISE_SEND: 'praise:send',
  PRAISE_VIEW_ALL: 'praise:view_all',
  PRAISE_MODERATE: 'praise:moderate',

  // Coins system permissions
  COINS_VIEW_BALANCE: 'coins:view_balance',
  COINS_TRANSFER: 'coins:transfer',
  COINS_MANAGE_SYSTEM: 'coins:manage_system',

  // Store system permissions
  STORE_VIEW_CATALOG: 'store:view_catalog',
  STORE_REDEEM_PRIZES: 'store:redeem_prizes',
  STORE_MANAGE_CATALOG: 'store:manage_catalog',

  // Library system permissions
  LIBRARY_VIEW_BOOKS: 'library:view_books',
  LIBRARY_RATE_BOOKS: 'library:rate_books',
  LIBRARY_MANAGE_CATALOG: 'library:manage_catalog',
} as const

/**
 * Type for valid permission strings
 * Ensures type safety when using permissions throughout the application
 */
export type Permission = typeof PERMISSION[keyof typeof PERMISSION]

/**
 * Complete list of all permissions with their metadata
 * This array is used for database seeding and documentation
 */
export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // User management permissions
  {
    name: PERMISSION.USERS_READ,
    description: 'View user information',
    category: 'User Management',
  },
  {
    name: PERMISSION.USERS_CREATE,
    description: 'Create new users',
    category: 'User Management',
  },
  {
    name: PERMISSION.USERS_UPDATE,
    description: 'Update user information',
    category: 'User Management',
  },
  {
    name: PERMISSION.USERS_DELETE,
    description: 'Delete users',
    category: 'User Management',
  },
  {
    name: PERMISSION.USERS_MANAGE_ROLES,
    description: 'Assign and remove user roles',
    category: 'User Management',
  },

  // Role management permissions
  {
    name: PERMISSION.ROLES_READ,
    description: 'View roles and permissions',
    category: 'Role Management',
  },
  {
    name: PERMISSION.ROLES_CREATE,
    description: 'Create new roles',
    category: 'Role Management',
  },
  {
    name: PERMISSION.ROLES_UPDATE,
    description: 'Update existing roles',
    category: 'Role Management',
  },
  {
    name: PERMISSION.ROLES_DELETE,
    description: 'Delete roles',
    category: 'Role Management',
  },
  {
    name: PERMISSION.ROLES_MANAGE_PERMISSIONS,
    description: 'Assign permissions to roles',
    category: 'Role Management',
  },

  // Admin panel permissions
  {
    name: PERMISSION.ADMIN_ACCESS_PANEL,
    description: 'Access administrative panel',
    category: 'Administration',
  },
  {
    name: PERMISSION.ADMIN_VIEW_ANALYTICS,
    description: 'View system analytics and reports',
    category: 'Administration',
  },
  {
    name: PERMISSION.ADMIN_MANAGE_COMPANY,
    description: 'Manage company settings',
    category: 'Administration',
  },
  {
    name: PERMISSION.ADMIN_MANAGE_SYSTEM,
    description: 'Manage system-wide settings and operations',
    category: 'Administration',
  },
  {
    name: PERMISSION.COMPANY_MANAGE_SETTINGS,
    description: 'Manage company-specific settings like values and compliments configuration',
    category: 'Company',
  },

  // Praise system permissions
  {
    name: PERMISSION.PRAISE_SEND,
    description: 'Send praise to colleagues',
    category: 'Praise System',
  },
  {
    name: PERMISSION.PRAISE_VIEW_ALL,
    description: 'View all praise in company',
    category: 'Praise System',
  },
  {
    name: PERMISSION.PRAISE_MODERATE,
    description: 'Moderate and manage praise',
    category: 'Praise System',
  },

  // Coins system permissions
  {
    name: PERMISSION.COINS_VIEW_BALANCE,
    description: 'View coin balance',
    category: 'Coins System',
  },
  {
    name: PERMISSION.COINS_TRANSFER,
    description: 'Transfer coins to others',
    category: 'Coins System',
  },
  {
    name: PERMISSION.COINS_MANAGE_SYSTEM,
    description: 'Manage coin system settings',
    category: 'Coins System',
  },

  // Store system permissions
  {
    name: PERMISSION.STORE_VIEW_CATALOG,
    description: 'View prize catalog',
    category: 'Store System',
  },
  {
    name: PERMISSION.STORE_REDEEM_PRIZES,
    description: 'Redeem prizes with coins',
    category: 'Store System',
  },
  {
    name: PERMISSION.STORE_MANAGE_CATALOG,
    description: 'Manage prize catalog',
    category: 'Store System',
  },

  // Library system permissions
  {
    name: PERMISSION.LIBRARY_VIEW_BOOKS,
    description: 'View book library',
    category: 'Library System',
  },
  {
    name: PERMISSION.LIBRARY_RATE_BOOKS,
    description: 'Rate and review books',
    category: 'Library System',
  },
  {
    name: PERMISSION.LIBRARY_MANAGE_CATALOG,
    description: 'Manage book catalog',
    category: 'Library System',
  },
]

/**
 * Helper function to validate if a string is a valid permission
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(PERMISSION).includes(permission as Permission)
}

/**
 * Get permission definition by name
 */
export function getPermissionDefinition(permission: Permission): PermissionDefinition | undefined {
  return ALL_PERMISSIONS.find(p => p.name === permission)
}

/**
 * Get all permissions by category
 */
export function getPermissionsByCategory(category: string): PermissionDefinition[] {
  return ALL_PERMISSIONS.filter(p => p.category === category)
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(ALL_PERMISSIONS.map(p => p.category)))
}
