import { CompanySettingsModel } from './settings.model'
import { UpdateCompanySettingsInput } from './settings.schemas'
import { logger } from '@/lib/logger'

export const companySettingsService = {
  async updateCompanySettings(
    companyId: string,
    data: UpdateCompanySettingsInput,
  ) {
    logger.info(`Updating company settings for company ${companyId}`)
    const updatedSettings = await CompanySettingsModel.upsert(companyId, data)
    logger.info(`Company settings updated successfully for company ${companyId}`)
    return updatedSettings
  },

  async getCompanySettings(companyId: string) {
    logger.info(`Getting company settings for company ${companyId}`)
    let settings = await CompanySettingsModel.findByCompanyId(companyId)

    if (!settings) {
      logger.info(
        `No settings found for company ${companyId}. Creating default settings.`,
      )
      settings = await CompanySettingsModel.upsert(companyId, {})
    }

    logger.info(`Found company settings for company ${companyId}`)
    return settings
  },
}
