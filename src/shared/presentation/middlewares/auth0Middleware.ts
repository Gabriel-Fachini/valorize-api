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
  '/session/login',           // Session login route (password grant)
  '/session/refresh',         // Token refresh route
  '/session/refresh-info',
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

    // DEBUG: Quick token validation (can be removed later)
    try {
      const parts = token.split('.')
      if (parts.length >= 1) {
        const headerDecoded = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
      }
    } catch (debugError) {
      logger.warn('Token validation error:', debugError)
    }

    try {
      console.log('Attempting JWT verification...')
      // Verify the JWT token using Fastify's JWT plugin
      // The plugin is configured with Auth0's JWKS URL in app.ts
      const decoded = await request.jwtVerify()
      console.log('JWT verification successful:', decoded)
      
      // Extract user information from the decoded token
      const decodedPayload = decoded as Record<string, unknown>
      
      // Validate Auth0 issuer
      const expectedIssuer = `https://${process.env.AUTH0_DOMAIN}/`
      if (decodedPayload.iss !== expectedIssuer) {
        console.log('ERROR: Invalid issuer. Expected:', expectedIssuer, 'Got:', decodedPayload.iss)
        logger.warn('Invalid JWT issuer', {
          expected: expectedIssuer,
          received: decodedPayload.iss,
        })
        throw new UnauthorizedError('Invalid token issuer')
      }
      
      // Validate Auth0 audience (if configured)
      if (process.env.AUTH0_AUDIENCE) {
        const audience = decodedPayload.aud as string | string[]
        const expectedAudience = process.env.AUTH0_AUDIENCE
        
        // Check if audience matches (handle both string and array formats)
        const audienceValid = Array.isArray(audience) 
          ? audience.includes(expectedAudience)
          : audience === expectedAudience
          
        if (!audienceValid) {
          console.log('ERROR: Invalid audience. Expected:', expectedAudience, 'Got:', audience)
          logger.warn('Invalid JWT audience', {
            expected: expectedAudience,
            received: audience,
          })
          throw new UnauthorizedError('Invalid token audience')
        }
      }
      
      const user: AuthenticatedUser = {
        sub: decodedPayload.sub as string,
        email: decodedPayload.email as string,
        email_verified: decodedPayload.email_verified as boolean,
        name: decodedPayload.name as string,
        picture: decodedPayload.picture as string,
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
      console.log('=== DEBUG: JWT verification failed ===')
      console.log('JWT Error:', jwtError)
      console.log('JWT Error type:', typeof jwtError)
      console.log('JWT Error instanceof Error:', jwtError instanceof Error)
      if (jwtError instanceof Error) {
        console.log('JWT Error message:', jwtError.message)
        console.log('JWT Error stack:', jwtError.stack)
      }
      const errorCode = (jwtError as { code?: string }).code
      console.log('JWT Error code:', errorCode)
      
      logger.warn('JWT verification failed', {
        url,
        method,
        error: jwtError instanceof Error ? jwtError.message : String(jwtError),
      })

      if (errorCode === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
        console.log('Token expired')
        throw new UnauthorizedError('Token has expired')
      }

      if (errorCode === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        console.log('Token invalid')
        throw new UnauthorizedError('Invalid token')
      }

      console.log('Generic token verification failed')
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