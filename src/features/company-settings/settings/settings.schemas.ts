import { z } from 'zod'

// Zod schema for type inference
const updateCompanySettingsZodSchema = {
  body: z.object({
    weeklyComplimentCoinLimit: z
      .number()
      .int()
      .positive('Limit must be a positive number.')
      .optional(),
    maxCoinsPerCompliment: z
      .number()
      .int()
      .min(5, 'Must be at least 5 coins.')
      .max(100, 'Cannot exceed 100 coins.')
      .optional(),
    minActiveValuesRequired: z
      .number()
      .int()
      .positive('Must be at least 1.')
      .optional(),
  }),
  params: z.object({
    companyId: z.string().cuid('Invalid company ID format.'),
  }),
}

// JSON Schema for Fastify (temporary until ZodTypeProvider is fully implemented)
export const updateCompanySettingsSchema = {
  body: {
    type: 'object',
    properties: {
      weeklyComplimentCoinLimit: {
        type: 'integer',
        minimum: 1,
      },
      maxCoinsPerCompliment: {
        type: 'integer',
        minimum: 5,
        maximum: 100,
      },
      minActiveValuesRequired: {
        type: 'integer',
        minimum: 1,
      },
    },
    additionalProperties: false,
  },
  params: {
    type: 'object',
    properties: {
      companyId: {
        type: 'string',
      },
    },
    required: ['companyId'],
    additionalProperties: false,
  },
}

export type UpdateCompanySettingsInput = z.infer<
  typeof updateCompanySettingsZodSchema.body
>

// Export Zod schema for manual validation if needed
export const updateCompanySettingsZod = updateCompanySettingsZodSchema
