import { Company, type CreateCompanyData } from './company.model'
import { CompanyBrazil } from './brazil/company-brazil.model'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/database'
import { ALL_ROLES, ROLE } from '@/features/app/rbac/roles.constants'
import { authService } from '@/features/app/auth/auth.service'
import { User } from '@/features/app/users/user.model'

export interface FirstAdminData {
  name: string
  email: string
}

export interface CreateCompanyRequest extends CreateCompanyData {
  firstAdmin: FirstAdminData
  brazilData?: {
    cnpj: string
    razaoSocial: string
    inscricaoEstadual?: string
    inscricaoMunicipal?: string
    nire?: string
    cnaePrincipal: string
    cnaeSecundario?: string
    naturezaJuridica: string
    porteEmpresa: string
    situacaoCadastral: string
  }
}

export interface CreateCompanyResponse {
  company: Company
  firstAdmin: {
    id: string
    name: string
    email: string
    auth0Id: string
    roles: string[]
  }
  passwordResetUrl: string
}

export const companyService = {
  /**
   * Create default roles for a company
   * Creates all standard roles (Super Admin, Company Admin, HR Manager, Team Lead, Employee)
   * with their respective permissions
   */
  async createDefaultRoles(companyId: string): Promise<void> {
    try {
      logger.info('Creating default roles for company', { companyId })

      for (const roleConfig of ALL_ROLES) {
        // Create role
        const role = await prisma.role.create({
          data: {
            name: roleConfig.name,
            description: roleConfig.description,
            companyId: companyId,
          },
        })

        // Get permissions for this role
        const permissions = await prisma.permission.findMany({
          where: { name: { in: roleConfig.permissions } },
        })

        // Create role-permission relationships
        const rolePermissions = permissions.map(permission => ({
          roleId: role.id,
          permissionId: permission.id,
        }))

        if (rolePermissions.length > 0) {
          await prisma.rolePermission.createMany({
            data: rolePermissions,
            skipDuplicates: true,
          })
        }

        logger.info(`Created role '${roleConfig.name}' with ${permissions.length} permissions`, {
          companyId,
          roleId: role.id,
        })
      }

      logger.info(`Created ${ALL_ROLES.length} default roles for company`, { companyId })
    } catch (error) {
      logger.error('Failed to create default roles', { error, companyId })
      throw new Error('Failed to create default roles for company')
    }
  },

  /**
   * Create first admin user for a company
   * Creates user in Auth0, local database, assigns admin role, and generates password reset ticket
   */
  async createFirstAdmin(
    adminData: FirstAdminData,
    companyId: string,
    companyDomain: string,
  ): Promise<CreateCompanyResponse['firstAdmin'] & { passwordResetUrl: string }> {
    try {
      logger.info('Creating first admin for company', {
        companyId,
        adminEmail: adminData.email,
      })

      // Validate email belongs to company domain
      const emailDomain = adminData.email.split('@')[1]
      if (emailDomain !== companyDomain) {
        throw new Error(`Admin email must belong to company domain ${companyDomain}`)
      }

      // Create user in Auth0
      const { auth0Id, ticketUrl } = await authService.createAdminUser({
        email: adminData.email,
        name: adminData.name,
      })

      // Create user in local database
      const user = await User.create({
        auth0Id: auth0Id,
        email: adminData.email,
        name: adminData.name,
        companyId: companyId,
      })

      const savedUser = await user.save()

      // Find Company Admin role
      const companyAdminRole = await prisma.role.findFirst({
        where: {
          name: ROLE.COMPANY_ADMIN,
          companyId: companyId,
        },
      })

      if (!companyAdminRole) {
        throw new Error('Company Admin role not found')
      }

      // Assign Company Admin role to user
      await prisma.userRole.create({
        data: {
          userId: savedUser.id,
          roleId: companyAdminRole.id,
        },
      })

      // Create wallet with initial balance
      await prisma.wallet.create({
        data: {
          userId: savedUser.id,
          complimentBalance: 100, // Default weekly balance
          redeemableBalance: 0, // Start with zero redeemable balance
        },
      })

      logger.info('First admin created successfully', {
        companyId,
        userId: savedUser.id,
        adminEmail: savedUser.email,
      })

      return {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        auth0Id: savedUser.auth0Id,
        roles: [ROLE.COMPANY_ADMIN],
        passwordResetUrl: ticketUrl,
      }
    } catch (error) {
      logger.error('Failed to create first admin', { error, adminData, companyId })
      throw new Error(`Failed to create first admin: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  /**
   * Create a new company with first admin user
   * Creates company, default roles, first admin, and sets up initial configuration
   */
  async createCompany(data: CreateCompanyRequest): Promise<CreateCompanyResponse> {
    let company: Company | null = null
    let createdRoles = false
    let createdAuth0User = false
    let auth0UserId: string | null = null

    try {
      logger.info('Creating new company with first admin', {
        domain: data.domain,
        adminEmail: data.firstAdmin.email,
      })

      // Validate domain doesn't exist
      const existingCompany = await Company.findByDomain(data.domain)
      if (existingCompany) {
        throw new Error('Domain already exists')
      }

      // Validate CNPJ if Brazil
      if (data.brazilData && data.country === 'BR') {
        if (!CompanyBrazil.validateCNPJStatic(data.brazilData.cnpj)) {
          throw new Error('Invalid CNPJ')
        }

        const existingCompanyBrazil = await CompanyBrazil.findByCNPJ(data.brazilData.cnpj)
        if (existingCompanyBrazil) {
          throw new Error('CNPJ already exists')
        }
      }

      // Step 1: Create company
      company = await Company.create({
        name: data.name,
        domain: data.domain,
        country: data.country,
        timezone: data.timezone,
      })

      logger.info('Company created', { companyId: company.id })

      // Step 2: Create Brazil data if applicable
      if (data.brazilData && data.country === 'BR') {
        await CompanyBrazil.create({
          companyId: company.id,
          ...data.brazilData,
        })
        logger.info('Brazil data created', { companyId: company.id })
      }

      // Step 3: Create default roles
      await this.createDefaultRoles(company.id)
      createdRoles = true
      logger.info('Default roles created', { companyId: company.id })

      // Step 4: Create first admin
      const firstAdmin = await this.createFirstAdmin(
        data.firstAdmin,
        company.id,
        data.domain,
      )
      createdAuth0User = true
      auth0UserId = firstAdmin.auth0Id
      logger.info('First admin created', { companyId: company.id, userId: firstAdmin.id })

      // Reload company with all relations
      const updatedCompany = await Company.findById(company.id)
      if (!updatedCompany) {
        throw new Error('Failed to reload company after creation')
      }

      logger.info('Company creation completed successfully', {
        companyId: company.id,
        adminEmail: firstAdmin.email,
      })

      return {
        company: updatedCompany,
        firstAdmin: {
          id: firstAdmin.id,
          name: firstAdmin.name,
          email: firstAdmin.email,
          auth0Id: firstAdmin.auth0Id,
          roles: firstAdmin.roles,
        },
        passwordResetUrl: firstAdmin.passwordResetUrl,
      }
    } catch (error) {
      logger.error('Failed to create company, initiating rollback', {
        error: error instanceof Error ? error.message : String(error),
        companyId: company?.id,
        createdRoles,
        createdAuth0User,
      })

      // Rollback in reverse order
      try {
        // Delete local user and related data (handled by cascade)
        if (createdAuth0User && company) {
          logger.info('Deleting created users from database', { companyId: company.id })
          await prisma.user.deleteMany({
            where: { companyId: company.id },
          })
        }

        // Note: We don't delete Auth0 users automatically to avoid orphaned accounts
        // Manual cleanup may be required in Auth0 dashboard
        if (createdAuth0User && auth0UserId) {
          logger.warn('Auth0 user created but not automatically deleted - manual cleanup required', {
            auth0UserId,
          })
        }

        // Delete roles and permissions (handled by cascade)
        if (createdRoles && company) {
          logger.info('Deleting created roles', { companyId: company.id })
          await prisma.role.deleteMany({
            where: { companyId: company.id },
          })
        }

        // Delete Brazil data if exists
        if (company) {
          logger.info('Deleting Brazil data if exists', { companyId: company.id })
          await prisma.companyBrazil.deleteMany({
            where: { companyId: company.id },
          })
        }

        // Delete company
        if (company) {
          logger.info('Deleting company', { companyId: company.id })
          await company.delete()
        }

        logger.info('Rollback completed successfully')
      } catch (rollbackError) {
        logger.error('Failed to complete rollback', {
          rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          originalError: error instanceof Error ? error.message : String(error),
        })
      }

      throw error
    }
  },

  /**
   * Listar todas as empresas
   */
  async getAllCompanies(): Promise<Company[]> {
    try {
      return await Company.findAll()
    } catch (error) {
      logger.error('Failed to get all companies', { error })
      throw error
    }
  },

  /**
   * Verificar se domínio existe
   */
  async validateDomain(domain: string): Promise<boolean> {
    try {
      return await Company.exists(domain)
    } catch (error) {
      logger.error('Failed to validate domain', { error, domain })
      throw error
    }
  },
}
