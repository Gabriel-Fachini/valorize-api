import { Company, type CreateCompanyData, type UpdateCompanyData } from './company.model'
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

      // Criar empresa
      const company = await Company.create({
        name: data.name,
        domain: data.domain,
        country: data.country,
        timezone: data.timezone,
      })

      // Se há dados do Brasil, criar também
      if (data.brazilData && data.country === 'BR') {
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
      }

      logger.info('Company created successfully', { companyId: company.id })
      return company
    } catch (error) {
      logger.error('Failed to create company', { error, data })
      throw error
    }
  },

  /**
   * Obter empresa por ID
   */
  async getCompanyById(id: string): Promise<Company> {
    try {
      const company = await Company.findById(id)
      
      if (!company) {
        throw new Error('Company not found')
      }

      return company
    } catch (error) {
      logger.error('Failed to get company by id', { error, companyId: id })
      throw error
    }
  },

  /**
   * Obter empresa por domínio
   */
  async getCompanyByDomain(domain: string): Promise<Company> {
    try {
      const company = await Company.findByDomain(domain)
      
      if (!company) {
        throw new Error('Company not found')
      }

      return company
    } catch (error) {
      logger.error('Failed to get company by domain', { error, domain })
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
   * Atualizar empresa
   */
  async updateCompany(id: string, data: UpdateCompanyData): Promise<Company> {
    try {
      const company = await Company.findById(id)
      
      if (!company) {
        throw new Error('Company not found')
      }

      // Verificar se novo domínio já existe (se fornecido)
      if (data.domain && data.domain !== company.domain) {
        const existingCompany = await Company.findByDomain(data.domain)
        if (existingCompany) {
          throw new Error('Domain already exists')
        }
      }

      // Atualizar dados
      Object.assign(company['data'], data)
      await company.save()

      logger.info('Company updated successfully', { companyId: id })
      return company
    } catch (error) {
      logger.error('Failed to update company', { error, companyId: id, data })
      throw error
    }
  },

  /**
   * Deletar empresa (soft delete)
   */
  async deleteCompany(id: string): Promise<void> {
    try {
      const company = await Company.findById(id)
      
      if (!company) {
        throw new Error('Company not found')
      }

      await company.delete()
      logger.info('Company deleted successfully', { companyId: id })
    } catch (error) {
      logger.error('Failed to delete company', { error, companyId: id })
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

  /**
   * Obter empresas por país
   */
  async getCompaniesByCountry(country: string): Promise<Company[]> {
    try {
      return await Company.findByCountry(country)
    } catch (error) {
      logger.error('Failed to get companies by country', { error, country })
      throw error
    }
  },
}
