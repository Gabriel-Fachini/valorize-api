import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { CompanySettings } from '@prisma/client'

export type CompanySettingsData = Omit<CompanySettings, 'createdAt' | 'updatedAt'>
export type CreateCompanySettingsData = Omit<CompanySettingsData, 'id'>

export class CompanySettingsModel {
  constructor(private data: CompanySettingsData) {}

  static async findByCompanyId(companyId: string): Promise<CompanySettingsModel | null> {
    try {
      const settings = await prisma.companySettings.findUnique({
        where: { companyId },
      })
      if (!settings) return null
      return new CompanySettingsModel(settings)
    } catch (error) {
      logger.error('Error finding company settings by companyId', {
        error,
        companyId,
      })
      throw new Error('Failed to retrieve company settings.')
    }
  }

  static async upsert(
    companyId: string,
    data: Partial<Omit<CreateCompanySettingsData, 'companyId'>>,
  ): Promise<CompanySettingsModel> {
    try {
      const settings = await prisma.companySettings.upsert({
        where: { companyId },
        update: data,
        create: {
          companyId,
          ...data,
        },
      })
      return new CompanySettingsModel(settings)
    } catch (error) {
      logger.error('Error upserting company settings', { error, data })
      throw new Error('Failed to upsert company settings.')
    }
  }
}
