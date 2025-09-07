import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import type { CompanyBrazil as PrismaCompanyBrazil, Company } from '@prisma/client'

export interface CompanyBrazilData extends PrismaCompanyBrazil {
  company?: Company
}

export interface CreateCompanyBrazilData {
  companyId: string
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

export interface UpdateCompanyBrazilData {
  cnpj?: string
  razaoSocial?: string
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  nire?: string
  cnaePrincipal?: string
  cnaeSecundario?: string
  naturezaJuridica?: string
  porteEmpresa?: string
  situacaoCadastral?: string
}

export class CompanyBrazil {
  constructor(private data: CompanyBrazilData) {}

  get id(): string {
    return this.data.id
  }

  get companyId(): string {
    return this.data.companyId
  }

  get cnpj(): string {
    return this.data.cnpj
  }

  get razaoSocial(): string {
    return this.data.razaoSocial
  }

  get inscricaoEstadual(): string | null {
    return this.data.inscricaoEstadual
  }

  get inscricaoMunicipal(): string | null {
    return this.data.inscricaoMunicipal
  }

  get nire(): string | null {
    return this.data.nire
  }

  get cnaePrincipal(): string {
    return this.data.cnaePrincipal
  }

  get cnaeSecundario(): string | null {
    return this.data.cnaeSecundario
  }

  get naturezaJuridica(): string {
    return this.data.naturezaJuridica
  }

  get porteEmpresa(): string {
    return this.data.porteEmpresa
  }

  get situacaoCadastral(): string {
    return this.data.situacaoCadastral
  }

  get company(): Company | undefined {
    return this.data.company
  }

  get createdAt(): Date {
    return this.data.createdAt
  }

  get updatedAt(): Date {
    return this.data.updatedAt
  }

  toJSON() {
    return {
      id: this.id,
      companyId: this.companyId,
      cnpj: this.cnpj,
      razaoSocial: this.razaoSocial,
      inscricaoEstadual: this.inscricaoEstadual,
      inscricaoMunicipal: this.inscricaoMunicipal,
      nire: this.nire,
      cnaePrincipal: this.cnaePrincipal,
      cnaeSecundario: this.cnaeSecundario,
      naturezaJuridica: this.naturezaJuridica,
      porteEmpresa: this.porteEmpresa,
      situacaoCadastral: this.situacaoCadastral,
      company: this.company,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  // Instance methods
  async save(): Promise<CompanyBrazil> {
    try {
      const updated = await prisma.companyBrazil.update({
        where: { id: this.id },
        data: {
          cnpj: this.data.cnpj,
          razaoSocial: this.data.razaoSocial,
          inscricaoEstadual: this.data.inscricaoEstadual,
          inscricaoMunicipal: this.data.inscricaoMunicipal,
          nire: this.data.nire,
          cnaePrincipal: this.data.cnaePrincipal,
          cnaeSecundario: this.data.cnaeSecundario,
          naturezaJuridica: this.data.naturezaJuridica,
          porteEmpresa: this.data.porteEmpresa,
          situacaoCadastral: this.data.situacaoCadastral
        },
        include: {
          company: true
        }
      })

      this.data = updated
      logger.info('CompanyBrazil updated successfully', { companyBrazilId: this.id })
      return this
    } catch (error) {
      logger.error('Failed to update CompanyBrazil', { error, companyBrazilId: this.id })
      throw error
    }
  }

  async delete(): Promise<void> {
    try {
      await prisma.companyBrazil.delete({
        where: { id: this.id }
      })

      logger.info('CompanyBrazil deleted successfully', { companyBrazilId: this.id })
    } catch (error) {
      logger.error('Failed to delete CompanyBrazil', { error, companyBrazilId: this.id })
      throw error
    }
  }

  // Validation methods
  validateCNPJ(): boolean {
    const cnpj = this.cnpj.replace(/[^\d]/g, '')
    
    if (cnpj.length !== 14) return false
    if (/^(\d)\1{13}$/.test(cnpj)) return false

    // Validação dos dígitos verificadores
    let sum = 0
    let weight = 2

    // Primeiro dígito verificador
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cnpj[i]) * weight
      weight = weight === 9 ? 2 : weight + 1
    }

    const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (parseInt(cnpj[12]) !== firstDigit) return false

    // Segundo dígito verificador
    sum = 0
    weight = 2

    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cnpj[i]) * weight
      weight = weight === 9 ? 2 : weight + 1
    }

