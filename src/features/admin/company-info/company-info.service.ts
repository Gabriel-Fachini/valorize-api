/**
 * @fileoverview Company Info Service
 *
 * Business logic for managing basic company information:
 * - Name, logo, timezone, country, status
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

export interface CompanyInfoResponse {
  name: string
  logo_url: string | null
}

export interface UpdateCompanyInfoInput {
  name?: string
  logo_url?: string | null
}

/**
 * Format company basic info for response
 */
function formatCompanyInfo(company: any): CompanyInfoResponse {
  return {
    name: company.name,
    logo_url: company.logoUrl,
  }
}

export const companyInfoService = {
  /**
   * Get basic company information
   */
  async getCompanyInfo(companyId: string): Promise<CompanyInfoResponse> {
    logger.info(`Getting company info for company ${companyId}`)

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        logoUrl: true,
      },
    })

    if (!company) {
      throw new Error('Company not found')
    }

    return formatCompanyInfo(company)
  },

  /**
   * Update basic company information
   */
  async updateCompanyInfo(
    companyId: string,
    data: UpdateCompanyInfoInput,
  ): Promise<void> {
    logger.info(`Updating company info for company ${companyId}`)

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.logo_url !== undefined) {
      // Convert empty string to null for database consistency
      updateData.logoUrl = data.logo_url === '' ? null : data.logo_url
    }

    await prisma.company.update({
      where: { id: companyId },
      data: updateData,
    })

    logger.info(`Company info updated successfully for company ${companyId}`)
  },
}
