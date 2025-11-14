/**
 * @fileoverview Admin routes aggregator
 *
 * This file serves as the central point for all administrative routes.
 * All routes registered here will be prefixed with /admin
 *
 * Structure:
 * - /admin/dashboard/*         - Dashboard and analytics routes
 * - /admin/compliments-dashboard/* - Comprehensive compliments analytics (core feature)
 * - /admin/roles/*             - Role and permission management (CRUD)
 * - /admin/users/*             - User management and CSV import
 * - /admin/company/info        - Company basic information
 * - /admin/company/domains     - Allowed domains for SSO
 * - /admin/company/coin-economy - Coin economy settings
 * - /admin/company/values      - Company values management
 * - /admin/voucher-products/*  - Voucher product catalog management
 * - /admin/prizes/*            - Prizes management (CRUD with image upload)
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
        '@/features/app/dashboard/dashboard.routes'
      )
      await fastify.register(dashboardRoutes)
    },
    { prefix: '/dashboard' },
  )

  // Compliments Dashboard routes - /admin/compliments-dashboard/*
  // Comprehensive analytics for the core compliments feature
  await fastify.register(
    async function (fastify) {
      const { default: complimentsDashboardRoutes } = await import(
        '@/features/admin/compliments-dashboard/compliments-dashboard.routes'
      )
      await fastify.register(complimentsDashboardRoutes)
    },
    { prefix: '/compliments-dashboard' },
  )

  // Roles Management routes - /admin/roles/* (full CRUD for roles and permissions + admin's own permissions)
  await fastify.register(
    async function (fastify) {
      const { default: rolesManagementRoutes } = await import(
        '@/features/admin/roles-management/roles-management.routes'
      )
      await fastify.register(rolesManagementRoutes)
    },
    { prefix: '/roles' },
  )

  // Users management routes - /admin/users/*
  await fastify.register(
    async function (fastify) {
      const { default: usersRoutes } = await import(
        '@/features/admin/users/users.routes'
      )
      await fastify.register(usersRoutes)
    },
    { prefix: '/users' },
  )

  // Company Info routes - /admin/company/info
  await fastify.register(
    async function (fastify) {
      const { default: companyInfoRoutes } = await import(
        '@/features/admin/company-info/company-info.routes'
      )
      await fastify.register(companyInfoRoutes)
    },
    { prefix: '/company/info' },
  )

  // Company Domains routes - /admin/company/domains
  await fastify.register(
    async function (fastify) {
      const { default: companyDomainsRoutes } = await import(
        '@/features/admin/company-domains/company-domains.routes'
      )
      await fastify.register(companyDomainsRoutes)
    },
    { prefix: '/company/domains' },
  )

  // Company Coin Economy routes - /admin/company/coin-economy
  await fastify.register(
    async function (fastify) {
      const { default: companyCoinEconomyRoutes } = await import(
        '@/features/admin/company-coin-economy/company-coin-economy.routes'
      )
      await fastify.register(companyCoinEconomyRoutes)
    },
    { prefix: '/company/coin-economy' },
  )

  // Company Values routes - /admin/company/values
  await fastify.register(
    async function (fastify) {
      const { default: companyValuesRoutes } = await import(
        '@/features/admin/company-values/company-values.routes'
      )
      await fastify.register(companyValuesRoutes)
    },
    { prefix: '/company/values' },
  )

  // Voucher Products routes - /admin/voucher-products
  await fastify.register(
    async function (fastify) {
      const { default: voucherProductRoutes } = await import(
        '@/features/app/prizes/vouchers/voucher-product.routes'
      )
      await fastify.register(voucherProductRoutes)
    },
    { prefix: '/voucher-products' },
  )

  // Prizes Management routes - /admin/prizes/*
  await fastify.register(
    async function (fastify) {
      const { default: prizesRoutes } = await import('@/features/admin/prizes/prizes.routes')
      await fastify.register(prizesRoutes)
    },
    { prefix: '/prizes' },
  )

  // Admin Redemptions routes - /admin/redemptions/*
  // Send single vouchers or bulk redeem to users via email
  await fastify.register(
    async function (fastify) {
      const { default: adminRedemptionRoutes } = await import(
        '@/features/admin/redemptions/redemptions.routes'
      )
      await fastify.register(adminRedemptionRoutes)
    },
    { prefix: '/redemptions' },
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