    const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    return parseInt(cnpj[13]) === secondDigit
  }

  // Static methods (Repository pattern)
  static async findByCompanyId(companyId: string): Promise<CompanyBrazil | null> {
    try {
      const companyBrazil = await prisma.companyBrazil.findUnique({
        where: { companyId },
        include: {
          company: true
        }
      })

      if (!companyBrazil) {
        return null
      }

      return new CompanyBrazil(companyBrazil)
    } catch (error) {
      logger.error('Failed to find CompanyBrazil by companyId', { error, companyId })
      throw error
    }
  }

  static async findByCNPJ(cnpj: string): Promise<CompanyBrazil | null> {
    try {
      const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
      
      const companyBrazil = await prisma.companyBrazil.findUnique({
        where: { cnpj: cleanCNPJ },
        include: {
          company: true
        }
      })

      if (!companyBrazil) {
        return null
      }

      return new CompanyBrazil(companyBrazil)
    } catch (error) {
      logger.error('Failed to find CompanyBrazil by CNPJ', { error, cnpj })
      throw error
    }
  }

  static async create(data: CreateCompanyBrazilData): Promise<CompanyBrazil> {
    try {
      const cleanCNPJ = data.cnpj.replace(/[^\d]/g, '')
      
      const companyBrazil = await prisma.companyBrazil.create({
        data: {
          companyId: data.companyId,
          cnpj: cleanCNPJ,
          razaoSocial: data.razaoSocial,
          inscricaoEstadual: data.inscricaoEstadual,
          inscricaoMunicipal: data.inscricaoMunicipal,
          nire: data.nire,
          cnaePrincipal: data.cnaePrincipal,
          cnaeSecundario: data.cnaeSecundario,
          naturezaJuridica: data.naturezaJuridica,
          porteEmpresa: data.porteEmpresa,
          situacaoCadastral: data.situacaoCadastral
        },
        include: {
          company: true
        }
      })

      logger.info('CompanyBrazil created successfully', { companyBrazilId: companyBrazil.id })
      return new CompanyBrazil(companyBrazil)
    } catch (error) {
      logger.error('Failed to create CompanyBrazil', { error, data })
      throw error
    }
  }

  static async existsByCNPJ(cnpj: string): Promise<boolean> {
    try {
      const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
      
      const count = await prisma.companyBrazil.count({
        where: { cnpj: cleanCNPJ }
      })

      return count > 0
    } catch (error) {
      logger.error('Failed to check if CompanyBrazil exists by CNPJ', { error, cnpj })
      throw error
    }
  }

  // Utility methods
  static formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
    
    if (cleanCNPJ.length !== 14) {
      return cnpj
    }

    return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  static validateCNPJStatic(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
    
    if (cleanCNPJ.length !== 14) return false
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false

    // Validação dos dígitos verificadores
    let sum = 0
    let weight = 2

    // Primeiro dígito verificador
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cleanCNPJ[i]) * weight
      weight = weight === 9 ? 2 : weight + 1
    }

    const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (parseInt(cleanCNPJ[12]) !== firstDigit) return false

    // Segundo dígito verificador
    sum = 0
    weight = 2

    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cleanCNPJ[i]) * weight
      weight = weight === 9 ? 2 : weight + 1
    }

    const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    return parseInt(cleanCNPJ[13]) === secondDigit
  }
}
