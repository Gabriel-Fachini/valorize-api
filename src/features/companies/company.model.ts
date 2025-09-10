import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import type { Company as PrismaCompany, CompanyBrazil, CompanyContact } from '@prisma/client'

export interface CompanyData extends PrismaCompany {
  companyBrazil?: CompanyBrazil | null
  contacts?: CompanyContact[]
}

export interface CreateCompanyData {
  name: string
  domain: string
  country?: string
  timezone?: string
}

export interface UpdateCompanyData {
  name?: string
  domain?: string
  country?: string
  timezone?: string
  isActive?: boolean
}

export class Company {
  constructor(private data: CompanyData) {}

  get id(): string {
    return this.data.id
  }

  get name(): string {
    return this.data.name
  }

  get domain(): string {
    return this.data.domain
  }

  get country(): string {
    return this.data.country
  }

  get timezone(): string {
    return this.data.timezone
  }

  get isActive(): boolean {
    return this.data.isActive
  }

  get companyBrazil(): CompanyBrazil | null | undefined {
    return this.data.companyBrazil
  }

  get contacts(): CompanyContact[] | undefined {
    return this.data.contacts
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
      name: this.name,
      domain: this.domain,
      country: this.country,
      timezone: this.timezone,
      isActive: this.isActive,
      companyBrazil: this.companyBrazil,
      contacts: this.contacts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  // Instance methods
  async save(): Promise<Company> {
    try {
      const updated = await prisma.company.update({
        where: { id: this.id },
        data: {
          name: this.data.name,
          domain: this.data.domain,
          country: this.data.country,
          timezone: this.data.timezone,
          isActive: this.data.isActive,
        },
        include: {
          companyBrazil: true,
          contacts: {
            include: {
              user: true,
            },
          },
        },
      })

      this.data = updated
      logger.info('Company updated successfully', { companyId: this.id })
      return this
    } catch (error) {
      logger.error('Failed to update company', { error, companyId: this.id })
      throw error
    }
  }

  async delete(): Promise<void> {
    try {
      await prisma.company.update({
        where: { id: this.id },
        data: { isActive: false },
      })

      this.data.isActive = false
      logger.info('Company soft deleted successfully', { companyId: this.id })
    } catch (error) {
      logger.error('Failed to delete company', { error, companyId: this.id })
      throw error
    }
  }

  // Static methods (Repository pattern)
  static async findById(id: string): Promise<Company | null> {
    try {
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          companyBrazil: true,
          contacts: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!company) {
        return null
      }

      return new Company(company)
    } catch (error) {
      logger.error('Failed to find company by id', { error, companyId: id })
      throw error
    }
  }

  static async findByDomain(domain: string): Promise<Company | null> {
    try {
      const company = await prisma.company.findUnique({
        where: { domain },
        include: {
          companyBrazil: true,
          contacts: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!company) {
        return null
      }

      return new Company(company)
    } catch (error) {
      logger.error('Failed to find company by domain', { error, domain })
      throw error
    }
  }

  static async findAll(): Promise<Company[]> {
    try {
      const companies = await prisma.company.findMany({
        where: { isActive: true },
        include: {
          companyBrazil: true,
          contacts: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return companies.map(company => new Company(company))
    } catch (error) {
      logger.error('Failed to find all companies', { error })
      throw error
    }
  }

  static async findByCountry(country: string): Promise<Company[]> {
    try {
      const companies = await prisma.company.findMany({
        where: { 
          country,
          isActive: true, 
        },
        include: {
          companyBrazil: true,
          contacts: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return companies.map(company => new Company(company))
    } catch (error) {
      logger.error('Failed to find companies by country', { error, country })
      throw error
    }
  }

  static async create(data: CreateCompanyData): Promise<Company> {
    try {
      const company = await prisma.company.create({
        data: {
          name: data.name,
          domain: data.domain,
          country: data.country || 'BR',
          timezone: data.timezone || 'America/Sao_Paulo',
        },
        include: {
          companyBrazil: true,
          contacts: {
            include: {
              user: true,
            },
          },
        },
      })

      logger.info('Company created successfully', { companyId: company.id })
      return new Company(company)
    } catch (error) {
      logger.error('Failed to create company', { error, data })
      throw error
    }
  }

  static async exists(domain: string): Promise<boolean> {
    try {
      const count = await prisma.company.count({
        where: { domain },
      })

      return count > 0
    } catch (error) {
      logger.error('Failed to check if company exists', { error, domain })
      throw error
    }
  }
}
