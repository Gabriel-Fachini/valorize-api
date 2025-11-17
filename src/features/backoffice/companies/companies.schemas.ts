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

/**
 * Company list endpoint
 */
export const listCompaniesSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies'],
  description: 'List all companies with filters, pagination, and sorting',
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
        enum: ['name', 'createdAt', 'updatedAt', 'mrr'],
        default: 'updatedAt',
      },
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      // Filters
      search: { type: 'string' },
      status: { type: 'string', enum: ['active', 'inactive'] },
      planType: { type: 'string', enum: ['ESSENTIAL', 'PROFESSIONAL'] },
      country: { type: 'string', minLength: 2, maxLength: 2 },
      createdAfter: { type: 'string', format: 'date-time' },
      createdBefore: { type: 'string', format: 'date-time' },
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
              id: { type: 'string' },
              name: { type: 'string' },
              domain: { type: 'string' },
              country: { type: 'string' },
              logoUrl: { type: ['string', 'null'] },
              planType: { type: ['string', 'null'] },
              isActive: { type: 'boolean' },
              totalUsers: { type: 'number' },
              activeUsers: { type: 'number' },
              currentMRR: { type: 'number' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
        pagination: paginationResponse,
        aggregations: { type: 'object' },
      },
    },
    500: commonErrorResponse,
  },
}

/**
 * Get company details endpoint
 */
export const getCompanySchema: FastifySchema = {
  tags: ['Backoffice', 'Companies'],
  description: 'Get detailed information about a specific company',
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
          additionalProperties: true, // Allow all company detail properties
        },
      },
    },
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Create company endpoint
 */
export const createCompanySchema: FastifySchema = {
  tags: ['Backoffice', 'Companies'],
  description: 'Create a new company (wizard)',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['name', 'domain', 'country', 'timezone', 'plan', 'initialValues'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      domain: { type: 'string', minLength: 3, maxLength: 100 },
      country: { type: 'string', minLength: 2, maxLength: 2 },
      timezone: { type: 'string', minLength: 3, maxLength: 50 },
      logoUrl: { type: 'string', format: 'uri' },
      billingEmail: { type: 'string', format: 'email' },
      companyBrazil: {
        type: 'object',
        required: [
          'cnpj',
          'razaoSocial',
          'cnaePrincipal',
          'naturezaJuridica',
          'porteEmpresa',
          'situacaoCadastral',
        ],
        properties: {
          cnpj: { type: 'string', minLength: 14, maxLength: 14 },
          razaoSocial: { type: 'string', minLength: 2, maxLength: 200 },
          inscricaoEstadual: { type: 'string', maxLength: 20 },
          inscricaoMunicipal: { type: 'string', maxLength: 20 },
          nire: { type: 'string', maxLength: 20 },
          cnaePrincipal: { type: 'string', minLength: 7, maxLength: 7 },
          cnaeSecundario: { type: 'string', maxLength: 200 },
          naturezaJuridica: { type: 'string', maxLength: 100 },
          porteEmpresa: { type: 'string', maxLength: 50 },
          situacaoCadastral: { type: 'string', maxLength: 50 },
        },
      },
      plan: {
        type: 'object',
        required: ['planType', 'startDate'],
        properties: {
          planType: { type: 'string', enum: ['ESSENTIAL', 'PROFESSIONAL'] },
          pricePerUser: { type: 'number', minimum: 0 },
          startDate: { type: 'string', format: 'date-time' },
        },
      },
      initialValues: {
        type: 'array',
        minItems: 2,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 2, maxLength: 50 },
            description: { type: 'string', maxLength: 500 },
            example: { type: 'string', maxLength: 200 },
            iconName: { type: 'string', maxLength: 50 },
            iconColor: { type: 'string', maxLength: 7 },
          },
        },
      },
      initialWalletBudget: { type: 'number', minimum: 0 },
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
          },
        },
      },
    },
    400: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Update company endpoint
 */
