/**
 * @fileoverview JSON Schemas for Company Coin Economy endpoints
 *
 * These schemas are used by Fastify for request/response validation
 */

/**
 * Response schema for Coin Economy Settings
 */
export const coinEconomyResponseSchema = {
  type: 'object',
  properties: {
    weekly_renewal_amount: { type: 'integer', minimum: 50, maximum: 500 },
    renewal_day: { type: 'integer', minimum: 1, maximum: 7 },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
  required: ['weekly_renewal_amount', 'renewal_day', 'created_at', 'updated_at'],
}

/**
 * GET /admin/company/coin-economy
 */
export const getCoinEconomySchema = {
  tags: ['Admin - Company Coin Economy'],
  description: 'Get coin economy settings',
  response: {
    200: coinEconomyResponseSchema,
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
 * PATCH /admin/company/coin-economy
 */
export const updateCoinEconomySchema = {
  tags: ['Admin - Company Coin Economy'],
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
    additionalProperties: false,
  },
  response: {
    200: coinEconomyResponseSchema,
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}
