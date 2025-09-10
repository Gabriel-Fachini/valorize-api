import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { companyService, type CreateCompanyRequest } from './company.service'
import { companyBrazilService } from './brazil/company-brazil.service'
import { companyContactService } from './contacts/company-contact.service'
import {
  createCompanySchema,
  updateCompanySchema,
  getCompanySchema,
  getCompanyByDomainSchema,
  getAllCompaniesSchema,
  deleteCompanySchema,
  addCompanyContactSchema,
  updateCompanyContactSchema,
  getCompanyContactsSchema,
  removeCompanyContactSchema,
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
      try {
        const company = await companyService.createCompany(request.body)
        
        return reply.code(201).send({
          success: true,
          data: company.toJSON(),
          meta: {
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error: unknown) {
        logger.error('Failed to create company', { error, body: request.body })
        
        if (error instanceof Error && error.message === 'Domain already exists') {
          return reply.code(409).send({
            success: false,
            error: {
              message: 'Domain already exists',
              code: 'DOMAIN_EXISTS',
            },
          })
        }

        if (error instanceof Error && error.message === 'Invalid CNPJ') {
          return reply.code(400).send({
            success: false,
            error: {
              message: 'Invalid CNPJ',
              code: 'INVALID_CNPJ',
            },
          })
        }

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
   * Obter empresa por ID
   */
  fastify.get('/get-company/:id', {
    schema: getCompanySchema,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const company = await companyService.getCompanyById(request.params.id)
        
        return reply.code(200).send({
          success: true,
          data: company.toJSON(),
          meta: {
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error: unknown) {
        logger.error('Failed to get company by id', { error, companyId: request.params.id })
        
        if (error instanceof Error && error.message === 'Company not found') {
          return reply.code(404).send({
            success: false,
            error: {
              message: 'Company not found',
              code: 'COMPANY_NOT_FOUND',
            },
          })
        }

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
   * Obter empresa por domínio
   */
  fastify.get('/get-company-by-domain/:domain', {
    schema: getCompanyByDomainSchema,
    handler: async (request: FastifyRequest<{ Params: { domain: string } }>, reply: FastifyReply) => {
      try {
        const company = await companyService.getCompanyByDomain(request.params.domain)
        
        return reply.code(200).send({
          success: true,
          data: company.toJSON(),
          meta: {
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error: unknown) {
        logger.error('Failed to get company by domain', { error, domain: request.params.domain })
        
        if (error instanceof Error && error.message === 'Company not found') {
          return reply.code(404).send({
            success: false,
            error: {
              message: 'Company not found',
              code: 'COMPANY_NOT_FOUND',
            },
          })
        }

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
   * Atualizar empresa
   */
  fastify.put('/update-company/:id', {
    schema: updateCompanySchema,
    handler: async (request: FastifyRequest<{ 
      Params: { id: string }, 
      Body: { name?: string, domain?: string, country?: string, timezone?: string, isActive?: boolean } 
    }>, reply: FastifyReply) => {
      try {
        const company = await companyService.updateCompany(request.params.id, request.body)
        
        return reply.code(200).send({
          success: true,
          data: company.toJSON(),
          meta: {
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error: unknown) {
        logger.error('Failed to update company', { error, companyId: request.params.id, body: request.body })
        
        if (error instanceof Error && error.message === 'Company not found') {
          return reply.code(404).send({
            success: false,
            error: {
              message: 'Company not found',
              code: 'COMPANY_NOT_FOUND',
            },
          })
        }

        if (error instanceof Error && error.message === 'Domain already exists') {
          return reply.code(409).send({
            success: false,
            error: {
              message: 'Domain already exists',
              code: 'DOMAIN_EXISTS',
            },
          })
        }

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
   * Deletar empresa
   */
  fastify.delete('/delete-company/:id', {
    schema: deleteCompanySchema,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await companyService.deleteCompany(request.params.id)
        
        return reply.code(200).send({
          success: true,
          data: { message: 'Company deleted successfully' },
          meta: {
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error: unknown) {
        logger.error('Failed to delete company', { error, companyId: request.params.id })
        
        if (error instanceof Error && error.message === 'Company not found') {
          return reply.code(404).send({
            success: false,
            error: {
              message: 'Company not found',
              code: 'COMPANY_NOT_FOUND',
            },
          })
        }

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

  // Company Contact routes

  /**
   * Listar contatos da empresa
   */
  fastify.get('/get-company-contacts/:companyId', {
    schema: getCompanyContactsSchema,
    handler: async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
      try {
        const contacts = await companyContactService.getCompanyContacts(request.params.companyId)
        
        return reply.code(200).send({
          success: true,
          data: contacts.map(contact => contact.toJSON()),
          meta: {
            total: contacts.length,
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error) {
        logger.error('Failed to get company contacts', { error, companyId: request.params.companyId })
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
   * Adicionar contato à empresa
   */
  fastify.post('/add-company-contact', {
    schema: addCompanyContactSchema,
    handler: async (request: FastifyRequest<{ 
      Body: { companyId: string, userId: string, role: string, isPrimary?: boolean } 
    }>, reply: FastifyReply) => {
      try {
        const contact = await companyContactService.addContact(request.body)
        
        return reply.code(201).send({
          success: true,
          data: contact.toJSON(),
          meta: {
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error: unknown) {
        logger.error('Failed to add company contact', { error, body: request.body })
        
        if (error instanceof Error && error.message === 'User is already a contact for this company') {
          return reply.code(409).send({
            success: false,
            error: {
              message: 'User is already a contact for this company',
              code: 'CONTACT_EXISTS',
            },
          })
        }

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
   * Atualizar contato da empresa
   */
  fastify.put('/update-company-contact/:id', {
    schema: updateCompanyContactSchema,
    handler: async (request: FastifyRequest<{ 
      Params: { id: string }, 
      Body: { role?: string, isPrimary?: boolean } 
    }>, reply: FastifyReply) => {
      try {
        const contact = await companyContactService.updateContact(request.params.id, request.body)
        
        return reply.code(200).send({
          success: true,
          data: contact.toJSON(),
          meta: {
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error: unknown) {
        logger.error('Failed to update company contact', { error, contactId: request.params.id, body: request.body })
        
        if (error instanceof Error && error.message === 'Contact not found') {
          return reply.code(404).send({
            success: false,
            error: {
              message: 'Contact not found',
              code: 'CONTACT_NOT_FOUND',
            },
          })
        }

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
   * Remover contato da empresa
   */
  fastify.delete('/remove-company-contact/:id', {
    schema: removeCompanyContactSchema,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await companyContactService.removeContact(request.params.id)
        
        return reply.code(200).send({
          success: true,
          data: { message: 'Contact removed successfully' },
          meta: {
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error: unknown) {
        logger.error('Failed to remove company contact', { error, contactId: request.params.id })
        
        if (error instanceof Error && error.message === 'Contact not found') {
          return reply.code(404).send({
            success: false,
            error: {
              message: 'Contact not found',
              code: 'CONTACT_NOT_FOUND',
            },
          })
        }

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
