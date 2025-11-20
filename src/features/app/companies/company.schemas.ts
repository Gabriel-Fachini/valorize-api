import { FastifySchema } from 'fastify'

// Common response schemas
const commonErrorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', default: false },
    error: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'string' },
        details: {},
      },
      required: ['message'],
    },
  },
} as const

const commonSuccessResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', default: true },
    meta: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  },
} as const

const commonListMeta = {
  type: 'object',
  properties: {
    total: { type: 'number' },
    timestamp: { type: 'string', format: 'date-time' },
  },
} as const

// Company data schemas
const companyDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    domain: { type: 'string' },
    country: { type: 'string' },
    timezone: { type: 'string' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

const companyBrazilDataSchema = {
  type: ['object', 'null'],
  properties: {
    id: { type: 'string' },
    cnpj: { type: 'string' },
    razaoSocial: { type: 'string' },
    inscricaoEstadual: { type: ['string', 'null'] },
    inscricaoMunicipal: { type: ['string', 'null'] },
    nire: { type: ['string', 'null'] },
    cnaePrincipal: { type: 'string' },
    cnaeSecundario: { type: ['string', 'null'] },
    naturezaJuridica: { type: 'string' },
    porteEmpresa: { type: 'string' },
    situacaoCadastral: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

const userDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
  },
} as const

const firstAdminSchema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Administrator full name',
    },
    email: {
      type: 'string',
      format: 'email',
      minLength: 1,
      description: 'Administrator email (must match company domain)',
    },
  },
} as const

const companyContactDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    companyId: { type: 'string' },
    userId: { type: 'string' },
    role: { type: 'string' },
    isPrimary: { type: 'boolean' },
    user: userDataSchema,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

const fullCompanyDataSchema = {
  type: 'object',
  properties: {
    ...companyDataSchema.properties,
    companyBrazil: companyBrazilDataSchema,
    contacts: {
      type: 'array',
      items: companyContactDataSchema,
    },
  },
} as const

// Request body schemas
const createCompanyBodySchema = {
  type: 'object',
  required: ['name', 'domain', 'firstAdmin'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Company name is required',
    },
    domain: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
      description: 'Domain is required',
    },
    country: {
      type: 'string',
      minLength: 2,
      maxLength: 2,
      description: 'Country code must be 2 characters',
    },
    timezone: {
      type: 'string',
      description: 'Timezone',
    },
    firstAdmin: firstAdminSchema,
    brazilData: {
      type: 'object',
      properties: {
        cnpj: {
          type: 'string',
          minLength: 14,
          maxLength: 18,
          description: 'CNPJ must have 14 digits',
        },
        razaoSocial: {
          type: 'string',
          minLength: 1,
          maxLength: 255,
          description: 'Razão social is required',
        },
        inscricaoEstadual: {
          type: 'string',
          maxLength: 20,
          description: 'Inscrição estadual',
        },
        inscricaoMunicipal: {
          type: 'string',
          maxLength: 20,
          description: 'Inscrição municipal',
        },
        nire: {
          type: 'string',
          maxLength: 20,
          description: 'NIRE',
        },
        cnaePrincipal: {
          type: 'string',
          minLength: 1,
          maxLength: 10,
          description: 'CNAE principal is required',
        },
        cnaeSecundario: {
          type: 'string',
          maxLength: 255,
          description: 'CNAE secundário',
        },
        naturezaJuridica: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Natureza jurídica is required',
        },
        porteEmpresa: {
          type: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Porte da empresa is required',
        },
        situacaoCadastral: {
          type: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Situação cadastral is required',
        },
      },
      required: ['cnpj', 'razaoSocial', 'cnaePrincipal', 'naturezaJuridica', 'porteEmpresa', 'situacaoCadastral'],
    },
  },
  additionalProperties: false,
} as const

const validateCNPJBodySchema = {
  type: 'object',
  required: ['cnpj'],
  properties: {
    cnpj: {
      type: 'string',
      minLength: 14,
      maxLength: 18,
      description: 'CNPJ must have 14 digits',
    },
  },
  additionalProperties: false,
} as const

// Response schemas
const companyResponseSchema = {
  type: 'object',
  properties: {
    ...commonSuccessResponse.properties,
    data: fullCompanyDataSchema,
  },
} as const

const firstAdminDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    auth0Id: { type: 'string' },
    roles: {
      type: 'array',
      items: { type: 'string' },
    },
  },
} as const

const createCompanyResponseSchema = {
  type: 'object',
  properties: {
    ...commonSuccessResponse.properties,
    data: {
      type: 'object',
      properties: {
        company: fullCompanyDataSchema,
        firstAdmin: firstAdminDataSchema,
        passwordResetUrl: { type: 'string' },
      },
    },
  },
} as const

const companiesListResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', default: true },
    data: {
      type: 'array',
      items: companyDataSchema,
    },
    meta: commonListMeta,
  },
} as const

const companyContactResponseSchema = {
  type: 'object',
  properties: {
    ...commonSuccessResponse.properties,
    data: companyContactDataSchema,
  },
} as const

const companyContactsListResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', default: true },
    data: {
      type: 'array',
      items: companyContactDataSchema,
    },
    meta: commonListMeta,
  },
} as const

const cnpjValidationResponseSchema = {
  type: 'object',
  properties: {
    ...commonSuccessResponse.properties,
    data: {
      type: 'object',
      properties: {
        cnpj: { type: 'string' },
        formatted: { type: 'string' },
        isValid: { type: 'boolean' },
      },
    },
  },
} as const

const deleteResponseSchema = {
  type: 'object',
  properties: {
    ...commonSuccessResponse.properties,
    data: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
} as const

// Complete endpoint schemas
export const createCompanySchema: FastifySchema = {
  tags: ['Companies'],
  summary: 'Create a new company',
  description: 'Create a new company with first admin user and optional Brazil-specific data',
  body: createCompanyBodySchema,
  response: {
    201: createCompanyResponseSchema,
    400: commonErrorResponse,
    409: commonErrorResponse,
    500: commonErrorResponse,
  },
}

export const getAllCompaniesSchema: FastifySchema = {
  tags: ['Companies'],
  summary: 'List all companies',
  description: 'Get a list of all active companies',
  response: {
    200: companiesListResponseSchema,
    500: commonErrorResponse,
  },
}

export const validateCNPJSchema: FastifySchema = {
  tags: ['Companies'],
  summary: 'Validate CNPJ',
  description: 'Validate a Brazilian CNPJ number',
  body: validateCNPJBodySchema,
  response: {
    200: cnpjValidationResponseSchema,
    500: commonErrorResponse,
  },
}

// Export response schemas for direct use
export { 
  companiesListResponseSchema,
  companyResponseSchema,
  companyContactResponseSchema,
  companyContactsListResponseSchema,
  cnpjValidationResponseSchema,
  deleteResponseSchema,
  commonErrorResponse as errorResponseSchema,
}