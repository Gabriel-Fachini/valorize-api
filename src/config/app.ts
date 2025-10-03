import fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import jwt, { FastifyJWTOptions } from '@fastify/jwt'
import jwksClient from 'jwks-rsa'
// import {
//   serializerCompiler,
//   validatorCompiler,
//   ZodTypeProvider,
// } from 'fastify-type-provider-zod'

import { logger } from '@/lib/logger'
import { errorHandler } from '@/middleware/error-handler'
import { auth0Middleware } from '@/middleware/auth'

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  })

  // TODO: Re-enable ZodTypeProvider after converting all schemas to Zod
  // .withTypeProvider<ZodTypeProvider>()
  // app.setValidatorCompiler(validatorCompiler)
  // app.setSerializerCompiler(serializerCompiler)

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
    secret: (_request, token, done) => {
      if (!token || typeof token !== 'object') {
        return done(new Error('Invalid token header - missing kid'), undefined)
      }
      
      if (!token.header || typeof token.header !== 'object') {
        return done(new Error('Invalid token header - missing kid'), undefined)
      }
      
      if (!token.header.kid || typeof token.header.kid !== 'string') {
        return done(new Error('Invalid token header - missing kid'), undefined)
      }

      const client = jwksClient({
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 600000, // 10 minutes
      })

      client.getSigningKey(token.header.kid, (err, key) => {
        if (err) {
          return done(err, undefined)
        }
        if (key) {
          const signingKey = key.getPublicKey()
          done(null, signingKey)
        } else {
          done(new Error('signing key not found'), undefined)
        }
      })
    },
    decode: { complete: true },
    algorithms: ['RS256'],
  } as FastifyJWTOptions)

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
          url: `http://localhost:${process.env.PORT}`,
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
      const { default: userRoutes } = await import('@/features/users/user.routes')
      await fastify.register(userRoutes)
    },
    { prefix: '/users' },
  )

  // Auth module routes
  await app.register(
    async function (fastify) {
      const { default: authRoutes } = await import('@/features/auth/auth.routes')
      await fastify.register(authRoutes)
    },
    { prefix: '/auth' },
  )

  // RBAC module routes
  await app.register(
    async function (fastify) {
      const { default: rbacRoutes } = await import('@/features/rbac/rbac.routes')
      await fastify.register(rbacRoutes)
    },
    { prefix: '/admin' },
  )

  // Companies module routes
  await app.register(
    async function (fastify) {
      const { default: companyRoutes } = await import('@/features/companies/company.routes')
      await fastify.register(companyRoutes)
    },
    { prefix: '/companies' },
  )

  // Company Settings module routes
  await app.register(async function (fastify) {
    const { default: companySettingsRoutes } = await import(
      '@/features/company-settings/settings/settings.routes'
    )
    await fastify.register(companySettingsRoutes)
  })

  // Company Values module routes
  await app.register(async function (fastify) {
    const { default: companyValuesRoutes } = await import(
      '@/features/company-settings/values/values.routes'
    )
    await fastify.register(companyValuesRoutes)
  })

  // Compliments module routes
  await app.register(
    async function (fastify) {
      const { default: complimentRoutes } = await import(
        '@/features/compliments/compliment.routes'
      )
      await fastify.register(complimentRoutes)
    },
    { prefix: '/compliments' },
  )

  // Wallets module routes
  await app.register(
    async function (fastify) {
      const { default: walletRoutes } = await import(
        '@/features/wallets/wallet.routes'
      )
      await fastify.register(walletRoutes)
    },
    { prefix: '/wallets' },
  )

  // Prizes module routes
  await app.register(
    async function (fastify) {
      const { default: prizeRoutes } = await import(
        '@/features/prizes/prize.routes'
      )
      await fastify.register(prizeRoutes)
    },
    { prefix: '/prizes' },
  )

  // Redemptions module routes
  await app.register(
    async function (fastify) {
      const { default: redemptionRoutes } = await import(
        '@/features/prizes/redemptions/redemption.routes'
      )
      await fastify.register(redemptionRoutes)
    },
    { prefix: '/redemptions' },
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