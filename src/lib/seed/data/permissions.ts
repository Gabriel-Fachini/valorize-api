/**
 * Permission definitions for the RBAC system
 *
 * @deprecated This file is now a re-export from the centralized permissions constants.
 * Import from @/features/rbac/permissions.constants instead.
 */

import { ALL_PERMISSIONS } from '@/features/rbac/permissions.constants'

/**
 * @deprecated Use PermissionDefinition from @/features/rbac/permissions.constants
 */
// export interface PermissionData {
//   name: string
//   description: string
// }

/**
 * @deprecated Use ALL_PERMISSIONS from @/features/rbac/permissions.constants
 */
import type { PermissionDefinition } from '@/features/rbac/permissions.constants'

export const PERMISSIONS: PermissionDefinition[] = ALL_PERMISSIONS.map(p => ({
  name: p.name,
  description: p.description,
  category: p.category,
}))
