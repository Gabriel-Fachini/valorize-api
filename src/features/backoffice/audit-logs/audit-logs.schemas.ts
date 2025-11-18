import { FastifySchema } from 'fastify'

/**
 * Common response schemas
 */

const commonErrorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: { type: 'string' },
    message: { type: 'string' },
    statusCode: { type: 'number' },
  },
} as const

const paginationResponse = {
  type: 'object',
  properties: {
    page: { type: 'number' },
    limit: { type: 'number' },
    total: { type: 'number' },
    totalPages: { type: 'number' },
  },
} as const

const auditLogItemResponse = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
      },
    },
    action: { type: 'string' },
    entityType: { type: 'string' },
    entityId: { type: 'string' },
    changes: { type: ['object', 'null'] },
    metadata: { type: ['object', 'null'] },
    createdAt: { type: 'string' },
    companyId: { type: ['string', 'null'] },
  },
} as const

/**
 * List all audit logs (global)
 */
export const listAuditLogsSchema: FastifySchema = {
  tags: ['Backoffice', 'Audit Logs'],
  description: 'List all audit logs across companies with filters and pagination',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      // Pagination
      page: { type: 'number', minimum: 1, default: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
      // Sorting
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      // Filters
      action: { type: 'string' },
      entityType: { type: 'string' },
      userId: { type: 'string' },
      companyId: { type: 'string' },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: auditLogItemResponse,
        },
        pagination: paginationResponse,
      },
    },
    403: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * List audit logs for a specific company
 */
export const listCompanyAuditLogsSchema: FastifySchema = {
  tags: ['Backoffice', 'Audit Logs'],
  description: 'List audit logs for a specific company',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['companyId'],
    properties: {
      companyId: { type: 'string' },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      // Pagination
      page: { type: 'number', minimum: 1, default: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
      // Sorting
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      // Filters
      action: { type: 'string' },
      entityType: { type: 'string' },
      userId: { type: 'string' },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: auditLogItemResponse,
        },
        pagination: paginationResponse,
      },
    },
    403: commonErrorResponse,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * List audit logs for a specific user (Super Admin actions)
 */
export const listUserAuditLogsSchema: FastifySchema = {
  tags: ['Backoffice', 'Audit Logs'],
  description: 'List all actions performed by a specific Super Admin',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      // Pagination
      page: { type: 'number', minimum: 1, default: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
      // Sorting
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      // Filters
      action: { type: 'string' },
      entityType: { type: 'string' },
      companyId: { type: 'string' },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: auditLogItemResponse,
        },
        pagination: paginationResponse,
      },
    },
    403: commonErrorResponse,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}
