/**
 * @fileoverview Admin routes aggregator
 *
 * This file serves as the central point for all administrative routes.
 * All routes registered here will be prefixed with /admin
 *
 * Structure:
 * - /admin/dashboard/*  - Dashboard and analytics routes
 * - /admin/rbac/*       - Role and permission management routes
 * - /admin/*            - Other future admin routes
 *
 * @module features/admin/admin.routes
 */

import { FastifyInstance } from 'fastify'

/**
 * Register all admin routes under /admin prefix
 *
 * All routes here require admin-level permissions (defined in each sub-route)
 */
export default async function adminRoutes(fastify: FastifyInstance) {
  // Dashboard routes - /admin/dashboard/*
  await fastify.register(
    async function (fastify) {
      const { default: dashboardRoutes } = await import(
        '@/features/dashboard/dashboard.routes'
      )
      await fastify.register(dashboardRoutes)
    },
    { prefix: '/dashboard' },
  )

  // RBAC routes - /admin/rbac/*
  await fastify.register(
    async function (fastify) {
      const { default: rbacRoutes } = await import('@/features/rbac/rbac.routes')
      await fastify.register(rbacRoutes)
    },
    { prefix: '/rbac' },
  )

  // Company Settings routes - /admin/company/*
  await fastify.register(
    async function (fastify) {
      const { default: companySettingsRoutes } = await import(
        '@/features/admin/company-settings/company-settings.routes'
      )
      await fastify.register(companySettingsRoutes)
    },
    { prefix: '/company' },
  )

  // Future admin routes can be added here
  // Example:
  // await fastify.register(
  //   async function (fastify) {
  //     const { default: analyticsRoutes } = await import('@/features/analytics/analytics.routes')
  //     await fastify.register(analyticsRoutes)
  //   },
  //   { prefix: '/analytics' },
  // )
}
