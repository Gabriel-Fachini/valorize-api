import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { companyService, type CreateCompanyRequest } from './company.service'
import { companyBrazilService } from './brazil/company-brazil.service'
import {
  createCompanySchema,
  getAllCompaniesSchema,
  validateCNPJSchema,
} from './company.schemas'
import { logger } from '@/lib/logger'

export default async function companyRoutes(fastify: FastifyInstance) {
  // Company routes
  
  /**
   * Listar todas as empresas
   */
  fastify.get('/get-all-companies', {
    schema: getAllCompaniesSchema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companies = await companyService.getAllCompanies()
        
        return reply.code(200).send({
          success: true,
          data: companies.map(company => company.toJSON()),
          meta: {
            total: companies.length,
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error) {
        logger.error('Failed to get all companies', { error })
        return reply.code(500).send({
          success: false,
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
          },
        })
      }
    },
  })

  /**
   * Create new company with first admin user
   */
  fastify.post('/create-company', {
    schema: createCompanySchema,
    handler: async (request: FastifyRequest<{ Body: CreateCompanyRequest }>, reply: FastifyReply) => {
      try {
        const result = await companyService.createCompany(request.body)

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
        logger.error('Failed to create company', {
          error: error instanceof Error ? error.message : String(error),
          body: request.body,
        })

        // Determine error type and return appropriate status code
        const errorMessage = error instanceof Error ? error.message : 'Internal server error'

        if (errorMessage.includes('already exists') || errorMessage.includes('CNPJ')) {
          return reply.code(409).send({
            success: false,
            error: {
              message: errorMessage,
              code: 'CONFLICT',
            },
          })
        }

        if (errorMessage.includes('Invalid') || errorMessage.includes('must belong')) {
          return reply.code(400).send({
            success: false,
            error: {
              message: errorMessage,
              code: 'VALIDATION_ERROR',
            },
          })
        }

        return reply.code(500).send({
          success: false,
          error: {
            message: errorMessage,
            code: 'INTERNAL_ERROR',
          },
        })
      }
    },
  })

  /**
   * Validar CNPJ
   */
  fastify.post('/validate-cnpj', {
    schema: validateCNPJSchema,
    handler: async (request: FastifyRequest<{ Body: { cnpj: string } }>, reply: FastifyReply) => {
      try {
        const isValid = companyBrazilService.validateCNPJ(request.body.cnpj)
        const formatted = companyBrazilService.formatCNPJ(request.body.cnpj)
        
        return reply.code(200).send({
          success: true,
          data: {
            cnpj: request.body.cnpj,
            formatted,
            isValid,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error) {
        logger.error('Failed to validate CNPJ', { error, cnpj: request.body.cnpj })
        return reply.code(500).send({
          success: false,
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
          },
        })
      }
    },
  })
}
