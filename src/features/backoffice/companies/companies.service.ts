import { BackofficeCompany } from './companies.model'
import { auditLogger, AuditAction, AuditEntityType } from '@/lib/audit-logger'
import prisma from '@/lib/database'
import type {
  CompanyFilters,
  PaginationParams,
  SortingParams,
  PaginatedResult,
  CompanyListItem,
  CompanyDetails,
  CreateCompanyInput,
  UpdateCompanyInput,
  AddWalletCreditsInput,
  RemoveWalletCreditsInput,
  UpdateCompanyPlanInput,
  AddCompanyContactInput,
  UpdateCompanyContactInput,
  AddAllowedDomainInput,
  MetricsQueryParams,
} from './companies.types'
import type { PlanType } from '@prisma/client'

/**
 * Backoffice Company Service
 * Business logic for client management (cross-company operations)
 */
export const backofficeCompanyService = {
  /**
   * List companies with filters, pagination and sorting
   */
  async listCompanies(
    filters: CompanyFilters,
    pagination: PaginationParams,
    sorting: SortingParams
  ): Promise<PaginatedResult<CompanyListItem>> {
    const { companies, total } = await BackofficeCompany.findWithFilters(
      filters,
      pagination,
      sorting
    )

    // Get aggregations (company counts by status)
    const statusCounts = await BackofficeCompany.countByStatus()
    const totalMRR = await BackofficeCompany.calculateTotalMRR()

    return {
      data: companies,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
      aggregations: {
        totalCompanies: total,
        activeCompanies: statusCounts.active,
        inactiveCompanies: statusCounts.inactive,
        totalMRR,
      },
    }
  },

  /**
   * Get full company details
   */
  async getCompanyDetails(
    companyId: string
  ): Promise<CompanyDetails | null> {
    const company = await BackofficeCompany.findByIdWithDetails(companyId)

    if (!company) {
      return null
    }

    // Get wallet status
    const wallet = await BackofficeCompany.getWalletStatus(companyId)

    // Get metrics
    const metrics = await BackofficeCompany.getMetrics(companyId)

    // Get billing info
    const billing = await BackofficeCompany.getBillingInfo(companyId)

    // Extract first active plan (Prisma returns array for one-to-many relations)
    const activePlan = company.plans[0] || null

    // Return only the fields that match CompanyDetails interface
    // Exclude 'users' and 'values' which are only used for calculations
    return {
      id: company.id,
      name: company.name,
      domain: company.domain,
      country: company.country,
      timezone: company.timezone,
      logoUrl: company.logoUrl,
      billingEmail: company.billingEmail,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      companyBrazil: company.companyBrazil || undefined,
      contacts: company.contacts,
      settings: company.settings || undefined,
      allowedDomains: company.allowedDomains,
      wallet,
      plan: activePlan,
      metrics,
      billing: billing!,
    }
  },

  /**
   * Create new company (full wizard)
   */
  async createCompany(
    input: CreateCompanyInput,
    createdBy: string
  ): Promise<{ id: string }> {
    // Validate domain uniqueness
    const domainTaken = await BackofficeCompany.isDomainTaken(input.domain)
    if (domainTaken) {
      throw new Error('Domain already in use')
    }

    // Validate CNPJ uniqueness (Brazil only)
    if (input.country === 'BR' && input.companyBrazil) {
      const cnpjTaken = await BackofficeCompany.isCNPJTaken(
        input.companyBrazil.cnpj
      )
      if (cnpjTaken) {
        throw new Error('CNPJ already in use')
      }
    }

    // Validate minimum 2 initial values
    if (!input.initialValues || input.initialValues.length < 2) {
      throw new Error('At least 2 initial company values are required')
    }

    // Get default plan pricing
    const defaultPricing = {
      ESSENTIAL: 14.0, // R$14/user/month
      PROFESSIONAL: 18.0, // R$18/user/month
    }

    const pricePerUser =
      input.plan.pricePerUser || defaultPricing[input.plan.planType]

    // Create company with all related entities in a transaction
    const company = await prisma.$transaction(async (tx) => {
      // 1. Create company
      const newCompany = await tx.company.create({
        data: {
          name: input.name,
          domain: input.domain,
          country: input.country,
          timezone: input.timezone,
          logoUrl: input.logoUrl,
          billingEmail: input.billingEmail,
          isActive: true,
        },
      })

      // 2. Create Brazil-specific data (if applicable)
      if (input.country === 'BR' && input.companyBrazil) {
        await tx.companyBrazil.create({
          data: {
            companyId: newCompany.id,
            ...input.companyBrazil,
          },
        })
      }

      // 3. Create contacts (skipped in creation - contacts are managed separately via dedicated endpoints)
      // Contacts must be existing users and are added after company creation

      // 4. Create plan
      await tx.companyPlan.create({
        data: {
          companyId: newCompany.id,
          planType: input.plan.planType,
          pricePerUser,
          startDate: new Date(input.plan.startDate),
          isActive: true,
        },
      })

      // 5. Create company values (minimum 2)
      await tx.companyValue.createMany({
        data: input.initialValues.map((value, index) => ({
          companyId: newCompany.id,
          ...value,
          order: index,
          isActive: true,
        })),
      })

      // 6. Create wallet
      const wallet = await tx.companyWallet.create({
        data: {
          companyId: newCompany.id,
          balance: input.initialWalletBudget || 0,
          totalDeposited: input.initialWalletBudget || 0,
          totalSpent: 0,
          overdraftLimit: 0,
          isFrozen: false,
        },
      })

      // 7. Create initial deposit record (if budget provided)
      if (input.initialWalletBudget && input.initialWalletBudget > 0) {
        await tx.walletDeposit.create({
          data: {
            companyWalletId: wallet.id,
            amount: input.initialWalletBudget,
            notes: 'Initial company setup',
            createdBy: createdBy,
          },
        })
      }

      // 8. Create company settings
      await tx.companySettings.create({
        data: {
          companyId: newCompany.id,
          weeklyRenewalAmount: 100, // Default
          renewalDay: 1, // Monday
        },
      })

      return newCompany
    })

    // Audit log
    await auditLogger.log({
      userId: createdBy,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.COMPANY,
      entityId: company.id,
      metadata: {
        companyName: input.name,
        domain: input.domain,
        country: input.country,
        planType: input.plan.planType,
        initialBudget: input.initialWalletBudget || 0,
      },
    })

    return { id: company.id }
  },

  /**
   * Update company basic information
   */
  async updateCompany(
    companyId: string,
    input: UpdateCompanyInput,
    updatedBy: string
  ): Promise<void> {
    // Get current company data
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { companyBrazil: true },
    })

    if (!company) {
      throw new Error('Company not found')
    }

    // Validate domain uniqueness (if changing)
    if (input.domain && input.domain !== company.domain) {
      const domainTaken = await BackofficeCompany.isDomainTaken(
        input.domain,
        companyId
      )
      if (domainTaken) {
        throw new Error('Domain already in use')
      }
    }

    // Validate CNPJ uniqueness (if changing)
    if (input.companyBrazil?.cnpj) {
      const currentCNPJ = company.companyBrazil?.cnpj
      if (input.companyBrazil.cnpj !== currentCNPJ) {
        const cnpjTaken = await BackofficeCompany.isCNPJTaken(
          input.companyBrazil.cnpj,
          companyId
        )
        if (cnpjTaken) {
          throw new Error('CNPJ already in use')
        }
      }
    }

    // Update company in transaction
    await prisma.$transaction(async (tx) => {
      // Update company basic data
      const { companyBrazil: _, ...companyData } = input
      if (Object.keys(companyData).length > 0) {
        await tx.company.update({
          where: { id: companyId },
          data: companyData,
        })
      }

      // Update Brazil-specific data
      if (input.companyBrazil && company.country === 'BR') {
        if (company.companyBrazil) {
          await tx.companyBrazil.update({
            where: { companyId },
            data: input.companyBrazil,
          })
        } else {
          await tx.companyBrazil.create({
            data: {
              companyId,
              ...input.companyBrazil,
              cnpj: input.companyBrazil.cnpj || '',
              razaoSocial: input.companyBrazil.razaoSocial || '',
              cnaePrincipal: input.companyBrazil.cnaePrincipal || '',
              naturezaJuridica: input.companyBrazil.naturezaJuridica || '',
              porteEmpresa: input.companyBrazil.porteEmpresa || '',
              situacaoCadastral: input.companyBrazil.situacaoCadastral || '',
            },
          })
        }
      }
    })

    // Build audit changelog
    const changes = auditLogger.buildChanges(company, input, [
      'name',
      'domain',
      'logoUrl',
      'country',
      'timezone',
      'billingEmail',
    ])

    // Add Brazil-specific changes
    if (input.companyBrazil && company.companyBrazil) {
      const brazilChanges = auditLogger.buildChanges(
        company.companyBrazil,
        input.companyBrazil,
        [
          'cnpj',
          'razaoSocial',
          'inscricaoEstadual',
          'inscricaoMunicipal',
          'nire',
          'cnaePrincipal',
          'cnaeSecundario',
          'naturezaJuridica',
          'porteEmpresa',
          'situacaoCadastral',
        ]
      )
      Object.assign(changes, brazilChanges)
    }

    // Audit log
    await auditLogger.log({
      userId: updatedBy,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.COMPANY,
      entityId: companyId,
      changes,
    })
  },

  /**
   * Activate company (restore access)
   */
  async activateCompany(companyId: string, activatedBy: string): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new Error('Company not found')
    }

    if (company.isActive) {
      throw new Error('Company is already active')
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { isActive: true },
    })

    // Audit log
    await auditLogger.log({
      userId: activatedBy,
      action: AuditAction.ACTIVATE,
      entityType: AuditEntityType.COMPANY,
      entityId: companyId,
      metadata: {
        companyName: company.name,
      },
    })
  },

  /**
   * Deactivate company (block login, freeze wallet)
   */
  async deactivateCompany(
    companyId: string,
    deactivatedBy: string
  ): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new Error('Company not found')
    }

    if (!company.isActive) {
      throw new Error('Company is already inactive')
    }

    // Deactivate company and freeze wallet in transaction
    await prisma.$transaction(async (tx) => {
      // Deactivate company
      await tx.company.update({
        where: { id: companyId },
        data: { isActive: false },
      })

      // Freeze wallet
      await tx.companyWallet.update({
        where: { companyId },
        data: { isFrozen: true },
      })
    })

    // Audit logs
    await auditLogger.log({
      userId: deactivatedBy,
      action: AuditAction.DEACTIVATE,
      entityType: AuditEntityType.COMPANY,
      entityId: companyId,
      metadata: {
        companyName: company.name,
      },
    })

    await auditLogger.log({
      userId: deactivatedBy,
      action: AuditAction.WALLET_FREEZE,
      entityType: AuditEntityType.COMPANY_WALLET,
      entityId: companyId,
      metadata: {
        reason: 'Company deactivated',
      },
    })
  },

  /**
   * Add credits to company wallet
   */
  async addWalletCredits(
    companyId: string,
    input: AddWalletCreditsInput,
    addedBy: string
  ): Promise<void> {
    if (input.amount <= 0) {
      throw new Error('Amount must be greater than 0')
    }

    const wallet = await prisma.companyWallet.findUnique({
      where: { companyId },
    })

    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const oldBalance = Number(wallet.balance)
    const newBalance = oldBalance + input.amount

    await prisma.$transaction(async (tx) => {
      // Update wallet
      await tx.companyWallet.update({
        where: { companyId },
        data: {
          balance: { increment: input.amount },
          totalDeposited: { increment: input.amount },
        },
      })

      // Create deposit record
      await tx.walletDeposit.create({
        data: {
          companyWalletId: wallet.id,
          amount: input.amount,
          notes: input.reason,
          createdBy: addedBy,
        },
      })
    })

    // Audit log
    await auditLogger.log({
      userId: addedBy,
      action: AuditAction.WALLET_CREDIT,
      entityType: AuditEntityType.COMPANY_WALLET,
      entityId: companyId,
      changes: {
        balance: { before: oldBalance, after: newBalance },
      },
      metadata: {
        amount: input.amount,
        reason: input.reason,
      },
    })
  },

  /**
   * Remove credits from company wallet
   */
  async removeWalletCredits(
    companyId: string,
    input: RemoveWalletCreditsInput,
    removedBy: string
  ): Promise<void> {
    if (input.amount <= 0) {
      throw new Error('Amount must be greater than 0')
    }

    const wallet = await prisma.companyWallet.findUnique({
      where: { companyId },
    })

    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const oldBalance = Number(wallet.balance)
    const newBalance = oldBalance - input.amount

    if (newBalance < 0) {
      throw new Error('Insufficient balance')
    }

    await prisma.companyWallet.update({
      where: { companyId },
      data: {
        balance: { decrement: input.amount },
        totalSpent: { increment: input.amount },
      },
    })

    // Audit log
    await auditLogger.log({
      userId: removedBy,
      action: AuditAction.WALLET_DEBIT,
      entityType: AuditEntityType.COMPANY_WALLET,
      entityId: companyId,
      changes: {
        balance: { before: oldBalance, after: newBalance },
      },
      metadata: {
        amount: input.amount,
        reason: input.reason,
      },
    })
  },

  /**
   * Freeze company wallet
   */
  async freezeWallet(companyId: string, frozenBy: string): Promise<void> {
    await prisma.companyWallet.update({
      where: { companyId },
      data: { isFrozen: true },
    })

    // Audit log
    await auditLogger.log({
      userId: frozenBy,
      action: AuditAction.WALLET_FREEZE,
      entityType: AuditEntityType.COMPANY_WALLET,
      entityId: companyId,
    })
  },

  /**
   * Unfreeze company wallet
   */
  async unfreezeWallet(companyId: string, unfrozenBy: string): Promise<void> {
    await prisma.companyWallet.update({
      where: { companyId },
      data: { isFrozen: false },
    })

    // Audit log
    await auditLogger.log({
      userId: unfrozenBy,
      action: AuditAction.WALLET_UNFREEZE,
      entityType: AuditEntityType.COMPANY_WALLET,
      entityId: companyId,
    })
  },

  /**
   * Get company current plan
   */
  async getPlan(companyId: string) {
    const plan = await prisma.companyPlan.findFirst({
      where: {
        companyId,
        isActive: true,
      },
    })

    if (!plan) {
      throw new Error('Company has no active plan')
    }

    return {
      id: plan.id,
      planType: plan.planType,
      pricePerUser: Number(plan.pricePerUser),
      startDate: plan.startDate,
      endDate: plan.endDate,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }
  },

  /**
   * Update company plan
   */
  async updatePlan(
    companyId: string,
    input: UpdateCompanyPlanInput,
    updatedBy: string
  ): Promise<void> {
    // Get default pricing if not provided
    const defaultPricing: Record<PlanType, number> = {
      ESSENTIAL: 14.0,
      PROFESSIONAL: 18.0,
    }

    const pricePerUser = input.pricePerUser || defaultPricing[input.planType]

    // Get current active plan
    const currentPlan = await prisma.companyPlan.findFirst({
      where: {
        companyId,
        isActive: true,
      },
    })

    await prisma.$transaction(async (tx) => {
      // Deactivate current plan
      if (currentPlan) {
        await tx.companyPlan.update({
          where: { id: currentPlan.id },
          data: {
            isActive: false,
            endDate: new Date(),
          },
        })
      }

      // Create new plan
      await tx.companyPlan.create({
        data: {
          companyId,
          planType: input.planType,
          pricePerUser,
          startDate: input.startDate ? new Date(input.startDate) : new Date(),
          isActive: true,
        },
      })
    })

    // Audit log
    await auditLogger.log({
      userId: updatedBy,
      action: AuditAction.PLAN_CHANGE,
      entityType: AuditEntityType.COMPANY_PLAN,
      entityId: companyId,
      changes: {
        planType: {
          before: currentPlan?.planType || null,
          after: input.planType,
        },
        pricePerUser: {
          before: currentPlan ? Number(currentPlan.pricePerUser) : null,
          after: pricePerUser,
        },
      },
    })
  },

  /**
   * Add company contact (link existing user to company as contact)
   */
  async addContact(
    companyId: string,
    input: AddCompanyContactInput,
    addedBy: string
  ): Promise<{ id: string }> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if contact already exists
    const existing = await prisma.companyContact.findFirst({
      where: {
        companyId,
        userId: input.userId,
      },
    })

    if (existing) {
      throw new Error('This user is already a contact for this company')
    }

    const contact = await prisma.companyContact.create({
      data: {
        companyId,
        userId: input.userId,
        role: input.role,
        isPrimary: false, // New contacts are not primary by default
      },
    })

    // Audit log
    await auditLogger.log({
      userId: addedBy,
      action: AuditAction.CONTACT_ADD,
      entityType: AuditEntityType.COMPANY_CONTACT,
      entityId: contact.id,
      metadata: {
        companyId,
        userId: input.userId,
        role: input.role,
        userName: user.name,
        userEmail: user.email,
      },
    })

    return { id: contact.id }
  },

  /**
   * Update company contact
   */
  async updateContact(
    contactId: string,
    input: UpdateCompanyContactInput,
    updatedBy: string
  ): Promise<void> {
    const contact = await prisma.companyContact.findUnique({
      where: { id: contactId },
    })

    if (!contact) {
      throw new Error('Contact not found')
    }

    // Track changes in history
    const changes = auditLogger.buildChanges(contact, input, [
      'role',
      'isPrimary',
    ])

    await prisma.$transaction(async (tx) => {
      // Update contact
      await tx.companyContact.update({
        where: { id: contactId },
        data: input,
      })

      // Create history records for each changed field
      for (const [field, change] of Object.entries(changes)) {
        await tx.companyContactHistory.create({
          data: {
            contactId,
            field,
            oldValue: String(change.before),
            newValue: String(change.after),
            changedBy: updatedBy,
          },
        })
      }
    })

    // Audit log
    await auditLogger.log({
      userId: updatedBy,
      action: AuditAction.CONTACT_UPDATE,
      entityType: AuditEntityType.COMPANY_CONTACT,
      entityId: contactId,
      changes,
    })
  },

  /**
   * Delete company contact (unlink user from company)
   */
  async deleteContact(contactId: string, deletedBy: string): Promise<void> {
    const contact = await prisma.companyContact.findUnique({
      where: { id: contactId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!contact) {
      throw new Error('Contact not found')
    }

    await prisma.companyContact.delete({
      where: { id: contactId },
    })

    // Audit log
    await auditLogger.log({
      userId: deletedBy,
      action: AuditAction.CONTACT_DELETE,
      entityType: AuditEntityType.COMPANY_CONTACT,
      entityId: contactId,
      metadata: {
        companyId: contact.companyId,
        userId: contact.userId,
        role: contact.role,
        userName: contact.user.name,
        userEmail: contact.user.email,
      },
    })
  },

  /**
   * Add allowed domain for SSO
   */
  async addAllowedDomain(
    companyId: string,
    input: AddAllowedDomainInput,
    addedBy: string
  ): Promise<{ id: string }> {
    // Check if domain already exists
    const existing = await prisma.allowedDomain.findFirst({
      where: {
        companyId,
        domain: input.domain,
      },
    })

    if (existing) {
      throw new Error('Domain already added to this company')
    }

    const allowedDomain = await prisma.allowedDomain.create({
      data: {
        companyId,
        domain: input.domain,
      },
    })

    // Audit log
    await auditLogger.log({
      userId: addedBy,
      action: AuditAction.DOMAIN_ADD,
      entityType: AuditEntityType.ALLOWED_DOMAIN,
      entityId: allowedDomain.id,
      metadata: {
        companyId,
        domain: input.domain,
      },
    })

    return { id: allowedDomain.id }
  },

  /**
   * Delete allowed domain
   */
  async deleteAllowedDomain(
    domainId: string,
    deletedBy: string
  ): Promise<void> {
    const allowedDomain = await prisma.allowedDomain.findUnique({
      where: { id: domainId },
    })

    if (!allowedDomain) {
      throw new Error('Domain not found')
    }

    await prisma.allowedDomain.delete({
      where: { id: domainId },
    })

    // Audit log
    await auditLogger.log({
      userId: deletedBy,
      action: AuditAction.DOMAIN_DELETE,
      entityType: AuditEntityType.ALLOWED_DOMAIN,
      entityId: domainId,
      metadata: {
        companyId: allowedDomain.companyId,
        domain: allowedDomain.domain,
      },
    })
  },

  /**
   * Get company metrics
   */
  async getMetrics(companyId: string, params: MetricsQueryParams) {
    return BackofficeCompany.getMetrics(
      companyId,
      params.startDate,
      params.endDate
    )
  },

  /**
   * Get wallet status
   */
  async getWalletStatus(companyId: string) {
    return BackofficeCompany.getWalletStatus(companyId)
  },

  /**
   * Get billing information
   */
  async getBillingInfo(companyId: string) {
    return BackofficeCompany.getBillingInfo(companyId)
  },
}
