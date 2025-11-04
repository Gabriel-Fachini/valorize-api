/**
 * @fileoverview JSON Schema validations for Roles Management API
 *
 * This file contains all JSON schemas used for request validation and
 * OpenAPI documentation of the roles management endpoints.
 *
 * @module features/admin/roles-management/schemas
 */

// Types imported for documentation purposes only

// ============================================================================
// ROLE SCHEMAS
// ============================================================================

export const listRolesSchema = {
  tags: ['Roles Management'],
  description: 'List roles for the authenticated user company',
  querystring: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Search roles by name' },
      sortBy: {
        type: 'string',
        enum: ['name', 'createdAt', 'usersCount', 'permissionsCount'],
        description: 'Field to sort by',
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: 'Sort order',
      },
      page: { type: 'integer', minimum: 1, description: 'Page number (1-indexed)' },
      limit: { type: 'integer', minimum: 1, maximum: 100, description: 'Items per page' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              companyId: { type: 'string' },
              usersCount: { type: 'integer' },
              permissionsCount: { type: 'integer' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            hasNextPage: { type: 'boolean' },
          },
        },
      },
    },
  },
}

export const getRoleSchema = {
  tags: ['Roles Management'],
  description: 'Get detailed information about a specific role',
  params: {
    type: 'object',
    required: ['roleId'],
    properties: {
      roleId: { type: 'string', description: 'Role ID' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            companyId: { type: 'string' },
            usersCount: { type: 'integer' },
            permissionsCount: { type: 'integer' },
            permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  category: { type: 'string' },
                },
              },
            },
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  avatar: { type: 'string', nullable: true },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
}

export const createRoleSchema = {
  tags: ['Roles Management'],
  description: 'Create a new role for the company',
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 255 },
      description: { type: 'string', nullable: true, maxLength: 1000 },
      permissionNames: {
        type: 'array',
        nullable: true,
        items: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$',
        },
        description: 'Array of permission names (feature:objective format)',
      },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            companyId: { type: 'string' },
            usersCount: { type: 'integer' },
            permissionsCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    409: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
}

export const updateRoleSchema = {
  tags: ['Roles Management'],
  description: 'Update role name and/or description',
  params: {
    type: 'object',
    required: ['roleId'],
    properties: {
      roleId: { type: 'string' },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', nullable: true, minLength: 1, maxLength: 255 },
      description: { type: 'string', nullable: true, maxLength: 1000 },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            companyId: { type: 'string' },
            usersCount: { type: 'integer' },
            permissionsCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
}

export const deleteRoleSchema = {
  tags: ['Roles Management'],
  description: 'Delete a role (only if no users are assigned)',
  params: {
    type: 'object',
    required: ['roleId'],
    properties: {
      roleId: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
    409: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', const: 'ROLE_HAS_USERS' },
            message: { type: 'string' },
            details: {
              type: 'object',
              properties: {
                usersCount: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
}

// ============================================================================
// ROLE PERMISSIONS SCHEMAS
// ============================================================================

export const getRolePermissionsSchema = {
  tags: ['Role Permissions'],
  description: 'Get all permissions assigned to a role, grouped by category',
  params: {
    type: 'object',
    required: ['roleId'],
    properties: {
      roleId: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            roleId: { type: 'string' },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        category: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

export const setRolePermissionsSchema = {
  tags: ['Role Permissions'],
  description: 'Replace all permissions for a role',
  params: {
    type: 'object',
    required: ['roleId'],
    properties: {
      roleId: { type: 'string' },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['permissionNames'],
    properties: {
      permissionNames: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$',
        },
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            roleId: { type: 'string' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
  },
}

export const addRolePermissionsSchema = {
  tags: ['Role Permissions'],
  description: 'Add permissions to a role (incremental)',
  params: {
    type: 'object',
    required: ['roleId'],
    properties: {
      roleId: { type: 'string' },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['permissionNames'],
    properties: {
      permissionNames: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$',
        },
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            roleId: { type: 'string' },
            addedPermissions: {
              type: 'array',
              items: { type: 'string' },
            },
            totalPermissions: { type: 'integer' },
          },
        },
      },
    },
  },
}

export const removeRolePermissionsSchema = {
  tags: ['Role Permissions'],
  description: 'Remove specific permissions from a role',
  params: {
    type: 'object',
    required: ['roleId'],
    properties: {
      roleId: { type: 'string' },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['permissionNames'],
    properties: {
      permissionNames: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$',
        },
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            roleId: { type: 'string' },
            removedPermissions: {
              type: 'array',
              items: { type: 'string' },
            },
            totalPermissions: { type: 'integer' },
          },
        },
      },
    },
  },
}

// ============================================================================
// PERMISSIONS SCHEMAS
// ============================================================================

export const listAllPermissionsSchema = {
  tags: ['Permissions'],
  description:
    'List all available permissions in the system, grouped by category and marked with usage flag',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        category: { type: 'string' },
                        inUse: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
            total: { type: 'integer' },
          },
        },
      },
    },
  },
}

export const listPermissionCategoriesSchema = {
  tags: ['Permissions'],
  description: 'List all available permission categories',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            categories: {
              type: 'array',
              items: { type: 'string' },
            },
            total: { type: 'integer' },
          },
        },
      },
    },
  },
}

// ============================================================================
// USER ROLES SCHEMAS
// ============================================================================

export const getUserRolesSchema = {
  tags: ['User Roles'],
  description: 'Get all roles assigned to a specific user',
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  companyId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            total: { type: 'integer' },
          },
        },
      },
    },
  },
}

export const assignRoleToUserSchema = {
  tags: ['User Roles'],
  description: 'Assign a role to a user',
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['roleId'],
    properties: {
      roleId: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            roleId: { type: 'string' },
          },
        },
      },
    },
    409: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
}

export const removeRoleFromUserSchema = {
  tags: ['User Roles'],
  description: 'Remove a role from a user',
  params: {
    type: 'object',
    required: ['userId', 'roleId'],
    properties: {
      userId: { type: 'string' },
      roleId: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
  },
}

// ============================================================================
// COMPANY USERS SCHEMAS
// ============================================================================

export const listCompanyUsersSchema = {
  tags: ['Roles Management'],
  description: 'List all active users in the company for dropdown selections',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'User ID' },
              name: { type: 'string', description: 'User full name' },
              email: { type: 'string', format: 'email', description: 'User email' },
              avatar: { type: ['string', 'null'], description: 'User avatar URL' },
            },
            required: ['id', 'name', 'email'],
          },
          description: 'Array of active users sorted by name',
        },
      },
    },
  },
}
