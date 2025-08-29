import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from './errorHandler'
import { logger } from '@shared/infrastructure/logger/Logger'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/health',
  '/docs',
  '/docs/static',
  '/docs/json',
  '/docs/yaml',
  '/login',                   // Direct login route
  '/users/login',             // Prefixed login route  
  '/users/auth/callback',
  '/session/refresh-info'
]

// Check if a route should be public
const isPublicRoute = (url: string): boolean => {
  return PUBLIC_ROUTES.some(route => url.startsWith(route))
}

export interface AuthenticatedUser {
  sub: string // Auth0 user ID
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
  [key: string]: any
}

// Extend FastifyRequest to include authenticated user
declare module 'fastify' {
  interface FastifyRequest {
    authenticatedUser?: AuthenticatedUser
  }
}

export const auth0Middleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { url, method } = request

  // Skip authentication for public routes
  if (isPublicRoute(url)) {
    return
  }

  // Skip authentication for OPTIONS requests (CORS preflight)
  if (method === 'OPTIONS') {
    return
  }

  try {
    // Get the authorization header
    const authorization = request.headers.authorization

    if (!authorization) {
      logger.warn('Missing authorization header', {
        url,
        method,
        headers: request.headers
      })
      throw new UnauthorizedError('Authorization header is required')
    }

    // Check if it's a Bearer token
    if (!authorization.startsWith('Bearer ')) {
      logger.warn('Invalid authorization format', {
        url,
        method,
        authorization: authorization.substring(0, 20) + '...'
      })
      throw new UnauthorizedError('Authorization header must be a Bearer token')
    }

    // Extract the token
    const token = authorization.substring(7)

    if (!token) {
      logger.warn('Empty token provided', { url, method })
      throw new UnauthorizedError('Token is required')
    }

    try {
      // Verify the JWT token using Fastify's JWT plugin
      // The plugin is configured with Auth0's JWKS URL in app.ts
      const decoded = await request.jwtVerify()
      
      // Extract user information from the decoded token
      const decodedPayload = decoded as any
      const user: AuthenticatedUser = {
        sub: decodedPayload.sub as string,
        email: decodedPayload.email as string,
        email_verified: decodedPayload.email_verified as boolean,
        name: decodedPayload.name as string,
        picture: decodedPayload.picture as string,
        ...decodedPayload
      }

      // Attach user to request
      request.authenticatedUser = user

      logger.debug('User authenticated successfully', {
        userId: user.sub,
        email: user.email,
        url,
        method
      })

    } catch (jwtError: any) {
      logger.warn('JWT verification failed', {
        url,
        method,
        error: jwtError.message
      })

      if (jwtError.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
        throw new UnauthorizedError('Token has expired')
      }

      if (jwtError.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        throw new UnauthorizedError('Invalid token')
      }

      throw new UnauthorizedError('Token verification failed')
    }

  } catch (error) {
    // Re-throw known errors
    if (error instanceof UnauthorizedError) {
      throw error
    }

    // Log unexpected errors
    logger.error('Unexpected error in auth middleware', {
      url,
      method,
      error: error instanceof Error ? error.message : String(error)
    })

    throw new UnauthorizedError('Authentication failed')
  }
}

// Helper function to get the current user from request
export const getCurrentUser = (request: FastifyRequest): AuthenticatedUser => {
  if (!request.authenticatedUser) {
    throw new UnauthorizedError('User not authenticated')
  }
  return request.authenticatedUser
}

// Helper function to check if user is authenticated
export const isAuthenticated = (request: FastifyRequest): boolean => {
  return !!request.authenticatedUser
} 