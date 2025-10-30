import { FastifyInstance, FastifyRequest } from 'fastify'
import {
  updateCompanySettingsSchema,
  UpdateCompanySettingsInput,
} from './settings.schemas'
import { companySettingsService } from './settings.service'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/rbac/permissions.constants'

export default async function companySettingsRoutes(fastify: FastifyInstance) {
  // Get company settings
  fastify.get('/companies/:companyId/settings', async (
      request: FastifyRequest<{
        Params: { companyId: string }
      }>,
      reply,
    ) => {
      const { companyId } = request.params
      
      try {
        const settings = await companySettingsService.getCompanySettings(companyId)
        return reply.send({ settings })
      } catch (error) {
        return reply.code(500).send({
          message: 'Failed to retrieve company settings',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  )

  // Update company settings
  fastify.put('/companies/:companyId/settings', {
    schema: updateCompanySettingsSchema,
    preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
  }, async (
      request: FastifyRequest<{
        Params: { companyId: string }
        Body: UpdateCompanySettingsInput
      }>,
      reply,
    ) => {
      const { companyId } = request.params
      const settings = await companySettingsService.updateCompanySettings(
        companyId,
        request.body,
      )
      return reply.send({
        message: 'Company settings updated successfully!',
        settings,
      })
    },
  )
}
