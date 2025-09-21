import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { CompanyValue } from '@prisma/client'

export type CompanyValueData = Omit<CompanyValue, 'createdAt' | 'updatedAt'>
export type CreateCompanyValueData = Omit<CompanyValueData, 'id'>

export class CompanyValueModel {
  constructor(private data: CompanyValueData) {}

  static async findActiveByCompanyId(
    companyId: string,
  ): Promise<CompanyValueData[]> {
    try {
      const values = await prisma.companyValue.findMany({
        where: { companyId, isActive: true },
      })
      return values
    } catch (error) {
      logger.error('Error finding active company values by companyId', {
        error,
        companyId,
      })
      throw new Error('Failed to retrieve active company values.')
    }
  }

  static async countByCompanyId(companyId: string): Promise<number> {
    try {
      return await prisma.companyValue.count({
        where: { companyId, isActive: true },
      })
    } catch (error) {
      logger.error('Error counting company values by companyId', {
        error,
        companyId,
      })
      throw new Error('Failed to count company values.')
    }
  }

  static async create(data: CreateCompanyValueData): Promise<CompanyValueModel> {
    try {
      const value = await prisma.companyValue.create({ data })
      return new CompanyValueModel(value)
    } catch (error) {
      logger.error('Error creating company value', { error, data })
      throw new Error('Failed to create company value.')
    }
  }
}
