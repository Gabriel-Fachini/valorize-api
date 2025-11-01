/**
 * Fastify JSON Schemas for Admin Users CRUD endpoints
 */

// ============================================================================
// LIST USERS
// ============================================================================

export const listUsersSchema = {
  tags: ['Admin - Users'],
  description: 'List all users with pagination, filtering and search',
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      search: { type: 'string', maxLength: 255 },
      status: { type: 'string', enum: ['active', 'inactive'] },
      departmentId: { type: 'string' },
      sortBy: {
        type: 'string',
        enum: ['name', 'email', 'createdAt', 'lastLogin'],
        default: 'createdAt',
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Users list with pagination',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              department: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              position: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              avatar: { type: ['string', 'null'] },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              lastLogin: { type: ['string', 'null'], format: 'date-time' },
            },
          },
        },
        totalCount: { type: 'integer' },
        pageCount: { type: 'integer' },
        currentPage: { type: 'integer' },
      },
    },
  },
}

// ============================================================================
// GET USER DETAIL
// ============================================================================

export const getUserDetailSchema = {
  tags: ['Admin - Users'],
  description: 'Get detailed user information with statistics',
  params: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
    },
    required: ['userId'],
  },
  response: {
    200: {
      description: 'User details with statistics',
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        department: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        position: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        avatar: { type: ['string', 'null'] },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        lastLogin: { type: ['string', 'null'], format: 'date-time' },
        statistics: {
          type: 'object',
          properties: {
            complimentsSent: { type: 'integer' },
            complimentsReceived: { type: 'integer' },
            totalCoins: { type: 'number' },
            redeemptions: { type: 'integer' },
          },
        },
      },
    },
  },
}

// ============================================================================
// CREATE USER
// ============================================================================

export const createUserSchema = {
  tags: ['Admin - Users'],
  description: 'Create a new user',
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 255 },
      email: { type: 'string', format: 'email', maxLength: 255 },
      departmentId: { type: ['string', 'null'] },
      jobTitleId: { type: ['string', 'null'] },
    },
    required: ['name', 'email'],
    additionalProperties: false,
  },
  response: {
    201: {
      description: 'User created',
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  },
}

// ============================================================================
// UPDATE USER
// ============================================================================

export const updateUserSchema = {
  tags: ['Admin - Users'],
  description: 'Update user information',
  params: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
    },
    required: ['userId'],
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 255 },
      email: { type: 'string', format: 'email', maxLength: 255 },
      departmentId: { type: ['string', 'null'] },
      jobTitleId: { type: ['string', 'null'] },
      isActive: { type: 'boolean' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'User updated',
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        isActive: { type: 'boolean' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
}

// ============================================================================
// DELETE USER
// ============================================================================

export const deleteUserSchema = {
  tags: ['Admin - Users'],
  description: 'Deactivate a user (soft delete)',
  params: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
    },
    required: ['userId'],
  },
  response: {
    204: { description: 'User deactivated' },
  },
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

export const bulkActionsSchema = {
  tags: ['Admin - Users'],
  description: 'Perform bulk actions on multiple users',
  body: {
    type: 'object',
    properties: {
      userIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 100,
      },
      action: {
        type: 'string',
        enum: ['activate', 'deactivate', 'export'],
      },
    },
    required: ['userIds', 'action'],
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Bulk action completed',
      oneOf: [
        {
          type: 'object',
          properties: {
            updated: { type: 'integer' },
          },
        },
      ],
    },
  },
}

// ============================================================================
// CSV TEMPLATE
// ============================================================================

export const csvTemplateSchema = {
  tags: ['Admin - Users - CSV Import'],
  description: 'Download CSV template for bulk user import',
  response: {
    200: {
      description: 'CSV template file',
      type: 'string',
      format: 'binary',
    },
  },
}

// ============================================================================
// CSV PREVIEW
// ============================================================================

export const csvPreviewSchema = {
  tags: ['Admin - Users - CSV Import'],
  description: 'Preview CSV file and validate data before import',
  consumes: ['multipart/form-data'],
  response: {
    200: {
      description: 'CSV preview with validation results',
      type: 'object',
      properties: {
        previewId: { type: 'string' },
        totalRows: { type: 'integer' },
        validRows: { type: 'integer' },
        rowsWithErrors: { type: 'integer' },
        preview: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rowNumber: { type: 'integer' },
              name: { type: 'string' },
              email: { type: 'string' },
              department: { type: ['string', 'null'] },
              position: { type: ['string', 'null'] },
              status: { type: 'string', enum: ['valid', 'error', 'duplicate', 'exists'] },
              errors: { type: 'array', items: { type: 'string' } },
              action: { type: 'string', enum: ['create', 'update', 'skip'] },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            toCreate: { type: 'integer' },
            toUpdate: { type: 'integer' },
            errors: { type: 'integer' },
          },
        },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  },
}

// ============================================================================
// CSV IMPORT
// ============================================================================

export const csvImportSchema = {
  tags: ['Admin - Users - CSV Import'],
  description: 'Confirm and process CSV import',
  body: {
    type: 'object',
    properties: {
      previewId: { type: 'string' },
      confirmedRows: {
        type: 'array',
        items: { type: 'integer' },
      },
    },
    required: ['previewId'],
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Import processing',
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: { type: 'string', enum: ['completed', 'processing'] },
        report: {
          type: 'object',
          properties: {
            created: { type: 'integer' },
            updated: { type: 'integer' },
            skipped: { type: 'integer' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rowNumber: { type: 'integer' },
                  email: { type: 'string' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
}
