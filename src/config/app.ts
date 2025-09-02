import fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import jwt from '@fastify/jwt'
import jwksClient from 'jwks-rsa'

import { logger } from '@shared/infrastructure/logger/Logger'
import { errorHandler } from '@shared/presentation/middlewares/errorHandler'
import { auth0Middleware } from '@shared/presentation/middlewares/auth0Middleware'

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  })

  // Register CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: process.env.CORS_CREDENTIALS === 'true',
  })

  // Register Helmet for security
  await app.register(helmet, {
    contentSecurityPolicy: false,
  })

  // Register Rate Limiting
  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW ?? '60000'),
  })

  // Register JWT for Auth0 token verification
  await app.register(jwt, {
    secret: async function (request: any, token: any) {
      const client = jwksClient({
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 600000, // 10 minutes
      })

      // Handle different possible parameter structures
      let tokenString: string
      let kid: string | undefined

      // Check if token is a string (direct token) or if we need to extract from request
      if (typeof token === 'string') {
        tokenString = token
      } else if (request?.headers?.authorization) {
        tokenString = request.headers.authorization.replace('Bearer ', '')
      } else {
        throw new Error('Unable to extract JWT token')
      }

      // Extract kid from JWT header
      try {
        const parts = tokenString.split('.')
        if (parts.length >= 1) {
          const headerBase64 = parts[0]
          const headerDecoded = JSON.parse(Buffer.from(headerBase64, 'base64url').toString())
          kid = headerDecoded.kid
        }
      } catch {
        throw new Error('Failed to parse JWT header')
      }
      
      if (!kid) {
        throw new Error('Invalid token header - missing kid')
      }

      const key = await client.getSigningKey(kid)
      return key.getPublicKey()
    },
  })

  // Register Swagger
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Valorize API',
        description: 'B2B culture and engagement platform API',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@valorize.com',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  })

  // Register Swagger UI
  await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  })

  // Register global middlewares
  app.addHook('preHandler', auth0Middleware)
  app.setErrorHandler(errorHandler)

  // Health check endpoint
  app.get('/health', {
    schema: {
      tags: ['Health'],
      description: 'Health check endpoint',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
      },
    },
  }, async (_request, _reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }
  })

  // Register API routes (no prefix)
  
  // Users module routes
  await app.register(
    async function (fastify) {
      const { default: userRoutes } = await import('@modules/users/presentation/routes/userRoutes')
      await fastify.register(userRoutes)
    },
    { prefix: '/users' },
  )

  // Session/Auth module routes
  await app.register(
    async function (fastify) {
      const { default: sessionRoutes } = await import('@modules/auth/presentation/routes/sessionRoutes')
      await fastify.register(sessionRoutes)
    },
    { prefix: '/session' },
  )

  // 404 handler
  app.setNotFoundHandler({
    preHandler: app.rateLimit(),
  }, (request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: 'Route not found',
      statusCode: 404,
    })
  })

  logger.info('Application configured successfully')
  
  return app
} 