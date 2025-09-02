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
    sub: { type: 'string' },
    email: { type: 'string', format: 'email' },
    email_verified: { type: 'boolean' },
    name: { type: 'string' },
    picture: { type: 'string' },
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
