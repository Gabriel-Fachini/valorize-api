import { FastifyInstance } from 'fastify'

/**
 * @deprecated This module has been moved to /admin/company/settings
 *
 * Old endpoints:
 * - GET /companies/:companyId/settings -> GET /admin/company/settings
 * - PUT /companies/:companyId/settings -> PUT /admin/company/settings
 *
 * The new endpoints automatically get the company ID from the authenticated user
 * and include additional functionality for managing domains and coin economy.
 */
export default async function companySettingsRoutes(fastify: FastifyInstance) {
  // All routes have been moved to /admin/company/settings
  // This file is kept for reference but no longer registers any routes
}
