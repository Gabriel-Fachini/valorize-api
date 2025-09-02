import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '@shared/infrastructure/logger/Logger'

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
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    },
  })

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: error.validation,
      statusCode: 400,
      requestId,
    })
  }

  // Handle custom API errors
  if (error.statusCode && error.statusCode < 500) {
    return reply.code(error.statusCode).send({
      error: error.name || 'Client Error',
      message: error.message,
      statusCode: error.statusCode,
      code: (error as ApiError).code,
      requestId,
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
    error: 'Internal Server Error',
    message: isDevelopment 
      ? error.message 
      : 'An unexpected error occurred. Please try again later.',
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    requestId,
    ...(isDevelopment && { stack: error.stack }),
  })
} 