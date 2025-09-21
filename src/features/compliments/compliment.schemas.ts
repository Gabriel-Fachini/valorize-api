import { z } from 'zod'

// Zod schema for type inference
const sendComplimentZodSchema = {
  body: z.object({
    receiverId: z.string().cuid('Invalid receiver ID format.'),
    valueId: z.number().int().positive('Invalid company value ID.'),
    message: z
      .string()
      .min(10, 'Message must be at least 10 characters long.')
      .max(280, 'Message cannot exceed 280 characters.'),
    coins: z
      .number()
      .int()
      .min(5, 'You must send at least 5 coins.')
      .max(100, 'You cannot send more than 100 coins in a single compliment.')
      .refine((val) => val % 5 === 0, {
        message: 'Coins must be in multiples of 5 (5, 10, 15...100).',
      }),
  }),
}

// JSON Schema for Fastify (temporary until ZodTypeProvider is fully implemented)
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

export type SendComplimentInput = z.infer<typeof sendComplimentZodSchema.body>

// Export Zod schema for manual validation if needed
export const sendComplimentZod = sendComplimentZodSchema

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

// Zod schema for type inference
const complimentHistoryZodSchema = {
  querystring: z.object({
    type: z.enum(['sent', 'received']),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
}

export type ComplimentHistoryQuery = z.infer<typeof complimentHistoryZodSchema.querystring>

// Export Zod schema for manual validation if needed
export const complimentHistoryZod = complimentHistoryZodSchema
