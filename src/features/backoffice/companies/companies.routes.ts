import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { backofficeCompanyService } from './companies.service'
import { requireSuperAdmin } from '@/middleware/backoffice'
import { getAuthUserId } from '@/middleware/auth'
import { logger } from '@/lib/logger'
import {
  listCompaniesSchema,
  getCompanySchema,
  createCompanySchema,
  updateCompanySchema,
  simpleActionSchema,
  getWalletStatusSchema,
  addWalletCreditsSchema,
  removeWalletCreditsSchema,
  getPlanSchema,
  updatePlanSchema,
  getBillingInfoSchema,
  getMetricsSchema,
  addContactSchema,
  updateContactSchema,
  deleteContactSchema,
  addAllowedDomainSchema,
  deleteAllowedDomainSchema,
} from './companies.schemas'
import { User } from '@/features/app/users/user.model'

/**
 * Backoffice Companies Routes
 *
 * Client management for Super Admins from Valorize HQ
 * All routes require Super Admin authentication
 */
export const backofficeCompaniesRoutes = async (
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) => {
  /**
   * GET /backoffice/companies
   *
   * List all companies with filters, pagination and sorting
   * Returns aggregations (total MRR, company counts by status)
   */
  fastify.get(
    '/',
    {
      preHandler: [requireSuperAdmin()],
      schema: listCompaniesSchema,
    },
    async (request, reply) => {
      try {
        const query = request.query as any

        const filters = {
          search: query.search,
          status: query.status,
          planType: query.planType,
          country: query.country,
          createdAfter: query.createdAfter,
          createdBefore: query.createdBefore,
        }

        const pagination = {
          page: query.page,
          limit: query.limit,
        }

        const sorting = {
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        }

        const result = await backofficeCompanyService.listCompanies(
          filters,
          pagination,
          sorting
        )

        return reply.code(200).send({
          success: true,
          data: result.data,
          pagination: result.pagination,
          aggregations: result.aggregations,
        })
      } catch (error) {
        logger.error('Failed to list companies', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to list companies',
        })
      }
    }
  )

  /**
   * GET /backoffice/companies/:id
   *
   * Get full company details with wallet, metrics, billing, etc.
   */
  fastify.get(
    '/:id',
    {
      preHandler: [requireSuperAdmin()],
      schema: getCompanySchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const company = await backofficeCompanyService.getCompanyDetails(id)

        if (!company) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: 'Company not found',
          })
        }

        return reply.code(200).send({
          success: true,
          data: company,
        })
      } catch (error) {
        logger.error('Failed to get company details', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to get company details',
        })
      }
    }
  )

  /**
   * POST /backoffice/companies
   *
   * Create new company (full wizard)
   * Requires: name, domain, country, timezone, plan, minimum 2 initial values
   */
  fastify.post(
    '/',
    {
      preHandler: [requireSuperAdmin()],
      schema: createCompanySchema,
    },
    async (request, reply) => {
      try {
        const body = request.body as any
        const authUserId = getAuthUserId(request)

        // Get current user for audit trail
        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        const result = await backofficeCompanyService.createCompany(
          body,
          user.id
        )

        logger.info('Company created successfully', {
          companyId: result.company.id,
          firstAdminEmail: result.firstAdmin.email,
          createdBy: user.id,
        })

        return reply.code(201).send({
          success: true,
          data: {
            company: result.company.toJSON(),
            firstAdmin: result.firstAdmin,
            passwordResetUrl: result.passwordResetUrl,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)

        logger.error('Failed to create company', {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        })

        // Handle specific validation errors
        if (
          errorMessage.includes('already in use') ||
          errorMessage.includes('already exists')
        ) {
          return reply.code(409).send({
            success: false,
            error: 'Conflict',
            message: errorMessage,
          })
        }

        if (
          errorMessage.includes('required') ||
          errorMessage.includes('minimum 2') ||
          errorMessage.includes('must belong')
        ) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: errorMessage, // Return the actual error message instead of generic one
        })
      }
    }
  )

  /**
   * PATCH /backoffice/companies/:id
   *
   * Update company basic information
   */
  fastify.patch(
    '/:id',
    {
      preHandler: [requireSuperAdmin()],
      schema: updateCompanySchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.updateCompany(id, body, user.id)

        logger.info('Company updated successfully', {
          companyId: id,
          updatedBy: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: 'Company updated successfully',
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update company'

        logger.error('Failed to update company', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (
          errorMessage.includes('already in use') ||
          errorMessage.includes('already exists')
        ) {
          return reply.code(409).send({
            success: false,
            error: 'Conflict',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to update company',
        })
      }
    }
  )

  /**
   * POST /backoffice/companies/:id/activate
   *
   * Activate company (restore access)
   */
  fastify.post(
    '/:id/activate',
    {
      preHandler: [requireSuperAdmin()],
      schema: simpleActionSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.activateCompany(id, user.id)

        logger.info('Company activated', { companyId: id, activatedBy: user.id })

        return reply.code(200).send({
          success: true,
          message: 'Company activated successfully',
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to activate company'

        logger.error('Failed to activate company', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (errorMessage.includes('already active')) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to activate company',
        })
      }
    }
  )

  /**
   * POST /backoffice/companies/:id/deactivate
   *
   * Deactivate company (block login, freeze wallet)
   */
  fastify.post(
    '/:id/deactivate',
    {
      preHandler: [requireSuperAdmin()],
      schema: simpleActionSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.deactivateCompany(id, user.id)

        logger.info('Company deactivated', {
          companyId: id,
          deactivatedBy: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: 'Company deactivated successfully',
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to deactivate company'

        logger.error('Failed to deactivate company', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (errorMessage.includes('already inactive')) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to deactivate company',
        })
      }
    }
  )

  /**
   * GET /backoffice/companies/:id/wallet
   *
   * Get company wallet status with burn rate and coverage metrics
   */
  fastify.get(
    '/:id/wallet',
    {
      preHandler: [requireSuperAdmin()],
      schema: getWalletStatusSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const wallet = await backofficeCompanyService.getWalletStatus(id)

        if (!wallet) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: 'Wallet not found',
          })
        }

        return reply.code(200).send({
          success: true,
          data: wallet,
        })
      } catch (error) {
        logger.error('Failed to get wallet status', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to get wallet status',
        })
      }
    }
  )

  /**
   * POST /backoffice/companies/:id/wallet/credits
   *
   * Add credits to company wallet
   */
  fastify.post(
    '/:id/wallet/credits',
    {
      preHandler: [requireSuperAdmin()],
      schema: addWalletCreditsSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.addWalletCredits(id, body, user.id)

        logger.info('Wallet credits added', {
          companyId: id,
          amount: body.amount,
          addedBy: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: 'Credits added successfully',
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to add credits'

        logger.error('Failed to add wallet credits', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (errorMessage.includes('must be greater than 0')) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to add credits',
        })
      }
    }
  )

  /**
   * DELETE /backoffice/companies/:id/wallet/credits
   *
   * Remove credits from company wallet
   */
  fastify.delete(
    '/:id/wallet/credits',
    {
      preHandler: [requireSuperAdmin()],
      schema: removeWalletCreditsSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.removeWalletCredits(id, body, user.id)

        logger.info('Wallet credits removed', {
          companyId: id,
          amount: body.amount,
          removedBy: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: 'Credits removed successfully',
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to remove credits'

        logger.error('Failed to remove wallet credits', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (
          errorMessage.includes('Insufficient balance') ||
          errorMessage.includes('must be greater than 0')
        ) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to remove credits',
        })
      }
    }
  )

  /**
   * POST /backoffice/companies/:id/wallet/freeze
   *
   * Freeze company wallet
   */
  fastify.post(
    '/:id/wallet/freeze',
    {
      preHandler: [requireSuperAdmin()],
      schema: simpleActionSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.freezeWallet(id, user.id)

        logger.info('Wallet frozen', { companyId: id, frozenBy: user.id })

        return reply.code(200).send({
          success: true,
          message: 'Wallet frozen successfully',
        })
      } catch (error) {
        logger.error('Failed to freeze wallet', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to freeze wallet',
        })
      }
    }
  )

  /**
   * POST /backoffice/companies/:id/wallet/unfreeze
   *
   * Unfreeze company wallet
   */
  fastify.post(
    '/:id/wallet/unfreeze',
    {
      preHandler: [requireSuperAdmin()],
      schema: simpleActionSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.unfreezeWallet(id, user.id)

        logger.info('Wallet unfrozen', { companyId: id, unfrozenBy: user.id })

        return reply.code(200).send({
          success: true,
          message: 'Wallet unfrozen successfully',
        })
      } catch (error) {
        logger.error('Failed to unfreeze wallet', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to unfreeze wallet',
        })
      }
    }
  )

  /**
   * GET /backoffice/companies/:id/plan
   *
   * Get company current plan
   */
  fastify.get(
    '/:id/plan',
    {
      preHandler: [requireSuperAdmin()],
      schema: getPlanSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const plan = await backofficeCompanyService.getPlan(id)

        logger.info('Company plan retrieved', {
          companyId: id,
          planType: plan.planType,
        })

        return reply.code(200).send({
          success: true,
          data: plan,
        })
      } catch (error) {
        logger.error('Failed to get plan', { error })

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to get plan',
        })
      }
    }
  )

  /**
   * PATCH /backoffice/companies/:id/plan
   *
   * Update company plan
   */
  fastify.patch(
    '/:id/plan',
    {
      preHandler: [requireSuperAdmin()],
      schema: updatePlanSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.updatePlan(id, body, user.id)

        logger.info('Company plan updated', {
          companyId: id,
          planType: body.planType,
          updatedBy: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: 'Plan updated successfully',
        })
      } catch (error) {
        logger.error('Failed to update plan', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to update plan',
        })
      }
    }
  )

  /**
   * GET /backoffice/companies/:id/billing
   *
   * Get company billing information
   */
  fastify.get(
    '/:id/billing',
    {
      preHandler: [requireSuperAdmin()],
      schema: getBillingInfoSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const billing = await backofficeCompanyService.getBillingInfo(id)

        if (!billing) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: 'Company not found',
          })
        }

        return reply.code(200).send({
          success: true,
          data: billing,
        })
      } catch (error) {
        logger.error('Failed to get billing info', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to get billing info',
        })
      }
    }
  )

  /**
   * GET /backoffice/companies/:id/metrics
   *
   * Get company metrics (users, compliments, engagement, redemptions, values)
   */
  fastify.get(
    '/:id/metrics',
    {
      preHandler: [requireSuperAdmin()],
      schema: getMetricsSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const query = request.query as any

        const metrics = await backofficeCompanyService.getMetrics(id, query)

        return reply.code(200).send({
          success: true,
          data: metrics,
        })
      } catch (error) {
        logger.error('Failed to get metrics', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to get metrics',
        })
      }
    }
  )

  /**
   * POST /backoffice/companies/:id/contacts
   *
   * Add company contact
   */
  fastify.post(
    '/:id/contacts',
    {
      preHandler: [requireSuperAdmin()],
      schema: addContactSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        const result = await backofficeCompanyService.addContact(
          id,
          body,
          user.id
        )

        logger.info('Contact added', {
          companyId: id,
          contactId: result.id,
          addedBy: user.id,
        })

        return reply.code(201).send({
          success: true,
          data: result,
        })
      } catch (error) {
        logger.error('Failed to add contact', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to add contact',
        })
      }
    }
  )

  /**
   * PATCH /backoffice/companies/:id/contacts/:contactId
   *
   * Update company contact
   */
  fastify.patch(
    '/:id/contacts/:contactId',
    {
      preHandler: [requireSuperAdmin()],
      schema: updateContactSchema,
    },
    async (request, reply) => {
      try {
        const { contactId } = request.params as { contactId: string }
        const body = request.body as any
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.updateContact(contactId, body, user.id)

        logger.info('Contact updated', {
          contactId,
          updatedBy: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: 'Contact updated successfully',
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update contact'

        logger.error('Failed to update contact', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to update contact',
        })
      }
    }
  )

  /**
   * DELETE /backoffice/companies/:id/contacts/:contactId
   *
   * Delete company contact
   */
  fastify.delete(
    '/:id/contacts/:contactId',
    {
      preHandler: [requireSuperAdmin()],
      schema: deleteContactSchema,
    },
    async (request, reply) => {
      try {
        const { contactId } = request.params as { contactId: string }
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.deleteContact(contactId, user.id)

        logger.info('Contact deleted', {
          contactId,
          deletedBy: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: 'Contact deleted successfully',
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete contact'

        logger.error('Failed to delete contact', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to delete contact',
        })
      }
    }
  )

  /**
   * POST /backoffice/companies/:id/domains
   *
   * Add allowed domain for SSO
   */
  fastify.post(
    '/:id/domains',
    {
      preHandler: [requireSuperAdmin()],
      schema: addAllowedDomainSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        const result = await backofficeCompanyService.addAllowedDomain(
          id,
          body,
          user.id
        )

        logger.info('Allowed domain added', {
          companyId: id,
          domainId: result.id,
          addedBy: user.id,
        })

        return reply.code(201).send({
          success: true,
          data: result,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to add domain'

        logger.error('Failed to add allowed domain', { error })

        if (errorMessage.includes('already added')) {
          return reply.code(409).send({
            success: false,
            error: 'Conflict',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to add domain',
        })
      }
    }
  )

  /**
   * DELETE /backoffice/companies/:id/domains/:domainId
   *
   * Delete allowed domain
   */
  fastify.delete(
    '/:id/domains/:domainId',
    {
      preHandler: [requireSuperAdmin()],
      schema: deleteAllowedDomainSchema,
    },
    async (request, reply) => {
      try {
        const { domainId } = request.params as { domainId: string }
        const authUserId = getAuthUserId(request)

        const user = await User.findByAuthUserId(authUserId)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        await backofficeCompanyService.deleteAllowedDomain(domainId, user.id)

        logger.info('Allowed domain deleted', {
          domainId,
          deletedBy: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: 'Domain deleted successfully',
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete domain'

        logger.error('Failed to delete allowed domain', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to delete domain',
        })
      }
    }
  )
}
