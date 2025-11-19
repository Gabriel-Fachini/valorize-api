import { FastifyInstance } from 'fastify'
import { backofficeAuthRoutes } from './auth/backoffice-auth.routes'
import { backofficeCompaniesRoutes } from './companies/companies.routes'
import { backofficeAuditLogsRoutes } from './audit-logs/audit-logs.routes'
import financialRoutes from './financial/financial.routes'
import { backofficeVouchersRoutes } from './vouchers/vouchers.routes'

/**
 * Backoffice Routes Aggregator
 *
 * All routes under /backoffice/* are restricted to Super Admins from Valorize HQ
 * These routes have cross-company access (multi-tenant isolation bypassed)
 */
export async function backofficeRoutes(fastify: FastifyInstance) {
  // Authentication routes (public)
  await fastify.register(backofficeAuthRoutes, { prefix: '/auth' })

  // Client management routes (Super Admin only)
  await fastify.register(backofficeCompaniesRoutes, { prefix: '/companies' })

  // Audit logs routes (Super Admin only)
  await fastify.register(backofficeAuditLogsRoutes, { prefix: '/audit-logs' })

  // Financial management routes (Super Admin only)
  await fastify.register(financialRoutes, { prefix: '/financial' })

  // Global voucher catalog management (Super Admin only)
  await fastify.register(backofficeVouchersRoutes, { prefix: '/vouchers' })

  // Future backoffice modules will be registered here:
  // await fastify.register(crossCompanyAnalyticsRoutes, { prefix: '/analytics' })
}
