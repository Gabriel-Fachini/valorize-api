// JSON Schema for Fastify validation

export const sendVoucherToUserSchema = {
  body: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'CUID of the target user',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email must match user\'s registered email',
      },
      prizeId: {
        type: 'string',
        description: 'CUID of a voucher prize',
      },
      customAmount: {
        type: 'number',
        minimum: 0.01,
        description: 'Amount must be within voucher\'s minValue/maxValue range',
      },
    },
    required: ['userId', 'email', 'prizeId', 'customAmount'],
    additionalProperties: false,
  },
}

export const bulkRedeemVouchersSchema = {
  body: {
    type: 'object',
    properties: {
      prizeId: {
        type: 'string',
        description: 'CUID of a voucher prize',
      },
      customAmount: {
        type: 'number',
        minimum: 0.01,
        description: 'Amount must be within voucher\'s minValue/maxValue range',
      },
      campaignId: {
        type: 'string',
        description: 'Optional campaign ID (uses server default if not provided)',
      },
      users: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'CUID of the target user',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email must match user\'s registered email',
            },
          },
          required: ['userId', 'email'],
          additionalProperties: false,
        },
        minItems: 1,
        maxItems: 100,
        description: 'Array of users to receive vouchers (1-100 users)',
      },
    },
    required: ['prizeId', 'customAmount', 'users'],
    additionalProperties: false,
  },
}
