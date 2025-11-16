import { FastifyInstance } from 'fastify'
import { backofficeAuthRoutes } from './auth/backoffice-auth.routes'

/**
 * Backoffice Routes Aggregator
 *
 * All routes under /backoffice/* are restricted to Super Admins from Valorize HQ
 * These routes have cross-company access (multi-tenant isolation bypassed)
 */
export async function backofficeRoutes(fastify: FastifyInstance) {
  // Authentication routes (public)
  await fastify.register(backofficeAuthRoutes, { prefix: '/auth' })

  // Future backoffice modules will be registered here:
  // await fastify.register(companiesManagementRoutes, { prefix: '/companies' })
  // await fastify.register(globalPrizesRoutes, { prefix: '/prizes' })
  // await fastify.register(crossCompanyAnalyticsRoutes, { prefix: '/analytics' })
  // await fastify.register(systemAuditRoutes, { prefix: '/audit' })
}
