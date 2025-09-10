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
  required: ['name', 'domain'],
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

const updateCompanyBodySchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Company name',
    },
    domain: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
      description: 'Domain',
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
    isActive: {
      type: 'boolean',
      description: 'Company active status',
    },
  },
  additionalProperties: false,
} as const

const addCompanyContactBodySchema = {
  type: 'object',
  required: ['companyId', 'userId', 'role'],
  properties: {
    companyId: {
      type: 'string',
      description: 'Company ID',
    },
    userId: {
      type: 'string',
      description: 'User ID',
    },
    role: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Role is required',
    },
    isPrimary: {
      type: 'boolean',
      description: 'Is primary contact',
    },
  },
  additionalProperties: false,
} as const

const updateCompanyContactBodySchema = {
  type: 'object',
  properties: {
    role: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Role',
    },
    isPrimary: {
      type: 'boolean',
      description: 'Is primary contact',
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

// Parameter schemas
const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      description: 'ID',
    },
  },
  additionalProperties: false,
} as const

const domainParamSchema = {
  type: 'object',
  required: ['domain'],
  properties: {
    domain: {
      type: 'string',
      minLength: 1,
      description: 'Domain is required',
    },
  },
  additionalProperties: false,
} as const

const companyIdParamSchema = {
  type: 'object',
  required: ['companyId'],
  properties: {
    companyId: {
      type: 'string',
      description: 'Company ID',
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
  description: 'Create a new company with optional Brazil-specific data',
  body: createCompanyBodySchema,
  response: {
    201: companyResponseSchema,
    400: commonErrorResponse,
    409: commonErrorResponse,
    500: commonErrorResponse,
  },
}

export const updateCompanySchema: FastifySchema = {
  tags: ['Companies'],
  summary: 'Update company',
  description: 'Update company information',
  params: idParamSchema,
  body: updateCompanyBodySchema,
  response: {
    200: companyResponseSchema,
    404: commonErrorResponse,
    409: commonErrorResponse,
    500: commonErrorResponse,
  },
}

export const getCompanySchema: FastifySchema = {
  tags: ['Companies'],
  summary: 'Get company by ID',
  description: 'Get detailed information about a specific company',
  params: idParamSchema,
  response: {
    200: companyResponseSchema,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

export const getCompanyByDomainSchema: FastifySchema = {
  tags: ['Companies'],
  summary: 'Get company by domain',
  description: 'Get company information by domain name',
  params: domainParamSchema,
  response: {
    200: companyResponseSchema,
    404: commonErrorResponse,
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

export const deleteCompanySchema: FastifySchema = {
  tags: ['Companies'],
  summary: 'Delete company',
  description: 'Soft delete a company (sets isActive to false)',
  params: idParamSchema,
  response: {
    200: deleteResponseSchema,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

export const addCompanyContactSchema: FastifySchema = {
  tags: ['Company Contacts'],
  summary: 'Add company contact',
  description: 'Add a new contact to a company',
  body: addCompanyContactBodySchema,
  response: {
    201: companyContactResponseSchema,
    409: commonErrorResponse,
    500: commonErrorResponse,
  },
}

export const updateCompanyContactSchema: FastifySchema = {
  tags: ['Company Contacts'],
  summary: 'Update company contact',
  description: 'Update a company contact information',
  params: idParamSchema,
  body: updateCompanyContactBodySchema,
  response: {
    200: companyContactResponseSchema,
    404: commonErrorResponse,
    500: commonErrorResponse,
  },
}

export const getCompanyContactsSchema: FastifySchema = {
  tags: ['Company Contacts'],
  summary: 'Get company contacts',
  description: 'Get all contacts for a specific company',
  params: companyIdParamSchema,
  response: {
    200: companyContactsListResponseSchema,
    500: commonErrorResponse,
  },
}

export const removeCompanyContactSchema: FastifySchema = {
  tags: ['Company Contacts'],
  summary: 'Remove company contact',
  description: 'Remove a contact from a company',
  params: idParamSchema,
  response: {
    200: deleteResponseSchema,
    404: commonErrorResponse,
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