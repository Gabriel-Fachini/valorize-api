/**
 * Role configuration with permission mappings
 *
 * @deprecated This file is now a re-export from the centralized roles constants.
 * Import from @/features/rbac/roles.constants instead.
 */

import { ALL_ROLES } from '@/features/rbac/roles.constants'

/**
 * @deprecated Use RoleDefinition from @/features/rbac/roles.constants
 */
export interface RoleConfig {
  name: string
  description: string
  permissions: string[]
}

/**
 * @deprecated Use ALL_ROLES from @/features/rbac/roles.constants
 */
export const ROLES_CONFIG: RoleConfig[] = ALL_ROLES
