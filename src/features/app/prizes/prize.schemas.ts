// JSON Schema for Fastify validation

export const listPrizesSchema = {
  querystring: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by prize category',
      },
      search: {
        type: 'string',
        description: 'Search by prize name or description',
      },
      sortBy: {
        type: 'string',
        enum: ['popular', 'most_redeemed', 'price_asc', 'price_desc'],
        description: 'Sort order: popular (default), most_redeemed, price_asc, price_desc',
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

