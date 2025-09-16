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
   * Criar nova empresa
   */
  fastify.post('/create-company', {
    schema: createCompanySchema,
    handler: async (request: FastifyRequest<{ Body: CreateCompanyRequest }>, reply: FastifyReply) => {
      const company = await companyService.createCompany(request.body)
      
      return reply.code(201).send({
        success: true,
        data: company.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
        },
      })
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
