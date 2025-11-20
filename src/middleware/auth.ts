import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from './error-handler'
import { logger } from '@/lib/logger'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/health',
  '/docs',
  '/docs/static',
  '/docs/json',
  '/docs/yaml',
  '/auth/login',           // Session login route (password grant)
  '/auth/refresh',         // Token refresh route
  '/auth/refresh-info',
  '/auth/admin/login',
  '/auth/signup',
  '/backoffice/auth/login', // Backoffice login for Super Admins from Valorize HQ
  '/webhooks',             // Webhook endpoints from external providers (Tremendous, etc)
]

// Check if a route should be public
const isPublicRoute = (url: string): boolean => {
  return PUBLIC_ROUTES.some(route => url.startsWith(route))
}

export interface AuthenticatedUser {
  sub: string // Supabase user ID
  email?: string
  email_verified?: boolean
  email_confirmed_at?: string
  name?: string
  avatar?: string
  role?: string
  [key: string]: unknown
}

// Extend FastifyRequest to include authenticated user
declare module 'fastify' {
  interface FastifyRequest {
    authenticatedUser?: AuthenticatedUser
  }
}

export const auth0Middleware = async (
  request: FastifyRequest,
  _reply: FastifyReply,
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
        headers: request.headers,
      })
      throw new UnauthorizedError('Authorization header is required')
    }

    // Check if it's a Bearer token
    if (!authorization.startsWith('Bearer ')) {
      logger.warn('Invalid authorization format', {
        url,
        method,
        authorization: authorization.substring(0, 20) + '...',
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
      // The plugin is configured with Supabase JWT secret in app.ts
      const decoded = await request.jwtVerify()

      // Extract user information from the decoded token
      const decodedPayload = decoded as Record<string, unknown>

      // Validate Supabase issuer (optional but recommended)
      const supabaseUrl = process.env.SUPABASE_URL
      if (supabaseUrl) {
        const expectedIssuer = `${supabaseUrl}/auth/v1`
        if (decodedPayload.iss && decodedPayload.iss !== expectedIssuer) {
          logger.warn('Invalid JWT issuer', {
            expected: expectedIssuer,
            received: decodedPayload.iss,
          })
          throw new UnauthorizedError('Invalid token issuer')
        }
      }

      // Extract user information from Supabase token structure
      const userMetadata = decodedPayload.user_metadata as Record<string, unknown> | undefined
      const user: AuthenticatedUser = {
        sub: decodedPayload.sub as string,
        email: decodedPayload.email as string,
        email_verified: decodedPayload.email_verified as boolean,
        email_confirmed_at: decodedPayload.email_confirmed_at as string,
        name: userMetadata?.name as string | undefined,
        avatar: userMetadata?.avatar as string | undefined,
        role: decodedPayload.role as string,
        ...decodedPayload,
      }

      // Attach user to request
      request.authenticatedUser = user

      logger.debug('User authenticated successfully', {
        userId: user.sub,
        email: user.email,
        url,
        method,
      })

    } catch (jwtError: unknown) {
      logger.warn('JWT verification failed', {
        url,
        method,
        error: jwtError instanceof Error ? jwtError.message : String(jwtError),
      })
      if (jwtError instanceof Error) {
        logger.warn('JWT Error message:', jwtError.message)
      }
      const errorCode = (jwtError as { code?: string }).code
      logger.warn('JWT Error code:', errorCode)
      
      logger.warn('JWT verification failed', {
        url,
        method,
        error: jwtError instanceof Error ? jwtError.message : String(jwtError),
      })

      if (errorCode === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
        logger.warn('Token expired')
        throw new UnauthorizedError('Token has expired')
      }

      if (errorCode === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        logger.warn('Token invalid')
        throw new UnauthorizedError('Invalid token')
      }

      logger.warn('Generic token verification failed')
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
      error: error instanceof Error ? error.message : String(error),
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

// Helper function to get auth user id (Supabase user ID)
export const getAuthUserId = (request: FastifyRequest): string => {
  if (!request.authenticatedUser) {
    throw new UnauthorizedError('User not authenticated')
  }
  return request.authenticatedUser.sub
}