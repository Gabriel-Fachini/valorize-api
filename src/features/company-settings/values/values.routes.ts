import { FastifyInstance, FastifyRequest } from 'fastify'
import {
  createCompanyValueSchema,
  CreateCompanyValueInput,
  listCompanyValuesSchema,
} from './values.schemas'
import { companyValuesService } from './values.service'
import { requirePermission } from '@/middleware/rbac'

export default async function companyValuesRoutes(fastify: FastifyInstance) {
  fastify.post('/companies/:companyId/create-value', {
    schema: createCompanyValueSchema,
    preHandler: [requirePermission('company:manage_settings')],
  }, async (
      request: FastifyRequest<{
        Params: { companyId: string }
        Body: CreateCompanyValueInput
      }>,
      reply,
    ) => {
      const { companyId } = request.params
      const value = await companyValuesService.createCompanyValue(
        companyId,
        request.body,
      )
      return reply.code(201).send({
        message: 'Company value created successfully!',
        value,
      })
    },
  )

  fastify.get('/companies/:companyId/values', {
    schema: listCompanyValuesSchema,
  }, async (
      request: FastifyRequest<{
        Params: { companyId: string }
      }>,
      reply,
    ) => {
      const { companyId } = request.params
      const values = await companyValuesService.listCompanyValues(companyId)
      return reply.send(values)
    },
  )
}