/**
 * @fileoverview Company Values Routes
 *
 * Routes for managing company values (admin only).
 * Base path: /admin/company/values
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { companyValuesService } from './company-values.service'
import {
  listCompanyValuesSchema,
  getCompanyValueSchema,
  createCompanyValueSchema,
  updateCompanyValueSchema,
  reorderCompanyValuesSchema,
} from './company-values.schemas'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/rbac/permissions.constants'
import { getAuth0Id } from '@/middleware/auth'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * Get company ID from authenticated user
 */
async function getCompanyIdFromUser(auth0Id: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { auth0Id },
    select: { companyId: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user.companyId
}

export default async function companyValuesRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/company/values
   * List all company values ordered by position
   */
  fastify.get(
    '/',
    {
      schema: listCompanyValuesSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const values = await companyValuesService.listValues(companyId)
        return reply.code(200).send(values)
      } catch (error) {
        logger.error('Failed to list company values', { error })

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to retrieve company values',
        })
      }
    },
  )

  /**
   * GET /admin/company/values/:id
   * Get a specific company value by ID
   */
  fastify.get(
    '/:id',
    {
      schema: getCompanyValueSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
        const valueId = parseInt((request.params as any).id, 10)

        if (isNaN(valueId)) {
          return reply.code(400).send({
            error: 'Invalid ID',
            message: 'Value ID must be a valid integer',
          })
        }

        const value = await companyValuesService.getValueById(companyId, valueId)
        return reply.code(200).send(value)
      } catch (error) {
        logger.error('Failed to get company value', { error })

        if (error instanceof Error && error.message === 'Company value not found') {
          return reply.code(404).send({
            error: 'Not found',
            message: 'Company value not found',
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to retrieve company value',
        })
      }
    },
  )

  /**
   * POST /admin/company/values
   * Create a new company value
   */
  fastify.post(
    '/',
    {
      schema: createCompanyValueSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const value = await companyValuesService.createValue(companyId, request.body as any)

        return reply.code(201).send(value)
      } catch (error) {
        logger.error('Failed to create company value', { error })

        if (
          error instanceof Error &&
          error.message === 'A value with this title already exists for this company'
        ) {
          return reply.code(409).send({
            error: 'Duplicate value',
            message: error.message,
          })
        }

        return reply.code(400).send({
          error: 'Validation error',
          message: 'Failed to create company value',
        })
      }
    },
  )

  /**
   * PATCH /admin/company/values/:id
   * Update an existing company value
   */
  fastify.patch(
    '/:id',
    {
      schema: updateCompanyValueSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
        const valueId = parseInt((request.params as any).id, 10)

        if (isNaN(valueId)) {
          return reply.code(400).send({
            error: 'Invalid ID',
            message: 'Value ID must be a valid integer',
          })
        }

        const value = await companyValuesService.updateValue(
          companyId,
          valueId,
          request.body as any,
        )

        return reply.code(200).send(value)
      } catch (error) {
        logger.error('Failed to update company value', { error })

        if (error instanceof Error && error.message === 'Company value not found') {
          return reply.code(404).send({
            error: 'Not found',
            message: 'Company value not found',
          })
        }

        if (
          error instanceof Error &&
          error.message === 'A value with this title already exists for this company'
        ) {
          return reply.code(409).send({
            error: 'Duplicate value',
            message: error.message,
          })
        }

        return reply.code(400).send({
          error: 'Validation error',
          message: 'Failed to update company value',
        })
      }
    },
  )

  /**
   * PATCH /admin/company/values/reorder
   * Reorder company values
   */
  fastify.patch(
    '/reorder',
    {
      schema: reorderCompanyValuesSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const body = request.body as { ordered_ids: number[] }
        const values = await companyValuesService.reorderValues(companyId, body.ordered_ids)

        return reply.code(200).send({
          message: 'Company values reordered successfully',
          values,
        })
      } catch (error) {
        logger.error('Failed to reorder company values', { error })

        if (
          error instanceof Error &&
          error.message === 'Some value IDs do not belong to this company or do not exist'
        ) {
          return reply.code(400).send({
            error: 'Invalid value IDs',
            message: error.message,
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to reorder company values',
        })
      }
    },
  )
}
