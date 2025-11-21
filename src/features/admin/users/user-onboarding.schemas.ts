/**
 * Fastify JSON Schemas for User Onboarding endpoints
 */

// ============================================================================
// SEND WELCOME EMAIL (Individual)
// ============================================================================

export const sendWelcomeEmailSchema = {
  tags: ['Admin - Users', 'Onboarding'],
  description: 'Send welcome email to a specific user (max 3 times)',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'User ID' },
    },
  },
  response: {
    200: {
      description: 'Email sent successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        onboarding: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            emailSendCount: { type: 'integer' },
            lastEmailSentAt: { type: 'string', format: 'date-time' },
            isConfirmed: { type: 'boolean' },
          },
        },
      },
    },
    400: {
      description: 'Email send limit reached or other error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
      },
    },
  },
}

// ============================================================================
// SEND WELCOME EMAILS (Bulk)
// ============================================================================

export const sendWelcomeEmailsBulkSchema = {
  tags: ['Admin - Users', 'Onboarding'],
  description: 'Send welcome emails to multiple users at once',
  body: {
    type: 'object',
    required: ['userIds'],
    properties: {
      userIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 100,
        description: 'Array of user IDs to send emails to',
      },
    },
  },
  response: {
    200: {
      description: 'Bulk email send result',
      type: 'object',
      properties: {
        message: { type: 'string' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              success: { type: 'boolean' },
              error: { type: 'string', nullable: true },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            sent: { type: 'integer' },
            failed: { type: 'integer' },
          },
        },
      },
    },
  },
}

// ============================================================================
// GET ONBOARDING STATUS (Individual)
// ============================================================================

export const getOnboardingStatusSchema = {
  tags: ['Admin - Users', 'Onboarding'],
  description: 'Get onboarding status for a specific user',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'User ID' },
    },
  },
  response: {
    200: {
      description: 'Onboarding status',
      type: 'object',
      properties: {
        userId: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        emailSentAt: { type: 'string', format: 'date-time', nullable: true },
        emailClickedAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        passwordDefinedAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        firstLoginAt: { type: 'string', format: 'date-time', nullable: true },
        emailSendCount: { type: 'integer' },
        lastEmailSentAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        isConfirmed: { type: 'boolean' },
        completionPercentage: { type: 'integer' },
        canSendEmail: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    404: {
      description: 'Onboarding record not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
}

// ============================================================================
// LIST USERS WITH ONBOARDING STATUS
// ============================================================================

export const listUsersOnboardingStatusSchema = {
  tags: ['Admin - Users', 'Onboarding'],
  description: 'List all users with their onboarding status',
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      status: {
        type: 'string',
        enum: ['pending', 'in-progress', 'completed'],
        description:
          'Filter by status: pending (no email sent), in-progress (email sent but not complete), completed',
      },
      search: {
        type: 'string',
        maxLength: 255,
        description: 'Search by user name or email',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Users with onboarding status',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
              emailSentAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              emailClickedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              passwordDefinedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              firstLoginAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              emailSendCount: { type: 'integer' },
              isConfirmed: { type: 'boolean' },
              completionPercentage: { type: 'integer' },
              canSendEmail: { type: 'boolean' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
  },
}

// ============================================================================
// TRACK EMAIL CLICK (Public endpoint)
// ============================================================================

export const trackEmailClickSchema = {
  tags: ['Auth', 'Onboarding'],
  description: 'Track when user clicks email confirmation link',
  body: {
    type: 'object',
    required: ['token'],
    properties: {
      token: {
        type: 'string',
        description: 'Supabase confirmation token',
      },
    },
  },
  response: {
    200: {
      description: 'Click tracked successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
    400: {
      description: 'Invalid token',
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
}

// ============================================================================
// TRACK PASSWORD DEFINED (Authenticated endpoint)
// ============================================================================

export const trackPasswordDefinedSchema = {
  tags: ['Auth', 'Onboarding'],
  description: 'Track when user defines their password',
  response: {
    200: {
      description: 'Password definition tracked successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
  },
}
