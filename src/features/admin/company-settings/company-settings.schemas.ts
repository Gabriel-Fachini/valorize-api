/**
 * @fileoverview JSON Schemas for Company Settings endpoints
 *
 * These schemas are used by Fastify for request/response validation
 * All validations follow the API specification in API_ENDPOINTS_COMPANY.md
 */

// Domain validation regex - matches valid domain formats
const DOMAIN_PATTERN = '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$'

/**
 * Response schema for Company Settings
 */
export const companySettingsResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    logo_url: { type: 'string', nullable: true },
    domains: {
      type: 'array',
      items: { type: 'string' }
    },
    weekly_renewal_amount: { type: 'integer' },
    renewal_day: { type: 'integer' },
    timezone: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'domains', 'weekly_renewal_amount', 'renewal_day', 'timezone', 'created_at', 'updated_at'],
}

/**
 * GET /admin/company/settings
 */
export const getCompanySettingsSchema = {
  tags: ['Admin - Company Settings'],
  description: 'Get company settings',
  response: {
    200: companySettingsResponseSchema,
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}

/**
 * PUT /admin/company/settings
 */
export const updateCompanySettingsSchema = {
  tags: ['Admin - Company Settings'],
  description: 'Update all company settings',
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },
      logo_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
      },
      domains: {
        type: 'array',
        items: {
          type: 'string',
          pattern: DOMAIN_PATTERN,
        },
        minItems: 1,
      },
      weekly_renewal_amount: {
        type: 'integer',
        minimum: 50,
        maximum: 500,
      },
      renewal_day: {
        type: 'integer',
        minimum: 1,
        maximum: 7,
      },
    },
    required: ['name', 'domains', 'weekly_renewal_amount', 'renewal_day'],
    additionalProperties: false,
  },
  response: {
    200: companySettingsResponseSchema,
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
}

/**
 * PATCH /admin/company/settings/basic-info
 */
export const updateBasicInfoSchema = {
  tags: ['Admin - Company Settings'],
  description: 'Update basic company information (name and logo)',
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 100,
      },
      logo_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
      },
    },
    required: ['name'],
    additionalProperties: false,
  },
  response: {
    200: companySettingsResponseSchema,
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}

/**
 * PATCH /admin/company/settings/domains
 */
export const updateDomainsSchema = {
  tags: ['Admin - Company Settings'],
  description: 'Update allowed domains for SSO',
  body: {
    type: 'object',
    properties: {
      domains: {
        type: 'array',
        items: {
          type: 'string',
          pattern: DOMAIN_PATTERN,
        },
        minItems: 1,
      },
    },
    required: ['domains'],
    additionalProperties: false,
  },
  response: {
    200: companySettingsResponseSchema,
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              domain: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
}

/**
 * PATCH /admin/company/settings/coin-economy
 */
export const updateCoinEconomySchema = {
  tags: ['Admin - Company Settings'],
  description: 'Update coin economy settings',
  body: {
    type: 'object',
    properties: {
      weekly_renewal_amount: {
        type: 'integer',
        minimum: 50,
        maximum: 500,
      },
      renewal_day: {
        type: 'integer',
        minimum: 1,
        maximum: 7,
      },
    },
    required: ['weekly_renewal_amount', 'renewal_day'],
    additionalProperties: false,
  },
  response: {
    200: companySettingsResponseSchema,
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
}

/**
 * POST /admin/company/logo
 */
export const uploadLogoSchema = {
  tags: ['Admin - Company Settings'],
  description: 'Upload company logo (MOCK - to be implemented)',
  body: {
    type: 'object',
    properties: {
      logo_url: {
        type: 'string',
        format: 'uri',
      },
    },
    required: ['logo_url'],
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        logo_url: { type: 'string' },
      },
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}
