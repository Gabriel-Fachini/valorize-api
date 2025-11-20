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
    // Database user fields (preferred)
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    avatar: { type: 'string' },
    companyId: { type: 'string' },
    jobTitle: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    department: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    isActive: { type: 'boolean' },
    auth0Sub: { type: 'string' },
    email_verified: { type: 'boolean' },
    // Auth0 fallback fields
    sub: { type: 'string' },
  },
} as const

// Login endpoint schema
export const loginSchema: FastifySchema = {
  tags: ['Authentication'],
  description: 'Login with email and password using Auth0 Resource Owner Password Grant',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
      },
      password: {
        type: 'string',
        minLength: 1,
        description: 'User password',
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
          },
        },
      },
    },
    400: commonErrorResponse,
    401: commonErrorResponse,
    500: commonErrorResponse,
  },
}

// Refresh token endpoint schema
export const refreshTokenSchema: FastifySchema = {
  tags: ['Authentication'],
  description: 'Refresh access token using refresh token',
  body: {
    type: 'object',
    required: ['refresh_token'],
    properties: {
      refresh_token: {
        type: 'string',
        minLength: 1,
        description: 'Valid refresh token',
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
          },
        },
      },
    },
    400: commonErrorResponse,
    401: commonErrorResponse,
  },
}

// Admin login endpoint schema
export const adminLoginSchema: FastifySchema = {
  tags: ['Authentication'],
  description: 'Admin login with email and password - validates admin permissions',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Admin user email address',
      },
      password: {
        type: 'string',
        minLength: 1,
        description: 'Admin user password',
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
            admin_permissions: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of admin permissions the user has',
            },
            roles: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of admin roles the user has',
            },
          },
        },
      },
    },
    400: commonErrorResponse,
    401: commonErrorResponse,
    403: commonErrorResponse,
    500: commonErrorResponse,
  },
}

// Signup endpoint schema
export const signupSchema: FastifySchema = {
  tags: ['Authentication'],
  description: 'Create a new user account with email and name. Password is set automatically.',
  body: {
    type: 'object',
    required: ['email', 'name'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
      },
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'User full name',
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
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                authUserId: { type: 'string' },
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
                companyId: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
    400: commonErrorResponse,
    409: commonErrorResponse,
    500: commonErrorResponse,
  },
}

// Verify session endpoint schema
export const verifySessionSchema: FastifySchema = {
  tags: ['Session'],
  description: 'Verify token validity and get session information. Use ?minimal=true for simple validation.',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      minimal: {
        type: 'boolean',
        description: 'Return minimal validation info for quick token checks',
        default: false,
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
            // Always present
            isValid: { type: 'boolean' },
            timeRemaining: { type: 'number' },
            // Conditional fields (only when minimal=false)
            expiresAt: { type: 'string', format: 'date-time' },
            timeRemainingFormatted: { type: 'string' },
            needsRefresh: { type: 'boolean' },
            user: userInfoSchema,
            message: { type: 'string' },
          },
        },
      },
    },
    400: commonErrorResponse,
    401: commonErrorResponse,
  },
}
