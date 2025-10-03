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
      deliveryInfo: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            minLength: 5,
            maxLength: 500,
            description: 'Delivery address',
          },
          city: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'City',
          },
          state: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'State',
          },
          zipCode: {
            type: 'string',
            minLength: 5,
            maxLength: 20,
            description: 'ZIP/Postal code',
          },
          phone: {
            type: 'string',
            minLength: 8,
            maxLength: 20,
            description: 'Contact phone number',
          },
          additionalInfo: {
            type: 'string',
            maxLength: 500,
            description: 'Additional delivery information (optional)',
          },
        },
        required: ['address', 'city', 'state', 'zipCode', 'phone'],
        additionalProperties: false,
      },
    },
    required: ['prizeId', 'deliveryInfo'],
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

