import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '@/lib/logger'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export class ValidationError extends Error implements ApiError {
  statusCode = 400
  code = 'VALIDATION_ERROR'
  
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404
  code = 'NOT_FOUND'
  
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error implements ApiError {
  statusCode = 401
  code = 'UNAUTHORIZED'
  
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error implements ApiError {
  statusCode = 403
  code = 'FORBIDDEN'
  
  constructor(message: string = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class InsufficientPermissionError extends Error implements ApiError {
  statusCode = 403
  code = 'INSUFFICIENT_PERMISSION'

  constructor(
    public requiredPermission: string,
    public userPermissions: string[] = [],
    message?: string,
  ) {
    super(message ?? `Access denied. Required permission: ${requiredPermission}`)
    this.name = 'InsufficientPermissionError'
  }
}

export class PlanRestrictionError extends Error implements ApiError {
  statusCode = 403
  code = 'PLAN_RESTRICTION'

  constructor(
    public requiredPlan: string,
    public currentPlan: string | null,
    public featureName: string,
    message?: string,
  ) {
    super(
      message ??
      `This feature requires ${requiredPlan} plan. Your current plan is ${currentPlan || 'undefined'}. Please upgrade to access this feature.`,
    )
    this.name = 'PlanRestrictionError'
  }
}

export class ConflictError extends Error implements ApiError {
  statusCode = 409
  code = 'CONFLICT'

  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export const errorHandler = async (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const requestId = request.id
  const method = request.method
  const url = request.url
  
  // Log the error with request context
  logger.error('Request error occurred', {
    requestId,
    method,
    url,
    errorName: error.name,
    errorMessage: error.message,
    errorCode: error.code,
    errorStack: error.stack,
  })

  // Handle Fastify validation errors
  if (error.validation) {
    // Extract friendly validation message
    const validationMessage = error.message || 'Request validation failed'

    return reply.code(400).send({
      success: false,
      error: 'Bad Request',
      message: validationMessage,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: error.validation,
      requestId,
    })
  }

  // Handle insufficient permission errors with detailed information
  if (error instanceof InsufficientPermissionError) {
    return reply.code(403).send({
      error: 'Insufficient Permission',
      message: error.message,
      statusCode: 403,
      code: 'INSUFFICIENT_PERMISSION',
      details: {
        requiredPermission: error.requiredPermission,
        userPermissions: error.userPermissions,
        missingPermissions: [error.requiredPermission].filter(
          perm => !error.userPermissions.includes(perm),
        ),
      },
      requestId,
    })
  }

  // Handle plan restriction errors with upgrade information
  if (error instanceof PlanRestrictionError) {
    return reply.code(403).send({
      error: 'Plan Restriction',
      message: error.message,
      statusCode: 403,
      code: 'PLAN_RESTRICTION',
      details: {
        featureName: error.featureName,
        requiredPlan: error.requiredPlan,
        currentPlan: error.currentPlan,
        upgradeRequired: true,
      },
      requestId,
    })
  }

  // Handle business logic errors
  if (error instanceof Error) {
    if (error.message === 'Domain already exists') {
      return reply.code(409).send({
        success: false,
        error: {
          message: 'Domain already exists',
          code: 'DOMAIN_EXISTS',
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      })
    }

    if (error.message === 'Invalid CNPJ') {
      return reply.code(400).send({
        success: false,
        error: {
          message: 'Invalid CNPJ',
          code: 'INVALID_CNPJ',
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      })
    }

    if (error.message === 'CNPJ already exists') {
      return reply.code(409).send({
        success: false,
        error: {
          message: 'CNPJ already exists',
          code: 'CNPJ_EXISTS',
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      })
    }

    if (error.message === 'Company not found') {
      return reply.code(404).send({
        success: false,
        error: {
          message: 'Company not found',
          code: 'COMPANY_NOT_FOUND',
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      })
    }
  }

  // Handle custom API errors
  if (error.statusCode && error.statusCode < 500) {
    return reply.code(error.statusCode).send({
      success: false,
      error: {
        message: error.message,
        code: (error as ApiError).code ?? 'CLIENT_ERROR',
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // Handle Auth0 JWT errors
  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Token expired',
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
      requestId,
    })
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid token',
      statusCode: 401,
      code: 'INVALID_TOKEN',
      requestId,
    })
  }

  // Handle database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    return reply.code(409).send({
      error: 'Conflict',
      message: 'Resource already exists',
      statusCode: 409,
      code: 'DUPLICATE_RESOURCE',
      requestId,
    })
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'Referenced resource does not exist',
      statusCode: 400,
      code: 'INVALID_REFERENCE',
      requestId,
    })
  }

  // Handle rate limit errors
  if (error.statusCode === 429) {
    return reply.code(429).send({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      requestId,
    })
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return reply.code(500).send({
    success: false,
    error: {
      message: isDevelopment 
        ? error.message 
        : 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && { stack: error.stack }),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  })
} 