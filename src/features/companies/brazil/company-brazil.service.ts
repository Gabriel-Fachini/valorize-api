import { CompanyBrazil, type CreateCompanyBrazilData, type UpdateCompanyBrazilData } from './company-brazil.model'
import { logger } from '@/lib/logger'

export const companyBrazilService = {
  /**
   * Criar dados específicos do Brasil para uma empresa
   */
  async createBrazilData(data: CreateCompanyBrazilData): Promise<CompanyBrazil> {
    try {
      logger.info('Creating Brazil data for company', { companyId: data.companyId })

      // Validar CNPJ
      if (!CompanyBrazil.validateCNPJStatic(data.cnpj)) {
        throw new Error('Invalid CNPJ')
      }

      // Verificar se CNPJ já existe
      const existingCompany = await CompanyBrazil.findByCNPJ(data.cnpj)
      if (existingCompany) {
        throw new Error('CNPJ already exists')
      }

      // Verificar se empresa já tem dados do Brasil
      const existingBrazilData = await CompanyBrazil.findByCompanyId(data.companyId)
      if (existingBrazilData) {
        throw new Error('Company already has Brazil data')
      }

      const companyBrazil = await CompanyBrazil.create(data)
      
      logger.info('Brazil data created successfully', { 
        companyId: data.companyId,
        companyBrazilId: companyBrazil.id, 
      })
      
      return companyBrazil
    } catch (error) {
      logger.error('Failed to create Brazil data', { error, data })
      throw error
    }
  },

  /**
   * Atualizar dados específicos do Brasil
   */
  async updateBrazilData(companyId: string, data: UpdateCompanyBrazilData): Promise<CompanyBrazil> {
    try {
      const companyBrazil = await CompanyBrazil.findByCompanyId(companyId)
      
      if (!companyBrazil) {
        throw new Error('Brazil data not found for this company')
      }

      // Validar CNPJ se fornecido
      if (data.cnpj && !CompanyBrazil.validateCNPJStatic(data.cnpj)) {
        throw new Error('Invalid CNPJ')
      }

      // Verificar se novo CNPJ já existe (se fornecido)
      if (data.cnpj && data.cnpj !== companyBrazil.cnpj) {
        const existingCompany = await CompanyBrazil.findByCNPJ(data.cnpj)
        if (existingCompany) {
          throw new Error('CNPJ already exists')
        }
      }

      // Atualizar dados
      Object.assign(companyBrazil['data'], data)
      await companyBrazil.save()

      logger.info('Brazil data updated successfully', { companyId, companyBrazilId: companyBrazil.id })
      return companyBrazil
    } catch (error) {
      logger.error('Failed to update Brazil data', { error, companyId, data })
      throw error
    }
  },

  /**
   * Obter dados do Brasil por ID da empresa
   */
  async getBrazilDataByCompanyId(companyId: string): Promise<CompanyBrazil> {
    try {
      const companyBrazil = await CompanyBrazil.findByCompanyId(companyId)
      
      if (!companyBrazil) {
        throw new Error('Brazil data not found for this company')
      }

      return companyBrazil
    } catch (error) {
      logger.error('Failed to get Brazil data by company id', { error, companyId })
      throw error
    }
  },

  /**
   * Validar CNPJ
   */
  validateCNPJ(cnpj: string): boolean {
    try {
      return CompanyBrazil.validateCNPJStatic(cnpj)
    } catch (error) {
      logger.error('Failed to validate CNPJ', { error, cnpj })
      return false
    }
  },

  /**
   * Formatar CNPJ
   */
  formatCNPJ(cnpj: string): string {
    try {
      return CompanyBrazil.formatCNPJ(cnpj)
    } catch (error) {
      logger.error('Failed to format CNPJ', { error, cnpj })
      return cnpj
    }
  },

  /**
   * Verificar se CNPJ já existe
   */
  async cnpjExists(cnpj: string): Promise<boolean> {
    try {
      return await CompanyBrazil.existsByCNPJ(cnpj)
    } catch (error) {
      logger.error('Failed to check if CNPJ exists', { error, cnpj })
      throw error
    }
  },

  /**
   * Deletar dados do Brasil
   */
  async deleteBrazilData(companyId: string): Promise<void> {
    try {
      const companyBrazil = await CompanyBrazil.findByCompanyId(companyId)
      
      if (!companyBrazil) {
        throw new Error('Brazil data not found for this company')
      }

      await companyBrazil.delete()
      logger.info('Brazil data deleted successfully', { companyId })
    } catch (error) {
      logger.error('Failed to delete Brazil data', { error, companyId })
      throw error
    }
  },
}
