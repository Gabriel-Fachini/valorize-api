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

const chargeObject = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    companyId: { type: 'string' },
    amount: { type: 'number' },
    description: { type: 'string' },
    dueDate: { type: 'string', format: 'date-time' },
    issueDate: { type: 'string', format: 'date-time' },
    status: { type: 'string', enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELED', 'PARTIAL'] },
    paymentMethod: { type: ['string', 'null'] },
    paidAt: { type: ['string', 'null'], format: 'date-time' },
    canceledAt: { type: ['string', 'null'], format: 'date-time' },
    notes: { type: ['string', 'null'] },
    createdBy: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

/**
 * List charges endpoint
 */
export const listChargesSchema: FastifySchema = {
  tags: ['Backoffice', 'Financial'],
  description: 'List all charges with filters, pagination, and sorting',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      // Pagination
      page: { type: 'number', minimum: 1, default: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      // Sorting
      sortBy: {
        type: 'string',
        enum: ['issueDate', 'dueDate', 'amount', 'status'],
        default: 'dueDate',
      },
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      // Filters
      companyId: { type: 'string' },
      status: { type: 'string', enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELED', 'PARTIAL'] },
      dueDateFrom: { type: 'string', format: 'date' },
      dueDateTo: { type: 'string', format: 'date' },
      issueDateFrom: { type: 'string', format: 'date' },
      issueDateTo: { type: 'string', format: 'date' },
      search: { type: 'string' },
    },
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
              ...chargeObject.properties,
              company: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  cnpj: { type: ['string', 'null'] },
                },
              },
              createdByUser: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              attachments: { type: 'array' },
              payments: { type: 'array' },
            },
          },
        },
        pagination: paginationResponse,
        aggregations: {
          type: 'object',
          properties: {
            totalAmount: { type: 'number' },
            pendingAmount: { type: 'number' },
            paidAmount: { type: 'number' },
            overdueAmount: { type: 'number' },
            partialAmount: { type: 'number' },
            chargesByStatus: { type: 'object' },
          },
        },
      },
    },
    500: commonErrorResponse,
  },
}

/**
 * Get charge details endpoint
 */
export const getChargeSchema: FastifySchema = {
  tags: ['Backoffice', 'Financial'],
  description: 'Get detailed information about a specific charge',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
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
            ...chargeObject.properties,
            company: { type: 'object' },
            createdByUser: { type: 'object' },
            attachments: { type: 'array' },
            payments: { type: 'array' },
            balance: { type: 'number' },
            totalPaid: { type: 'number' },
            isPaid: { type: 'boolean' },
          },
        },
      },
    },
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Create charge endpoint
 */
export const createChargeSchema: FastifySchema = {
  tags: ['Backoffice', 'Financial'],
  description: 'Create a new charge for a company',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['companyId', 'amount', 'description', 'dueDate'],
    properties: {
      companyId: { type: 'string' },
      amount: { type: 'number', minimum: 0.01 },
      description: { type: 'string', minLength: 1, maxLength: 500 },
      dueDate: { type: 'string', format: 'date' },
      paymentMethod: { type: 'string', enum: ['BOLETO', 'PIX', 'CREDIT_CARD'] },
      notes: { type: 'string', maxLength: 2000 },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: chargeObject,
      },
    },
    400: commonErrorResponse,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Update charge endpoint
 */
export const updateChargeSchema: FastifySchema = {
  tags: ['Backoffice', 'Financial'],
  description: 'Update an existing charge',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    properties: {
      amount: { type: 'number', minimum: 0.01 },
      description: { type: 'string', minLength: 1, maxLength: 500 },
      dueDate: { type: 'string', format: 'date' },
      paymentMethod: { type: 'string', enum: ['BOLETO', 'PIX', 'CREDIT_CARD'] },
      notes: { type: 'string', maxLength: 2000 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: chargeObject,
      },
    },
    400: commonErrorResponse,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Delete charge endpoint
 */
export const deleteChargeSchema: FastifySchema = {
  tags: ['Backoffice', 'Financial'],
  description: 'Delete a charge (only if status is PENDING or CANCELED)',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    400: commonErrorResponse,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Cancel charge endpoint
 */
export const cancelChargeSchema: FastifySchema = {
  tags: ['Backoffice', 'Financial'],
  description: 'Cancel a charge (only if status is PENDING or OVERDUE)',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: chargeObject,
      },
    },
    400: commonErrorResponse,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Register payment endpoint
 */
export const registerPaymentSchema: FastifySchema = {
  tags: ['Backoffice', 'Financial'],
  description: 'Register a payment for a charge',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['amount', 'paidAt', 'paymentMethod'],
    properties: {
      amount: { type: 'number', minimum: 0.01 },
      paidAt: { type: 'string', format: 'date-time' },
      paymentMethod: { type: 'string', enum: ['BOLETO', 'PIX', 'CREDIT_CARD'] },
      notes: { type: 'string', maxLength: 2000 },
    },
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
            chargeId: { type: 'string' },
            amount: { type: 'number' },
            paidAt: { type: 'string', format: 'date-time' },
            paymentMethod: { type: 'string' },
            notes: { type: ['string', 'null'] },
            registeredBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: commonErrorResponse,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Upload attachment endpoint
 */
export const uploadAttachmentSchema: FastifySchema = {
  tags: ['Backoffice', 'Financial'],
  description: 'Upload an attachment for a charge (e.g., invoice, receipt)',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  consumes: ['multipart/form-data'],
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            chargeId: { type: 'string' },
            fileName: { type: 'string' },
            fileUrl: { type: 'string' },
            fileSize: { type: 'number' },
            fileType: { type: 'string' },
            uploadedBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: commonErrorResponse,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Delete attachment endpoint
 */
export const deleteAttachmentSchema: FastifySchema = {
  tags: ['Backoffice', 'Financial'],
  description: 'Delete an attachment from a charge',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id', 'attachmentId'],
    properties: {
      id: { type: 'string' },
      attachmentId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}
