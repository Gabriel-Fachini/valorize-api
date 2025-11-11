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
      allUsersSelected: {
        type: 'boolean',
        description: 'If true, sends vouchers to all users in the company. If false or not provided, uses the users array',
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
        description: 'Array of users to receive vouchers (1-100 users). Not required if allUsersSelected is true',
      },
    },
    required: ['prizeId', 'customAmount'],
    additionalProperties: false,
  },
}

// Admin Redemption Management Schemas

export const listRedemptionsQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description: 'Search by user name or prize name (partial match, case-insensitive)',
      },
      status: {
        type: 'string',
        description: 'Filter by redemption status. Vouchers: sent. Physical products: pending, processing, completed, shipped, delivered, cancelled',
      },
      type: {
        type: 'string',
        enum: ['voucher', 'physical'],
        description: 'Filter by prize type',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Number of results per page',
      },
      offset: {
        type: 'integer',
        minimum: 0,
        default: 0,
        description: 'Number of results to skip',
      },
    },
    additionalProperties: false,
  },
}

export const getRedemptionParamsSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'CUID of the redemption',
      },
    },
    required: ['id'],
    additionalProperties: false,
  },
}

export const updateStatusSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'CUID of the redemption',
      },
    },
    required: ['id'],
    additionalProperties: false,
  },
  body: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['sent', 'pending', 'processing', 'completed', 'shipped', 'delivered', 'cancelled'],
        description: 'New redemption status. Vouchers: sent. Products/Experiences: pending, processing, completed, shipped, delivered, cancelled',
      },
      notes: {
        type: 'string',
        maxLength: 500,
        description: 'Optional notes about the status change',
      },
    },
    required: ['status'],
    additionalProperties: false,
  },
}

export const updateTrackingSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'CUID of the redemption',
      },
    },
    required: ['id'],
    additionalProperties: false,
  },
  body: {
    type: 'object',
    properties: {
      trackingCode: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Tracking code for the shipment',
      },
      carrier: {
        type: 'string',
        maxLength: 100,
        description: 'Optional carrier name (e.g., Sedex, Correios)',
      },
      notes: {
        type: 'string',
        maxLength: 500,
        description: 'Optional notes about the tracking',
      },
    },
    required: ['trackingCode'],
    additionalProperties: false,
  },
}

export const addNoteSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'CUID of the redemption',
      },
    },
    required: ['id'],
    additionalProperties: false,
  },
  body: {
    type: 'object',
    properties: {
      note: {
        type: 'string',
        minLength: 1,
        maxLength: 500,
        description: 'Admin note to add to the redemption',
      },
    },
    required: ['note'],
    additionalProperties: false,
  },
}

export const cancelRedemptionSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'CUID of the redemption',
      },
    },
    required: ['id'],
    additionalProperties: false,
  },
  body: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        maxLength: 500,
        description: 'Optional reason for cancellation',
      },
    },
    additionalProperties: false,
  },
}

export const metricsQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        format: 'date-time',
        description: 'Start date in ISO 8601 format. Default: 30 days ago',
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        description: 'End date in ISO 8601 format. Default: today',
      },
    },
    additionalProperties: false,
  },
}
