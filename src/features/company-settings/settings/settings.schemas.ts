import { z } from 'zod'

// @deprecated - Use /admin/company-settings instead
// Zod schema for type inference
const updateCompanySettingsZodSchema = {
  body: z.object({
    weeklyRenewalAmount: z
      .number()
      .int()
      .positive('Limit must be a positive number.')
      .optional(),
    renewalDay: z
      .number()
      .int()
      .min(1, 'Must be between 1 and 7.')
      .max(7, 'Must be between 1 and 7.')
      .optional(),
  }),
  params: z.object({
    companyId: z.string().cuid('Invalid company ID format.'),
  }),
}

// @deprecated - Use /admin/company-settings instead
// JSON Schema for Fastify (temporary until ZodTypeProvider is fully implemented)
export const updateCompanySettingsSchema = {
  body: {
    type: 'object',
    properties: {
      weeklyRenewalAmount: {
        type: 'integer',
        minimum: 50,
        maximum: 500,
      },
      renewalDay: {
        type: 'integer',
        minimum: 1,
        maximum: 7,
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
