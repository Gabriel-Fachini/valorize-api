/**
 * @fileoverview Company Settings Service
 *
 * Business logic for managing company settings, including:
 * - Basic information (name, logo)
 * - Allowed domains for SSO
 * - Coin economy settings
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

export interface CompanySettingsResponse {
  id: string
  name: string
  logo_url: string | null
  domains: string[]
  weekly_renewal_amount: number
  renewal_day: number
  timezone: string
  created_at: string
  updated_at: string
}

export interface UpdateFullSettingsInput {
  name: string
  logo_url?: string | null
  domains: string[]
  weekly_renewal_amount: number
  renewal_day: number
}

export interface UpdateBasicInfoInput {
  name: string
  logo_url?: string | null
}

export interface UpdateCoinEconomyInput {
  weekly_renewal_amount: number
  renewal_day: number
}

/**
 * Normalize domain string (lowercase, trim)
 */
function normalizeDomain(domain: string): string {
  return domain.toLowerCase().trim()
}

/**
 * Remove duplicate domains from array
 */
function uniqueDomains(domains: string[]): string[] {
  return Array.from(new Set(domains.map(normalizeDomain)))
}

/**
 * Format company data with settings and domains
 */
async function formatCompanySettings(companyId: string): Promise<CompanySettingsResponse> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      settings: true,
      allowedDomains: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!company) {
    throw new Error('Company not found')
  }

  // Ensure settings exist
  let settings = company.settings
  if (!settings) {
    logger.info(`Creating default settings for company ${companyId}`)
    settings = await prisma.companySettings.create({
      data: {
        companyId,
        weeklyRenewalAmount: 100,
        renewalDay: 1,
      },
    })
  }

  return {
    id: company.id,
    name: company.name,
    logo_url: company.logoUrl,
    domains: company.allowedDomains.map(d => d.domain),
    weekly_renewal_amount: settings.weeklyRenewalAmount,
    renewal_day: settings.renewalDay,
    timezone: company.timezone,
    created_at: company.createdAt.toISOString(),
    updated_at: company.updatedAt.toISOString(),
  }
}

export const companySettingsService = {
  /**
   * Get company settings by company ID
   */
  async getCompanySettings(companyId: string): Promise<CompanySettingsResponse> {
    logger.info(`Getting company settings for company ${companyId}`)
    return formatCompanySettings(companyId)
  },

  /**
   * Update all company settings (PUT)
   */
  async updateFullSettings(
    companyId: string,
    data: UpdateFullSettingsInput,
  ): Promise<CompanySettingsResponse> {
    logger.info(`Updating full company settings for company ${companyId}`)

    const normalizedDomains = uniqueDomains(data.domains)

    await prisma.$transaction(async (tx) => {
      // Update Company
      await tx.company.update({
        where: { id: companyId },
        data: {
          name: data.name,
          logoUrl: data.logo_url,
        },
      })

      // Update or create CompanySettings
      await tx.companySettings.upsert({
        where: { companyId },
        update: {
          weeklyRenewalAmount: data.weekly_renewal_amount,
          renewalDay: data.renewal_day,
        },
        create: {
          companyId,
          weeklyRenewalAmount: data.weekly_renewal_amount,
          renewalDay: data.renewal_day,
        },
      })

      // Delete all existing allowed domains
      await tx.allowedDomain.deleteMany({
        where: { companyId },
      })

      // Create new allowed domains
      if (normalizedDomains.length > 0) {
        await tx.allowedDomain.createMany({
          data: normalizedDomains.map(domain => ({
            companyId,
            domain,
          })),
        })
      }
    })

    logger.info(`Company settings updated successfully for company ${companyId}`)
    return formatCompanySettings(companyId)
  },

  /**
   * Update basic company information (PATCH)
   */
  async updateBasicInfo(
    companyId: string,
    data: UpdateBasicInfoInput,
  ): Promise<CompanySettingsResponse> {
    logger.info(`Updating basic info for company ${companyId}`)

    await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        logoUrl: data.logo_url,
      },
    })

    logger.info(`Basic info updated successfully for company ${companyId}`)
    return formatCompanySettings(companyId)
  },

  /**
   * Update allowed domains (PATCH)
   */
  async updateDomains(
    companyId: string,
    domains: string[],
  ): Promise<CompanySettingsResponse> {
    logger.info(`Updating domains for company ${companyId}`)

    const normalizedDomains = uniqueDomains(domains)

    await prisma.$transaction(async (tx) => {
      // Delete all existing allowed domains
      await tx.allowedDomain.deleteMany({
        where: { companyId },
      })

      // Create new allowed domains
      await tx.allowedDomain.createMany({
        data: normalizedDomains.map(domain => ({
          companyId,
          domain,
        })),
      })
    })

    logger.info(`Domains updated successfully for company ${companyId}`)
    return formatCompanySettings(companyId)
  },

  /**
   * Update coin economy settings (PATCH)
   */
  async updateCoinEconomy(
    companyId: string,
    data: UpdateCoinEconomyInput,
  ): Promise<CompanySettingsResponse> {
    logger.info(`Updating coin economy for company ${companyId}`)

    await prisma.companySettings.upsert({
      where: { companyId },
      update: {
        weeklyRenewalAmount: data.weekly_renewal_amount,
        renewalDay: data.renewal_day,
      },
      create: {
        companyId,
        weeklyRenewalAmount: data.weekly_renewal_amount,
        renewalDay: data.renewal_day,
      },
    })

    logger.info(`Coin economy updated successfully for company ${companyId}`)
    return formatCompanySettings(companyId)
  },
}
