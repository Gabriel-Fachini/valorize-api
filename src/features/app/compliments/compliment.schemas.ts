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

// Schema for feed response
export const feedResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      sender: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          avatar: { type: ['string', 'null'] },
          department: { type: ['string', 'null'] },
        },
        required: ['id', 'name', 'avatar', 'department'],
      },
      receiver: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          avatar: { type: ['string', 'null'] },
          department: { type: ['string', 'null'] },
        },
        required: ['id', 'name', 'avatar', 'department'],
      },
      companyValue: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          title: { type: 'string' },
          iconName: { type: ['string', 'null'] },
          iconColor: { type: ['string', 'null'] },
        },
        required: ['id', 'title', 'iconName', 'iconColor'],
      },
      coins: { type: 'number' },
      message: { type: 'string' },
      createdAt: { type: 'string' },
      timeAgo: { type: 'string' },
    },
    required: [
      'id',
      'sender',
      'receiver',
      'companyValue',
      'coins',
      'message',
      'createdAt',
      'timeAgo',
    ],
  },
}

// TypeScript types for compliment schemas
export interface SendComplimentInput {
  receiverId: string
  valueId: number
  message: string
  coins: number
}

export interface ComplimentHistoryQuery {
  type: 'sent' | 'received'
  page?: number
  limit?: number
}
