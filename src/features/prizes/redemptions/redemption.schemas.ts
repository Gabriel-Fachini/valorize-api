// JSON Schema for Fastify validation

export const redeemPrizeSchema = {
  body: {
    type: 'object',
    properties: {
      prizeId: {
        type: 'string',
        description: 'Prize ID to redeem',
      },
      variantId: {
        type: 'string',
        description: 'Prize variant ID (optional if prize has no variants)',
      },
      addressId: {
        type: 'string',
        description: 'Address ID for delivery (must be owned by the user)',
      },
    },
    required: ['prizeId', 'addressId'],
    additionalProperties: false,
  },
}

export const getUserRedemptionsSchema = {
  querystring: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Number of redemptions per page',
      },
      offset: {
        type: 'integer',
        minimum: 0,
        default: 0,
        description: 'Offset for pagination',
      },
    },
    additionalProperties: false,
  },
}

export const getRedemptionDetailsSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Redemption ID',
      },
    },
    required: ['id'],
  },
}

export const cancelRedemptionSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Redemption ID',
      },
    },
    required: ['id'],
  },
  body: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        minLength: 5,
        maxLength: 500,
        description: 'Reason for cancellation',
      },
    },
    required: ['reason'],
    additionalProperties: false,
  },
}