export const updateCompanySchema: FastifySchema = {
  tags: ['Backoffice', 'Companies'],
  description: 'Update company basic information',
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
      name: { type: 'string', minLength: 2, maxLength: 100 },
      domain: { type: 'string', minLength: 3, maxLength: 100 },
      logoUrl: { type: 'string', format: 'uri' },
      country: { type: 'string', minLength: 2, maxLength: 2 },
      timezone: { type: 'string', minLength: 3, maxLength: 50 },
      billingEmail: { type: 'string', format: 'email' },
      companyBrazil: {
        type: 'object',
        required: [
          'cnpj',
          'razaoSocial',
          'cnaePrincipal',
          'naturezaJuridica',
          'porteEmpresa',
          'situacaoCadastral',
        ],
        properties: {
          cnpj: { type: 'string', minLength: 14, maxLength: 14 },
          razaoSocial: { type: 'string', minLength: 2, maxLength: 200 },
          inscricaoEstadual: { type: 'string', maxLength: 20 },
          inscricaoMunicipal: { type: 'string', maxLength: 20 },
          nire: { type: 'string', maxLength: 20 },
          cnaePrincipal: { type: 'string', minLength: 7, maxLength: 7 },
          cnaeSecundario: { type: 'string', maxLength: 200 },
          naturezaJuridica: { type: 'string', maxLength: 100 },
          porteEmpresa: { type: 'string', maxLength: 50 },
          situacaoCadastral: { type: 'string', maxLength: 50 },
        },
      },
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

/**
 * Simple action endpoints (activate, deactivate, freeze, unfreeze)
 */
export const simpleActionSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies'],
  description: 'Perform simple company actions',
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
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Get wallet status endpoint
 */
export const getWalletStatusSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'Wallet'],
  description: 'Get company wallet status and metrics',
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
        data: { type: 'object' },
      },
    },
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Add wallet credits endpoint
 */
export const addWalletCreditsSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'Wallet'],
  description: 'Add credits to company wallet',
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
    required: ['amount', 'reason'],
    properties: {
      amount: { type: 'number', minimum: 0.01 },
      reason: { type: 'string', minLength: 5, maxLength: 500 },
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

/**
 * Remove wallet credits endpoint
 */
export const removeWalletCreditsSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'Wallet'],
  description: 'Remove credits from company wallet',
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
    required: ['amount', 'reason'],
    properties: {
      amount: { type: 'number', minimum: 0.01 },
      reason: { type: 'string', minLength: 5, maxLength: 500 },
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
 * Update company plan endpoint
 */
export const updatePlanSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'Billing'],
  description: 'Update company plan and pricing',
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
    required: ['planType'],
    properties: {
      planType: { type: 'string', enum: ['ESSENTIAL', 'PROFESSIONAL'] },
      pricePerUser: { type: 'number', minimum: 0 },
      startDate: { type: 'string', format: 'date-time' },
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

/**
 * Get billing info endpoint
 */
export const getBillingInfoSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'Billing'],
  description: 'Get company billing information and MRR',
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
        data: { type: 'object' },
      },
    },
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Get company metrics endpoint
 */
export const getMetricsSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'Analytics'],
  description: 'Get company engagement and usage metrics',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
      },
    },
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

/**
 * Add company contact endpoint
 */
export const addContactSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'Contacts'],
  description: 'Link an existing user as a company contact',
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
    required: ['userId', 'role'],
    properties: {
      userId: { type: 'string' },
      role: { type: 'string', minLength: 2, maxLength: 100 },
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
 * Update company contact endpoint
 */
export const updateContactSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'Contacts'],
  description: 'Update company contact information',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id', 'contactId'],
    properties: {
      id: { type: 'string' },
      contactId: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    properties: {
      role: { type: 'string', minLength: 2, maxLength: 100 },
      isPrimary: { type: 'boolean' },
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

/**
 * Delete company contact endpoint
 */
export const deleteContactSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'Contacts'],
  description: 'Remove a contact from company',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id', 'contactId'],
    properties: {
      id: { type: 'string' },
      contactId: { type: 'string' },
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

/**
 * Add allowed domain endpoint
 */
export const addAllowedDomainSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'SSO'],
  description: 'Add an allowed email domain for SSO',
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
    required: ['domain'],
    properties: {
      domain: { type: 'string', minLength: 3, maxLength: 100 },
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
 * Delete allowed domain endpoint
 */
export const deleteAllowedDomainSchema: FastifySchema = {
  tags: ['Backoffice', 'Companies', 'SSO'],
  description: 'Remove an allowed email domain',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id', 'domainId'],
    properties: {
      id: { type: 'string' },
      domainId: { type: 'string' },
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
