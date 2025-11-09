export const sendComplimentSchema = {
  body: {
    type: 'object',
    properties: {
      receiverId: {
        type: 'string',
      },
      valueId: {
        type: 'integer',
        minimum: 1,
      },
      message: {
        type: 'string',
        minLength: 10,
        maxLength: 280,
      },
      coins: {
        type: 'integer',
        minimum: 5,
        maximum: 100,
        multipleOf: 5,
      },
    },
    required: ['receiverId', 'valueId', 'message', 'coins'],
    additionalProperties: false,
  },
}

// Schema for compliment history query
export const complimentHistorySchema = {
  querystring: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['sent', 'received'],
        description: 'Type of compliments to retrieve: sent or received',
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number for pagination',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Number of compliments per page',
      },
    },
    required: ['type'],
    additionalProperties: false,
  },
}
