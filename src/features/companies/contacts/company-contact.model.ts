import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import type { CompanyContact as PrismaCompanyContact, Company, User } from '@prisma/client'

export interface CompanyContactData extends PrismaCompanyContact {
  company?: Company
  user?: User
}

export interface CreateCompanyContactData {
  companyId: string
  userId: string
  role: string
  isPrimary?: boolean
}

export interface UpdateCompanyContactData {
  role?: string
  isPrimary?: boolean
}

export class CompanyContact {
  constructor(private data: CompanyContactData) {}

  get id(): string {
    return this.data.id
  }

  get companyId(): string {
    return this.data.companyId
  }

  get userId(): string {
    return this.data.userId
  }

  get role(): string {
    return this.data.role
  }

  get isPrimary(): boolean {
    return this.data.isPrimary
  }

  get company(): Company | undefined {
    return this.data.company
  }

  get user(): User | undefined {
    return this.data.user
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
      userId: this.userId,
      role: this.role,
      isPrimary: this.isPrimary,
      company: this.company,
      user: this.user,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  // Instance methods
  async save(): Promise<CompanyContact> {
    try {
      const updated = await prisma.companyContact.update({
        where: { id: this.id },
        data: {
          role: this.data.role,
          isPrimary: this.data.isPrimary
        },
        include: {
          company: true,
          user: true
        }
      })

      this.data = updated
      logger.info('CompanyContact updated successfully', { contactId: this.id })
      return this
    } catch (error) {
      logger.error('Failed to update CompanyContact', { error, contactId: this.id })
      throw error
    }
  }

  async delete(): Promise<void> {
    try {
      await prisma.companyContact.delete({
        where: { id: this.id }
      })

      logger.info('CompanyContact deleted successfully', { contactId: this.id })
    } catch (error) {
      logger.error('Failed to delete CompanyContact', { error, contactId: this.id })
      throw error
    }
  }

  async setPrimary(): Promise<CompanyContact> {
    try {
      // Primeiro, remove o status primary de outros contatos da mesma empresa
      await prisma.companyContact.updateMany({
        where: { 
          companyId: this.companyId,
          id: { not: this.id }
        },
        data: { isPrimary: false }
      })

      // Depois, define este contato como primary
      const updated = await prisma.companyContact.update({
        where: { id: this.id },
        data: { isPrimary: true },
        include: {
          company: true,
          user: true
        }
      })

      this.data = updated
      logger.info('CompanyContact set as primary successfully', { contactId: this.id })
      return this
    } catch (error) {
      logger.error('Failed to set CompanyContact as primary', { error, contactId: this.id })
      throw error
    }
  }

  // Static methods (Repository pattern)
  static async findById(id: string): Promise<CompanyContact | null> {
    try {
      const contact = await prisma.companyContact.findUnique({
        where: { id },
        include: {
          company: true,
          user: true
        }
      })

      if (!contact) {
        return null
      }

      return new CompanyContact(contact)
    } catch (error) {
      logger.error('Failed to find CompanyContact by id', { error, contactId: id })
      throw error
    }
  }

  static async findByCompanyId(companyId: string): Promise<CompanyContact[]> {
    try {
      const contacts = await prisma.companyContact.findMany({
        where: { companyId },
        include: {
          company: true,
          user: true
        },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'asc' }
        ]
      })

      return contacts.map(contact => new CompanyContact(contact))
    } catch (error) {
      logger.error('Failed to find CompanyContacts by companyId', { error, companyId })
      throw error
    }
  }

  static async findPrimaryByCompanyId(companyId: string): Promise<CompanyContact | null> {
    try {
      const contact = await prisma.companyContact.findFirst({
        where: { 
          companyId,
          isPrimary: true 
        },
        include: {
          company: true,
          user: true
        }
      })

      if (!contact) {
        return null
      }

      return new CompanyContact(contact)
    } catch (error) {
      logger.error('Failed to find primary CompanyContact by companyId', { error, companyId })
      throw error
    }
  }

  static async findByUserId(userId: string): Promise<CompanyContact[]> {
    try {
      const contacts = await prisma.companyContact.findMany({
        where: { userId },
        include: {
          company: true,
          user: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return contacts.map(contact => new CompanyContact(contact))
    } catch (error) {
      logger.error('Failed to find CompanyContacts by userId', { error, userId })
      throw error
    }
  }

  static async create(data: CreateCompanyContactData): Promise<CompanyContact> {
    try {
      // Se isPrimary for true, primeiro remove o status primary de outros contatos
      if (data.isPrimary) {
        await prisma.companyContact.updateMany({
          where: { companyId: data.companyId },
          data: { isPrimary: false }
        })
      }

      const contact = await prisma.companyContact.create({
        data: {
          companyId: data.companyId,
          userId: data.userId,
          role: data.role,
          isPrimary: data.isPrimary || false
        },
        include: {
          company: true,
          user: true
        }
      })

      logger.info('CompanyContact created successfully', { contactId: contact.id })
      return new CompanyContact(contact)
    } catch (error) {
      logger.error('Failed to create CompanyContact', { error, data })
      throw error
    }
  }

  static async exists(companyId: string, userId: string): Promise<boolean> {
    try {
      const count = await prisma.companyContact.count({
        where: { 
          companyId,
          userId 
        }
      })

      return count > 0
    } catch (error) {
      logger.error('Failed to check if CompanyContact exists', { error, companyId, userId })
      throw error
    }
  }

  static async deleteByCompanyAndUser(companyId: string, userId: string): Promise<void> {
    try {
      await prisma.companyContact.deleteMany({
        where: { 
          companyId,
          userId 
        }
      })

      logger.info('CompanyContact deleted by company and user', { companyId, userId })
    } catch (error) {
      logger.error('Failed to delete CompanyContact by company and user', { error, companyId, userId })
      throw error
    }
  }
}
