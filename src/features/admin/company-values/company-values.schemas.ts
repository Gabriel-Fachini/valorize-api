/**
 * @fileoverview JSON Schemas for Company Values endpoints
 *
 * These schemas are used by Fastify for request/response validation
 * Validates company values operations (list, get, create, update, reorder)
 * Values are soft-deleted via isActive flag instead of hard delete
 */

/**
 * Response schema for a single Company Value
 */
export const companyValueResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    company_id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    example: { type: 'string', nullable: true },
    iconName: { type: 'string', nullable: true },
    iconColor: { type: 'string', nullable: true },
    order: { type: 'integer' },
    is_active: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'company_id', 'title', 'order', 'is_active', 'created_at', 'updated_at'],
}

/**
 * Response schema for Company Values list
 */
export const companyValuesListResponseSchema = {
  type: 'array',
  items: companyValueResponseSchema,
}

/**
 * GET /admin/company/values
 */
export const listCompanyValuesSchema = {
  tags: ['Admin - Company Values'],
  description: 'List all company values ordered by position',
  response: {
    200: companyValuesListResponseSchema,
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}

/**
 * GET /admin/company/values/:id
 */
export const getCompanyValueSchema = {
  tags: ['Admin - Company Values'],
  description: 'Get a specific company value by ID',
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
    },
    required: ['id'],
  },
  response: {
    200: companyValueResponseSchema,
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}

/**
 * POST /admin/company/values
 */
export const createCompanyValueSchema = {
  tags: ['Admin - Company Values'],
  description: 'Create a new company value',
  body: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },
      description: {
        type: 'string',
        maxLength: 500,
        nullable: true,
      },
      example: {
        type: 'string',
        maxLength: 500,
        nullable: true,
      },
      iconName: {
        type: 'string',
        maxLength: 100,
        nullable: true,
      },
      iconColor: {
        type: 'string',
        maxLength: 50,
        nullable: true,
      },
    },
    required: ['title'],
    additionalProperties: false,
  },
  response: {
    201: companyValueResponseSchema,
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    409: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}

/**
 * PATCH /admin/company/values/:id
 */
export const updateCompanyValueSchema = {
  tags: ['Admin - Company Values'],
  description: 'Update an existing company value',
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
    },
    required: ['id'],
  },
  body: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },
      description: {
        type: 'string',
        maxLength: 500,
        nullable: true,
      },
      example: {
        type: 'string',
        maxLength: 500,
        nullable: true,
      },
      iconName: {
        type: 'string',
        maxLength: 100,
        nullable: true,
      },
      iconColor: {
        type: 'string',
        maxLength: 50,
        nullable: true,
      },
      is_active: {
        type: 'boolean',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: companyValueResponseSchema,
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    409: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}

/**
 * PATCH /admin/company/values/reorder
 */
export const reorderCompanyValuesSchema = {
  tags: ['Admin - Company Values'],
  description: 'Reorder company values by providing ordered array of IDs',
  body: {
    type: 'object',
    properties: {
      ordered_ids: {
        type: 'array',
        items: { type: 'integer' },
        minItems: 1,
      },
    },
    required: ['ordered_ids'],
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        values: companyValuesListResponseSchema,
      },
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}

/**
 * DELETE /admin/company/values/:id
 */
export const deleteCompanyValueSchema = {
  tags: ['Admin - Company Values'],
  description: 'Delete a company value (soft delete via isActive flag)',
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
    },
    required: ['id'],
  },
  response: {
    204: {
      type: 'null',
      description: 'Company value deleted successfully',
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}
