/**
 * @fileoverview Company Domains Service
 *
 * Business logic for managing allowed domains for SSO:
 * - List, add, replace, and remove domains
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

export interface DomainResponse {
  id: string
  domain: string
  created_at: string
}

export interface AddDomainInput {
  domain: string
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
 * Format domain for response
 */
function formatDomain(domain: any): DomainResponse {
  return {
    id: domain.id,
    domain: domain.domain,
    created_at: domain.createdAt.toISOString(),
  }
}

export const companyDomainsService = {
  /**
   * List all allowed domains for a company
   */
  async listDomains(companyId: string): Promise<DomainResponse[]> {
    logger.info(`Listing domains for company ${companyId}`)

    const domains = await prisma.allowedDomain.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    })

    return domains.map(formatDomain)
  },

  /**
   * Replace all domains for a company (PUT operation)
   */
  async replaceDomains(companyId: string, domains: string[]): Promise<DomainResponse[]> {
    logger.info(`Replacing domains for company ${companyId}`)

    const normalizedDomains = uniqueDomains(domains)

    if (normalizedDomains.length === 0) {
      throw new Error('At least one domain is required')
    }

    await prisma.$transaction(async (tx) => {
      // Delete all existing domains
      await tx.allowedDomain.deleteMany({
        where: { companyId },
      })

      // Create new domains
      await tx.allowedDomain.createMany({
        data: normalizedDomains.map(domain => ({
          companyId,
          domain,
        })),
      })
    })

    logger.info(`Domains replaced successfully for company ${companyId}`)
    return this.listDomains(companyId)
  },

  /**
   * Add a single domain to a company
   */
  async addDomain(companyId: string, data: AddDomainInput): Promise<DomainResponse> {
    logger.info(`Adding domain for company ${companyId}`, { domain: data.domain })

    const normalizedDomain = normalizeDomain(data.domain)

    // Check if domain already exists
    const existingDomain = await prisma.allowedDomain.findFirst({
      where: {
        companyId,
        domain: normalizedDomain,
      },
    })

    if (existingDomain) {
      throw new Error('Domain already exists for this company')
    }

    const domain = await prisma.allowedDomain.create({
      data: {
        companyId,
        domain: normalizedDomain,
      },
    })

    logger.info(`Domain added successfully`, { domainId: domain.id })
    return formatDomain(domain)
  },

  /**
   * Remove a specific domain by ID
   */
  async removeDomain(companyId: string, domainId: string): Promise<void> {
    logger.info(`Removing domain ${domainId} for company ${companyId}`)

    // Verify domain exists and belongs to company
    const domain = await prisma.allowedDomain.findFirst({
      where: {
        id: domainId,
        companyId,
      },
    })

    if (!domain) {
      throw new Error('Domain not found')
    }

    // Check if it's the last domain
    const totalDomains = await prisma.allowedDomain.count({
      where: { companyId },
    })

    if (totalDomains === 1) {
      throw new Error('Cannot remove the last domain. At least one domain is required.')
    }

    await prisma.allowedDomain.delete({
      where: { id: domainId },
    })

    logger.info(`Domain removed successfully`, { domainId })
  },
}
