// JSON Schema for Fastify validation

export const listPrizesSchema = {
  querystring: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by prize category',
      },
      minPrice: {
        type: 'integer',
        minimum: 0,
        description: 'Minimum coin price',
      },
      maxPrice: {
        type: 'integer',
        minimum: 0,
        description: 'Maximum coin price',
      },
    },
    additionalProperties: false,
  },
}

export const getPrizeDetailsSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Prize ID',
      },
    },
    required: ['id'],
  },
}

