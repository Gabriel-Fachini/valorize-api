import { Company, type CreateCompanyData } from './company.model'
import { CompanyBrazil } from './brazil/company-brazil.model'
import { logger } from '@/lib/logger'

export interface CreateCompanyRequest extends CreateCompanyData {
  brazilData?: {
    cnpj: string
    razaoSocial: string
    inscricaoEstadual?: string
    inscricaoMunicipal?: string
    nire?: string
    cnaePrincipal: string
    cnaeSecundario?: string
    naturezaJuridica: string
    porteEmpresa: string
    situacaoCadastral: string
  }
}

export const companyService = {
  /**
   * Criar nova empresa
   */
  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    try {
      logger.info('Creating new company', { domain: data.domain })

      // Verificar se domínio já existe
      const existingCompany = await Company.findByDomain(data.domain)
      if (existingCompany) {
        throw new Error('Domain already exists')
      }

      // Se há dados do Brasil, validar CNPJ antes de criar a empresa
      if (data.brazilData && data.country === 'BR') {
        // Validar CNPJ
        if (!CompanyBrazil.validateCNPJStatic(data.brazilData.cnpj)) {
          throw new Error('Invalid CNPJ')
        }

        // Verificar se CNPJ já existe
        const existingCompanyBrazil = await CompanyBrazil.findByCNPJ(data.brazilData.cnpj)
        if (existingCompanyBrazil) {
          throw new Error('CNPJ already exists')
        }
      }

      // Criar empresa
      const company = await Company.create({
        name: data.name,
        domain: data.domain,
        country: data.country,
        timezone: data.timezone,
      })

      // Se há dados do Brasil, criar também
      if (data.brazilData && data.country === 'BR') {
        try {
          await CompanyBrazil.create({
            companyId: company.id,
            ...data.brazilData,
          })

          // Recarregar empresa com dados do Brasil
          const updatedCompany = await Company.findById(company.id)
          if (updatedCompany) {
            logger.info('Company created successfully with Brazil data', { companyId: company.id })
            return updatedCompany
          }
        } catch (brazilError) {
          // Se falhar ao criar dados do Brasil, deletar a empresa criada
          logger.error('Failed to create Brazil data, rolling back company creation', { 
            error: brazilError, 
            companyId: company.id,
          })
          
          try {
            await company.delete()
          } catch (deleteError) {
            logger.error('Failed to rollback company creation', { 
              error: deleteError, 
              companyId: company.id,
            })
          }
          
          throw brazilError
        }
      }

      logger.info('Company created successfully', { companyId: company.id })
      return company
    } catch (error) {
      logger.error('Failed to create company', { error, data })
      throw error
    }
  },

  /**
   * Listar todas as empresas
   */
  async getAllCompanies(): Promise<Company[]> {
    try {
      return await Company.findAll()
    } catch (error) {
      logger.error('Failed to get all companies', { error })
      throw error
    }
  },

  /**
   * Verificar se domínio existe
   */
  async validateDomain(domain: string): Promise<boolean> {
    try {
      return await Company.exists(domain)
    } catch (error) {
      logger.error('Failed to validate domain', { error, domain })
      throw error
    }
  },
}
