/**
 * @fileoverview Company Info Service
 *
 * Business logic for managing basic company information:
 * - Name, logo, timezone, country, status
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

export interface CompanyInfoResponse {
  id: string
  name: string
  logo_url: string | null
  country: string
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
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
    id: company.id,
    name: company.name,
    logo_url: company.logoUrl,
    country: company.country,
    timezone: company.timezone,
    is_active: company.isActive,
    created_at: company.createdAt.toISOString(),
    updated_at: company.updatedAt.toISOString(),
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
        id: true,
        name: true,
        logoUrl: true,
        country: true,
        timezone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
  ): Promise<CompanyInfoResponse> {
    logger.info(`Updating company info for company ${companyId}`)

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.logo_url !== undefined) updateData.logoUrl = data.logo_url

    const company = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        logoUrl: true,
        country: true,
        timezone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    logger.info(`Company info updated successfully for company ${companyId}`)
    return formatCompanyInfo(company)
  },
}
