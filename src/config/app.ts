import fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import jwt from '@fastify/jwt'

import { logger } from '@/lib/logger'
import { errorHandler } from '@/middleware/error-handler'
import { auth0Middleware } from '@/middleware/auth'

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  })

  // Register CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH',  'DELETE', 'OPTIONS'],
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

  // Register JWT for Supabase Auth token verification
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET

  if (!supabaseJwtSecret) {
    logger.error('SUPABASE_JWT_SECRET is not set in environment variables')
    throw new Error('SUPABASE_JWT_SECRET is required for JWT verification')
  }

  await app.register(jwt, {
    secret: supabaseJwtSecret,
    decode: { complete: true },
    // HS256 is the default algorithm for symmetric keys (secrets)
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

  // Custom content-type parser for webhook endpoints
  // This captures the raw body before JSON parsing for signature validation
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, async (request: any, body: Buffer) => {
    // Preserve the raw body as a Buffer for webhook signature validation
    request.rawBody = body

    // Now parse the JSON from the buffer
    try {
      return JSON.parse(body.toString('utf-8'))
    } catch (err) {
      throw new Error('Invalid JSON in request body')
    }
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
      const { default: userRoutes } = await import('@/features/app/users/user.routes')
      await fastify.register(userRoutes)
    },
    { prefix: '/users' },
  )

  // Addresses module routes
  await app.register(
    async function (fastify) {
      const { default: addressRoutes } = await import('@/features/app/addresses/address.routes')
      await fastify.register(addressRoutes)
    },
    { prefix: '/addresses' },
  )

  // Auth module routes
  await app.register(
    async function (fastify) {
      const { default: authRoutes } = await import('@/features/app/auth/auth.routes')
      await fastify.register(authRoutes)
    },
    { prefix: '/auth' },
  )

  // Admin routes - Centralized admin panel routes under /admin prefix
  // Includes: dashboard, rbac, and future admin features
  await app.register(
    async function (fastify) {
      const { default: adminRoutes } = await import('@/features/admin/admin.routes')
      await fastify.register(adminRoutes)
    },
    { prefix: '/admin' },
  )

  // Backoffice routes - Valorize internal team management (Super Admins only)
  // Includes: companies management, cross-company analytics, global prizes, etc.
  await app.register(
    async function (fastify) {
      const { backofficeRoutes } = await import('@/features/backoffice/backoffice.routes')
      await fastify.register(backofficeRoutes)
    },
    { prefix: '/backoffice' },
  )

  // Companies module routes
  await app.register(
    async function (fastify) {
      const { default: companyRoutes } = await import('@/features/app/companies/company.routes')
      await fastify.register(companyRoutes)
    },
    { prefix: '/companies' },
  )

  // Job Titles module routes
  await app.register(
    async function (fastify) {
      const { default: jobTitleRoutes } = await import('@/features/app/job-titles/job-title.routes')
      await fastify.register(jobTitleRoutes)
    },
    { prefix: '/job-titles' },
  )


  // Company Settings module routes
  await app.register(async function (fastify) {
    const { default: companySettingsRoutes } = await import(
      '@/features/app/company-settings/settings/settings.routes'
    )
    await fastify.register(companySettingsRoutes)
  })

  // Company Values module routes
  await app.register(async function (fastify) {
    const { default: companyValuesRoutes } = await import(
      '@/features/app/company-settings/values/values.routes'
    )
    await fastify.register(companyValuesRoutes)
  })

  // Compliments module routes
  await app.register(
    async function (fastify) {
      const { default: complimentRoutes } = await import(
        '@/features/app/compliments/compliment.routes'
      )
      await fastify.register(complimentRoutes)
    },
    { prefix: '/compliments' },
  )

  // Wallets module routes
  await app.register(
    async function (fastify) {
      const { default: walletRoutes } = await import(
        '@/features/app/wallets/wallet.routes'
      )
      await fastify.register(walletRoutes)
    },
    { prefix: '/wallets' },
  )

  // Prizes module routes
  await app.register(
    async function (fastify) {
      const { default: prizeRoutes } = await import(
        '@/features/app/prizes/prize.routes'
      )
      await fastify.register(prizeRoutes)
    },
    { prefix: '/prizes' },
  )

  // Redemptions module routes
  await app.register(
    async function (fastify) {
      const { default: redemptionRoutes } = await import(
        '@/features/app/prizes/redemptions/redemption.routes'
      )
      await fastify.register(redemptionRoutes)
    },
    { prefix: '/redemptions' },
  )

  // Webhook routes (external integrations - public endpoints)
  await app.register(
    async function (fastify) {
      const { default: tremendousWebhookRoutes } = await import(
        '@/features/app/prizes/redemptions/tremendous-webhook.routes'
      )
      await fastify.register(tremendousWebhookRoutes)
    },
  )

  // Dashboard routes are now under /admin/dashboard (see admin.routes.ts)

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