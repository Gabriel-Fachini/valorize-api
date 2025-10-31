/**
 * @fileoverview JSON Schemas for Company Domains endpoints
 *
 * These schemas are used by Fastify for request/response validation
 */

// Domain validation regex - matches valid domain formats
const DOMAIN_PATTERN = '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$'

/**
 * Response schema for a single domain
 */
export const domainResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    domain: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'domain', 'created_at'],
}

/**
 * Response schema for domain list
 */
export const domainListResponseSchema = {
  type: 'array',
  items: domainResponseSchema,
}

/**
 * GET /admin/company/domains
 */
export const listDomainsSchema = {
  tags: ['Admin - Company Domains'],
  description: 'List all allowed domains for SSO',
  response: {
    200: domainListResponseSchema,
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}

/**
 * PUT /admin/company/domains
 */
export const replaceDomainsSchema = {
  tags: ['Admin - Company Domains'],
  description: 'Replace all allowed domains',
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
    200: domainListResponseSchema,
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
 * POST /admin/company/domains
 */
export const addDomainSchema = {
  tags: ['Admin - Company Domains'],
  description: 'Add a new allowed domain',
  body: {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        pattern: DOMAIN_PATTERN,
      },
    },
    required: ['domain'],
    additionalProperties: false,
  },
  response: {
    201: domainResponseSchema,
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    409: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}

/**
 * DELETE /admin/company/domains/:id
 */
export const removeDomainSchema = {
  tags: ['Admin - Company Domains'],
  description: 'Remove a specific allowed domain',
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  response: {
    204: {
      type: 'null',
      description: 'Domain removed successfully',
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}
