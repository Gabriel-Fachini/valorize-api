export const createRoleSchema = {
  tags: ['RBAC'],
  description: 'Create role',
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      permissions: { 
        type: 'array', 
        items: { 
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$',
          description: 'Permission must follow the pattern: feature:objective (e.g., users:create, reports:view)',
        },
        description: 'Array of permissions following the pattern feature:objective',
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
            permissions: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
}

export const assignRoleToUserSchema = {
  tags: ['RBAC'],
  description: 'Assign role to user',
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
  body: {
    type: 'object',
    required: ['roleId'],
    properties: { roleId: { type: 'string' } },
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

export const getUserPermissionsSchema = {
  tags: ['RBAC'],
  description: 'Get current user permissions and roles',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            permissions: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of all permissions granted to the user',
            },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                },
              },
              description: 'List of roles assigned to the user',
            },
          },
        },
      },
    },
  },
}
