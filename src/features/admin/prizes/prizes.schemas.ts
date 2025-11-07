/**
 * JSON Schemas for Prize Admin routes
 * Following Fastify schema validation pattern
 */

// Error response schemas
const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
  },
}

const insufficientPermissionSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    required: { type: 'string' },
    current: {
      type: 'array',
      items: { type: 'string' },
    },
  },
}

// Prize response schema
const prizeResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    companyId: { type: ['string', 'null'] },
    name: { type: 'string' },
    description: { type: 'string' },
    category: { type: 'string', enum: ['voucher', 'experience', 'product'] },
    images: {
      type: 'array',
      items: { type: 'string' },
    },
    coinPrice: { type: 'integer' },
    brand: { type: ['string', 'null'] },
    specifications: {
      oneOf: [
        { type: 'object', additionalProperties: true },
        { type: 'null' },
      ],
    },
    stock: { type: 'integer' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
}

// Pagination schema
const paginationSchema = {
  type: 'object',
  properties: {
    total: { type: 'integer' },
    page: { type: 'integer' },
    limit: { type: 'integer' },
    totalPages: { type: 'integer' },
  },
}

/**
 * POST /admin/prizes - Create a new prize
 */
export const createPrizeSchema = {
  tags: ['Admin - Prizes'],
  description: `Create a new prize (without images initially).

Categories:
- voucher: Digital vouchers (usually global, synced from Tremendous)
- product: Physical products (can be global or company-specific, requires shipping address)
- experience: Intangible rewards managed by the company (day-off, mentorship, etc.)

Global Prizes:
- Set isGlobal=true to create a prize available for all companies
- Requires 'prizes:create_global' permission (SUPER_ADMIN only)
- Company admins can only create company-specific prizes (isGlobal=false)`,
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 3, maxLength: 200 },
      description: { type: 'string', minLength: 10, maxLength: 2000 },
      category: { type: 'string', enum: ['voucher', 'experience', 'product'] },
      coinPrice: { type: 'integer', minimum: 1 },
      brand: { type: 'string', maxLength: 100 },
      stock: { type: 'integer', minimum: 0 },
      specifications: { type: 'object', additionalProperties: true },
      isGlobal: { type: 'boolean', default: false },
    },
    required: ['name', 'description', 'category', 'coinPrice', 'stock'],
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        prize: prizeResponseSchema,
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: insufficientPermissionSchema,
    500: errorResponseSchema,
  },
}

/**
 * GET /admin/prizes - List prizes with filters and pagination
 */
export const listPrizesSchema = {
  tags: ['Admin - Prizes'],
  description: 'List all prizes with filtering, search, and pagination',
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      category: { type: 'string', enum: ['voucher', 'experience', 'product'] },
      isActive: { type: 'boolean' },
      isGlobal: { type: 'boolean' },
      search: { type: 'string', minLength: 1 },
      orderBy: {
        type: 'string',
        enum: ['createdAt', 'updatedAt', 'coinPrice', 'name'],
        default: 'createdAt',
      },
      order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        prizes: {
          type: 'array',
          items: prizeResponseSchema,
        },
        pagination: paginationSchema,
      },
    },
    401: errorResponseSchema,
    403: insufficientPermissionSchema,
    500: errorResponseSchema,
  },
}

/**
 * GET /admin/prizes/:id - Get a single prize by ID
 */
export const getPrizeSchema = {
  tags: ['Admin - Prizes'],
  description: 'Get details of a specific prize',
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        prize: prizeResponseSchema,
      },
    },
    401: errorResponseSchema,
    403: insufficientPermissionSchema,
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
}

/**
 * PATCH /admin/prizes/:id - Update a prize
 */
export const updatePrizeSchema = {
  tags: ['Admin - Prizes'],
  description: 'Update an existing prize (only prizes owned by your company)',
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 3, maxLength: 200 },
      description: { type: 'string', minLength: 10, maxLength: 2000 },
      category: { type: 'string', enum: ['voucher', 'experience', 'product'] },
      coinPrice: { type: 'integer', minimum: 1 },
      brand: { type: 'string', maxLength: 100 },
      stock: { type: 'integer', minimum: 0 },
      specifications: { type: 'object', additionalProperties: true },
      isActive: { type: 'boolean' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        prize: prizeResponseSchema,
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: insufficientPermissionSchema,
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
}

/**
 * DELETE /admin/prizes/:id - Soft delete a prize
 */
export const deletePrizeSchema = {
  tags: ['Admin - Prizes'],
  description: 'Soft delete a prize (set isActive to false)',
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    401: errorResponseSchema,
    403: insufficientPermissionSchema,
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
}

/**
 * POST /admin/prizes/:id/images - Upload images for a prize
 */
export const uploadImagesSchema = {
  tags: ['Admin - Prizes'],
  description: 'Upload 1-4 images for a prize (multipart/form-data). Max 4 images total per prize.',
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  // Note: multipart validation happens in the route handler
  response: {
    200: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string' },
        },
        message: { type: 'string' },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: insufficientPermissionSchema,
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
}

/**
 * DELETE /admin/prizes/:id/images/:imageIndex - Remove a specific image
 */
export const deleteImageSchema = {
  tags: ['Admin - Prizes'],
  description: 'Remove a specific image from a prize by its index (0-based)',
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      imageIndex: { type: 'string', pattern: '^[0-9]+$' },
    },
    required: ['id', 'imageIndex'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string' },
        },
        message: { type: 'string' },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: insufficientPermissionSchema,
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
}
