/**
 * @fileoverview JSON Schemas for Company Info endpoints
 *
 * These schemas are used by Fastify for request/response validation
 */

/**
 * Response schema for Company Info (GET endpoint)
 */
export const companyInfoResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    logo_url: { type: 'string', nullable: true },
  },
  required: ['name'],
}

/**
 * GET /admin/company/info
 */
export const getCompanyInfoSchema = {
  tags: ['Admin - Company Info'],
  description: 'Get basic company information',
  response: {
    200: companyInfoResponseSchema,
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
 * PATCH /admin/company/info
 */
export const updateCompanyInfoSchema = {
  tags: ['Admin - Company Info'],
  description: 'Update basic company information',
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 100,
      },
      logo_url: {
        anyOf: [
          { type: 'null' },
          { type: 'string', const: '' },
          { type: 'string', format: 'uri', minLength: 1 },
        ],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {},
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
 * POST /admin/company/info/logo
 */
export const uploadLogoSchema = {
  tags: ['Admin - Company Info'],
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
