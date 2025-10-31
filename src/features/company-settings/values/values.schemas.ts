import { z } from 'zod'

// Zod schemas for type inference
const createCompanyValueZodSchema = {
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long.'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters long.'),
    iconName: z.string().min(1, 'Icon name is required.'),
    iconColor: z.string().optional(),
  }),
  params: z.object({
    companyId: z.string().cuid('Invalid company ID format.'),
  }),
}

const listCompanyValuesZodSchema = {
  params: z.object({
    companyId: z.string().cuid('Invalid company ID format.'),
  }),
}

// JSON Schemas for Fastify (temporary until ZodTypeProvider is fully implemented)
export const createCompanyValueSchema = {
  body: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 3,
      },
      description: {
        type: 'string',
        minLength: 10,
      },
      iconName: {
        type: 'string',
        minLength: 1,
      },
      iconColor: {
        type: 'string',
      },
    },
    required: ['title', 'description', 'iconName'],
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

export const listCompanyValuesSchema = {
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

export type CreateCompanyValueInput = z.infer<
  typeof createCompanyValueZodSchema.body
>

// Export Zod schemas for manual validation if needed
export const createCompanyValueZod = createCompanyValueZodSchema
export const listCompanyValuesZod = listCompanyValuesZodSchema