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
  USERS_IMPORT_CSV: 'users:import_csv',
  USERS_BULK_ACTIONS: 'users:bulk_actions',

  // Role management permissions
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  ROLES_MANAGE_PERMISSIONS: 'roles:manage_permissions',

  // Permissions management permissions
  PERMISSIONS_READ_ALL: 'permissions:read_all',

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
  STORE_BULK_REDEEM_ADMIN: 'store:bulk_redeem_admin',

  // Prizes management permissions (granular)
  PRIZES_CREATE: 'prizes:create',
  PRIZES_READ: 'prizes:read',
  PRIZES_UPDATE: 'prizes:update',
  PRIZES_DELETE: 'prizes:delete',
  PRIZES_MANAGE_IMAGES: 'prizes:manage_images',
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
    name: PERMISSION.ROLES_READ,
    description: 'Visualizar funções e permissões',
    category: 'Gerenciamento de Funções',
  },
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
    description: 'Atualizar informações de usuários',
    category: 'Gerenciamento de Usuários',
  },
  {
    name: PERMISSION.USERS_DELETE,
    description: 'Deletar usuários',
    category: 'Gerenciamento de Usuários',
  },
  {
    name: PERMISSION.USERS_MANAGE_ROLES,
    description: 'Atribuir e remover funções de usuários',
    category: 'Gerenciamento de Usuários',
  },
  {
    name: PERMISSION.USERS_IMPORT_CSV,
    description: 'Importar usuários via arquivo CSV',
    category: 'Gerenciamento de Usuários',
  },
  {
    name: PERMISSION.USERS_BULK_ACTIONS,
    description: 'Realizar ações em lote em usuários',
    category: 'Gerenciamento de Usuários',
  },

  // Role management permissions
  {
    name: PERMISSION.ROLES_READ,
    description: 'Visualizar funções e permissões',
    category: 'Gerenciamento de Funções',
  },
  {
    name: PERMISSION.ROLES_CREATE,
    description: 'Criar novas funções',
    category: 'Gerenciamento de Funções',
  },
  {
    name: PERMISSION.ROLES_UPDATE,
    description: 'Atualizar funções existentes',
    category: 'Gerenciamento de Funções',
  },
  {
    name: PERMISSION.ROLES_DELETE,
    description: 'Deletar funções',
    category: 'Gerenciamento de Funções',
  },
  {
    name: PERMISSION.ROLES_MANAGE_PERMISSIONS,
    description: 'Atribuir permissões a funções',
    category: 'Gerenciamento de Funções',
  },
  {
    name: PERMISSION.PERMISSIONS_READ_ALL,
    description: 'Visualizar todas as permissões disponíveis para dicas de ferramentas e documentação',
    category: 'Gerenciamento de Funções',
  },

  // Admin panel permissions
  {
    name: PERMISSION.ADMIN_ACCESS_PANEL,
    description: 'Acessar painel de administração',
    category: 'Administração',
  },
  {
    name: PERMISSION.ADMIN_VIEW_ANALYTICS,
    description: 'Visualizar análises e relatórios do sistema',
    category: 'Administração',
  },
  {
    name: PERMISSION.ADMIN_MANAGE_COMPANY,
    description: 'Gerenciar configurações da empresa',
    category: 'Administração',
  },
  {
    name: PERMISSION.ADMIN_MANAGE_SYSTEM,
    description: 'Gerenciar configurações e operações do sistema',
    category: 'Administração',
  },
  {
    name: PERMISSION.COMPANY_MANAGE_SETTINGS,
    description: 'Gerenciar configurações específicas da empresa como valores e configuração de elogios',
    category: 'Empresa',
  },

  // Praise system permissions
  {
    name: PERMISSION.PRAISE_SEND,
    description: 'Enviar elogios para colegas',
    category: 'Sistema de Elogios',
  },
  {
    name: PERMISSION.PRAISE_VIEW_ALL,
    description: 'Visualizar todos os elogios da empresa',
    category: 'Sistema de Elogios',
  },
  {
    name: PERMISSION.PRAISE_MODERATE,
    description: 'Moderar e gerenciar elogios',
    category: 'Sistema de Elogios',
  },

  // Coins system permissions
  {
    name: PERMISSION.COINS_VIEW_BALANCE,
    description: 'Visualizar saldo de moedas',
    category: 'Sistema de Moedas',
  },
  {
    name: PERMISSION.COINS_TRANSFER,
    description: 'Transferir moedas para outros',
    category: 'Sistema de Moedas',
  },
  {
    name: PERMISSION.COINS_MANAGE_SYSTEM,
    description: 'Gerenciar configurações do sistema de moedas',
    category: 'Sistema de Moedas',
  },

  // Store system permissions
  {
    name: PERMISSION.STORE_VIEW_CATALOG,
    description: 'Visualizar catálogo de prêmios',
    category: 'Sistema de Loja',
  },
  {
    name: PERMISSION.STORE_REDEEM_PRIZES,
    description: 'Resgatar prêmios com moedas',
    category: 'Sistema de Loja',
  },
  {
    name: PERMISSION.STORE_MANAGE_CATALOG,
    description: 'Gerenciar catálogo de prêmios',
    category: 'Sistema de Loja',
  },
  {
    name: PERMISSION.STORE_BULK_REDEEM_ADMIN,
    description: 'Enviar vouchers em lote para múltiplos usuários (função administrativa)',
    category: 'Sistema de Loja',
  },

  // Prizes management permissions (granular)
  {
    name: PERMISSION.PRIZES_CREATE,
    description: 'Criar novos prêmios',
    category: 'Gerenciamento de Prêmios',
  },
  {
    name: PERMISSION.PRIZES_READ,
    description: 'Visualizar prêmios',
    category: 'Gerenciamento de Prêmios',
  },
  {
    name: PERMISSION.PRIZES_UPDATE,
    description: 'Atualizar prêmios existentes',
    category: 'Gerenciamento de Prêmios',
  },
  {
    name: PERMISSION.PRIZES_DELETE,
    description: 'Deletar prêmios (soft delete)',
    category: 'Gerenciamento de Prêmios',
  },
  {
    name: PERMISSION.PRIZES_MANAGE_IMAGES,
    description: 'Gerenciar imagens de prêmios (upload e remoção)',
    category: 'Gerenciamento de Prêmios',
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
