/**
 * @fileoverview Centralized role definitions for the RBAC system
 *
 * This file serves as the single source of truth for all roles in the application.
 * All roles and their permission mappings are defined here and used across:
 * - Application code (services, business logic)
 * - Database seeding
 * - Type checking and validation
 *
 * @module features/rbac/roles.constants
 */

import { PERMISSION, Permission } from './permissions.constants'

/**
 * Role definition structure
 */
export interface RoleDefinition {
  name: string
  description: string
  permissions: Permission[]
}

/**
 * Strongly-typed role names
 * Use these constants instead of string literals throughout the application
 */
export const ROLE = {
  SUPER_ADMIN: 'Super Administrador',
  COMPANY_ADMIN: 'Administrador da Empresa',
  HR_MANAGER: 'Gerente RH',
  TEAM_LEAD: 'Líder de Equipe',
  EMPLOYEE: 'Empregado',
} as const

/**
 * Type for valid role strings
 */
export type Role = typeof ROLE[keyof typeof ROLE]

/**
 * Complete list of all roles with their permission mappings
 * This array is used for database seeding and role management
 */
export const ALL_ROLES: RoleDefinition[] = [
  {
    name: ROLE.SUPER_ADMIN,
    description: 'Super administrador com acesso total ao sistema',
    permissions: [
      // User management
      PERMISSION.USERS_READ,
      PERMISSION.USERS_CREATE,
      PERMISSION.USERS_UPDATE,
      PERMISSION.USERS_DELETE,
      PERMISSION.USERS_MANAGE_ROLES,
      PERMISSION.USERS_IMPORT_CSV,
      PERMISSION.USERS_BULK_ACTIONS,
      // Role management
      PERMISSION.ROLES_READ,
      PERMISSION.ROLES_CREATE,
      PERMISSION.ROLES_UPDATE,
      PERMISSION.ROLES_DELETE,
      PERMISSION.ROLES_MANAGE_PERMISSIONS,
      PERMISSION.PERMISSIONS_READ_ALL,
      // Admin panel
      PERMISSION.ADMIN_ACCESS_PANEL,
      PERMISSION.ADMIN_VIEW_ANALYTICS,
      PERMISSION.ADMIN_MANAGE_COMPANY,
      PERMISSION.ADMIN_MANAGE_SYSTEM,
      PERMISSION.COMPANY_MANAGE_SETTINGS,
      // Praise system
      PERMISSION.PRAISE_SEND,
      PERMISSION.PRAISE_VIEW_ALL,
      PERMISSION.PRAISE_MODERATE,
      // Coins system
      PERMISSION.COINS_VIEW_BALANCE,
      PERMISSION.COINS_TRANSFER,
      PERMISSION.COINS_MANAGE_SYSTEM,
      // Store system
      PERMISSION.STORE_VIEW_CATALOG,
      PERMISSION.STORE_REDEEM_PRIZES,
      PERMISSION.STORE_MANAGE_CATALOG,
      PERMISSION.STORE_BULK_REDEEM_ADMIN,
      // Prizes management (granular)
      PERMISSION.PRIZES_CREATE,
      PERMISSION.PRIZES_CREATE_GLOBAL,
      PERMISSION.PRIZES_READ,
      PERMISSION.PRIZES_UPDATE,
      PERMISSION.PRIZES_DELETE,
      PERMISSION.PRIZES_MANAGE_IMAGES,
    ],
  },
  {
    name: ROLE.COMPANY_ADMIN,
    description: 'Administrador da empresa com acesso total à empresa',
    permissions: [
      PERMISSION.USERS_READ,
      PERMISSION.USERS_CREATE,
      PERMISSION.USERS_UPDATE,
      PERMISSION.USERS_MANAGE_ROLES,
      PERMISSION.USERS_IMPORT_CSV,
      PERMISSION.USERS_BULK_ACTIONS,
      PERMISSION.ROLES_READ,
      PERMISSION.ROLES_CREATE,
      PERMISSION.ROLES_UPDATE,
      PERMISSION.ROLES_MANAGE_PERMISSIONS,
      PERMISSION.PERMISSIONS_READ_ALL,
      PERMISSION.ADMIN_ACCESS_PANEL,
      PERMISSION.ADMIN_VIEW_ANALYTICS,
      PERMISSION.ADMIN_MANAGE_COMPANY,
      PERMISSION.COMPANY_MANAGE_SETTINGS,
      PERMISSION.PRAISE_VIEW_ALL,
      PERMISSION.PRAISE_MODERATE,
      PERMISSION.COINS_MANAGE_SYSTEM,
      PERMISSION.STORE_MANAGE_CATALOG,
      PERMISSION.STORE_BULK_REDEEM_ADMIN,
      // Prizes management (granular)
      PERMISSION.PRIZES_CREATE,
      PERMISSION.PRIZES_READ,
      PERMISSION.PRIZES_UPDATE,
      PERMISSION.PRIZES_DELETE,
      PERMISSION.PRIZES_MANAGE_IMAGES,
    ],
  },
  {
    name: ROLE.HR_MANAGER,
    description: 'Gerente de RH com acesso a usuários e análises',
    permissions: [
      PERMISSION.USERS_READ,
      PERMISSION.USERS_UPDATE,
      PERMISSION.USERS_MANAGE_ROLES,
      PERMISSION.ROLES_READ,
      PERMISSION.PERMISSIONS_READ_ALL,
      PERMISSION.ADMIN_ACCESS_PANEL,
      PERMISSION.ADMIN_VIEW_ANALYTICS,
      PERMISSION.PRAISE_VIEW_ALL,
      PERMISSION.PRAISE_MODERATE,
      PERMISSION.COINS_VIEW_BALANCE,
      PERMISSION.STORE_VIEW_CATALOG,
    ],
  },
  {
    name: ROLE.TEAM_LEAD,
    description: 'Líder de equipe com acesso administrativo limitado',
    permissions: [
      PERMISSION.USERS_READ,
      PERMISSION.ROLES_READ,
      PERMISSION.PRAISE_SEND,
      PERMISSION.PRAISE_VIEW_ALL,
      PERMISSION.COINS_VIEW_BALANCE,
      PERMISSION.COINS_TRANSFER,
      PERMISSION.STORE_VIEW_CATALOG,
      PERMISSION.STORE_REDEEM_PRIZES,
    ],
  },
  {
    name: ROLE.EMPLOYEE,
    description: 'Empregado padrão com acesso básico',
    permissions: [
      PERMISSION.PRAISE_SEND,
      PERMISSION.COINS_VIEW_BALANCE,
      PERMISSION.COINS_TRANSFER,
      PERMISSION.STORE_VIEW_CATALOG,
      PERMISSION.STORE_REDEEM_PRIZES,
    ],
  },
]

/**
 * Helper function to validate if a string is a valid role
 */
export function isValidRole(role: string): role is Role {
  return Object.values(ROLE).includes(role as Role)
}

/**
 * Get role definition by name
 */
export function getRoleDefinition(role: Role): RoleDefinition | undefined {
  return ALL_ROLES.find(r => r.name === role)
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(role: Role): Permission[] {
  return getRoleDefinition(role)?.permissions ?? []
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const roleDefinition = getRoleDefinition(role)
  return roleDefinition?.permissions.includes(permission) ?? false
}

/**
 * Get all roles that have a specific permission
 */
export function getRolesWithPermission(permission: Permission): RoleDefinition[] {
  return ALL_ROLES.filter(role => role.permissions.includes(permission))
}
