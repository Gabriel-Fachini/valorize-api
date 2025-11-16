import { FastifySchema } from 'fastify'

// Common response schemas
const commonErrorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: { type: 'string' },
    message: { type: 'string' },
    statusCode: { type: 'number' },
  },
} as const

const userInfoSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    avatar: { type: 'string' },
    companyId: { type: 'string' },
    companyName: { type: 'string' },
    isActive: { type: 'boolean' },
    auth0Sub: { type: 'string' },
  },
} as const

/**
 * Backoffice Login Schema
 *
 * Validates Super Admin access to backoffice platform
 * Only users with SUPER_ADMIN role from "Valorize HQ" company are allowed
 */
export const backofficeLoginSchema: FastifySchema = {
  tags: ['Backoffice', 'Authentication'],
  description:
    'Backoffice login for Super Admins from Valorize HQ - validates role and company',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Super Admin email address (@valorize.com.br)',
      },
      password: {
        type: 'string',
        minLength: 1,
        description: 'Super Admin password',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            token_type: { type: 'string' },
            expires_in: { type: 'number' },
            refresh_token: { type: 'string' },
            scope: { type: 'string' },
            user_info: userInfoSchema,
            permissions: {
              type: 'array',
              items: { type: 'string' },
              description: 'All Super Admin permissions',
            },
            roles: {
              type: 'array',
              items: { type: 'string' },
              description: 'User roles (should include Super Administrador)',
            },
          },
        },
      },
    },
    400: {
      description: 'Bad request - invalid input',
      ...commonErrorResponse,
    },
    401: {
      description: 'Unauthorized - invalid credentials',
      ...commonErrorResponse,
    },
    403: {
      description: 'Forbidden - user is not a Super Admin from Valorize HQ',
      ...commonErrorResponse,
    },
    500: {
      description: 'Internal server error',
      ...commonErrorResponse,
    },
  },
}

/**
 * Backoffice Verify Schema
 *
 * Validates the current JWT token and returns user session info
 * Used for checking if user is still logged in (e.g., on page reload)
 */
export const backofficeVerifySchema: FastifySchema = {
  tags: ['Backoffice', 'Authentication'],
  description:
    'Verify backoffice session and get user info - Requires valid JWT token from Super Admin',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                avatar: { type: 'string' },
                companyId: { type: 'string' },
                companyName: { type: 'string' },
                isActive: { type: 'boolean' },
                jobTitle: { type: ['string', 'null'] },
                department: { type: ['string', 'null'] },
              },
            },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: ['string', 'null'] },
                },
              },
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized - invalid or expired token',
      ...commonErrorResponse,
    },
    403: {
      description: 'Forbidden - user is not a Super Admin from Valorize HQ',
      ...commonErrorResponse,
    },
  },
}
