import { CompanyValueModel } from './values.model'
import { CreateCompanyValueInput } from './values.schemas'
import { logger } from '@/lib/logger'

const MAX_COMPANY_VALUES = 8

export const companyValuesService = {
  async createCompanyValue(companyId: string, data: CreateCompanyValueInput) {
    logger.info(`Creating company value for company ${companyId}`)

    const activeValuesCount = await CompanyValueModel.countByCompanyId(companyId)

    if (activeValuesCount >= MAX_COMPANY_VALUES) {
      throw new Error(
        `Company cannot have more than ${MAX_COMPANY_VALUES} active values.`,
      )
    }

    const newCompanyValue = await CompanyValueModel.create({
      ...data,
      companyId,
      isActive: true,
    })
    logger.info(`Company value created successfully for company ${companyId}`)
    return newCompanyValue
  },

  async listCompanyValues(companyId: string) {
    logger.info(`Listing company values for company ${companyId}`)
    const companyValues = await CompanyValueModel.findActiveByCompanyId(
      companyId,
    )
    logger.info(
      `Found ${companyValues.length} company values for company ${companyId}`,
    )
    return companyValues
  },
}
