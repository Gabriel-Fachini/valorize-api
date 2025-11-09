/**
 * User seeder - creates users and assigns roles
 * Uses UserFactory to generate realistic Brazilian users with Pareto distribution
 */

import { BaseSeeder } from './base.seeder'
import { UserFactory } from '../factories/user.factory'
import { REALISTIC_VOLUMES } from '../config/realistic-volumes'
import { DEMO_USERS } from '../data/users'

export class UserSeeder extends BaseSeeder {
  protected get name(): string {
    return 'users'
  }

  async seed(): Promise<void> {
    this.logStart()

    // Get all companies
    const companies = await this.prisma.company.findMany()
    const valorizeCompany = companies.find(c => c.name === 'Valorize Corp')
    const techstartCompany = companies.find(c => c.name === 'TechStart Brasil')
    const globalCompany = companies.find(c => c.name === 'Global Solutions Inc')

    if (!valorizeCompany || !techstartCompany || !globalCompany) {
      throw new Error('Required companies not found')
    }

    // Get department and job title IDs for each company
    const valorizeDeptsAndJobs = await this.getDepartmentsAndJobTitles(valorizeCompany.id)
    const techstartDeptsAndJobs = await this.getDepartmentsAndJobTitles(techstartCompany.id)
    const globalDeptsAndJobs = await this.getDepartmentsAndJobTitles(globalCompany.id)

    // ============================================================================
    // BATCH 1: Create seed users from hardcoded data (maintain backward compatibility)
    // ============================================================================
    await this.seedHardcodedUsers(DEMO_USERS)

    // ============================================================================
    // BATCH 2: Generate factory users for realistic economy
    // ============================================================================
    await this.seedFactoryUsers(
      valorizeCompany,
      valorizeDeptsAndJobs,
      'valorize.com.br',
      REALISTIC_VOLUMES.users.valorize
    )

    await this.seedFactoryUsers(
      techstartCompany,
      techstartDeptsAndJobs,
      'techstart.com.br',
      REALISTIC_VOLUMES.users.techstart
    )

    await this.seedFactoryUsers(
      globalCompany,
      globalDeptsAndJobs,
      'globalsolutions.com',
      REALISTIC_VOLUMES.users.global
    )

    // Count total users created
    const totalUsers = await this.prisma.user.count()
    this.logComplete(totalUsers, 'users')
  }

  private async getDepartmentsAndJobTitles(companyId: string) {
    const departments = await this.prisma.department.findMany({
      where: { companyId },
    })
    const jobTitles = await this.prisma.jobTitle.findMany({
      where: { companyId },
    })
    return { departments, jobTitles }
  }

  private async seedHardcodedUsers(demoUsers: typeof DEMO_USERS): Promise<void> {
    for (const userData of demoUsers) {
      let jobTitleRecord = null
      let departmentRecord = null

      if (userData.jobTitleName) {
        jobTitleRecord = await this.prisma.jobTitle.findFirst({
          where: { companyId: userData.companyId, name: userData.jobTitleName },
        })
      }

      if (userData.departmentName) {
        departmentRecord = await this.prisma.department.findFirst({
          where: { companyId: userData.companyId, name: userData.departmentName },
        })
      }

      const user = await this.prisma.user.upsert({
        where: { auth0Id: userData.auth0Id },
        update: {
          email: userData.email,
          name: userData.name,
          avatar: userData.avatarUrl ?? null,
          companyId: userData.companyId,
          jobTitleId: jobTitleRecord?.id ?? null,
          departmentId: departmentRecord?.id ?? null,
        },
        create: {
          auth0Id: userData.auth0Id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatarUrl ?? undefined,
          companyId: userData.companyId,
          jobTitleId: jobTitleRecord ? jobTitleRecord.id : undefined,
          departmentId: departmentRecord?.id ?? null,
        },
      })

      const roles = await this.prisma.role.findMany({
        where: {
          name: { in: userData.roles },
          companyId: userData.companyId,
        },
      })

      for (const role of roles) {
        await this.prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: role.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            roleId: role.id,
          },
        })
      }

      this.logInfo(
        `Created user '${userData.name}' with roles: ${userData.roles.join(', ')}`
        + (userData.jobTitleName ? `, jobTitle: ${userData.jobTitleName}` : '')
        + (userData.departmentName ? `, department: ${userData.departmentName}` : '')
      )
    }
  }

  private async seedFactoryUsers(
    company: { id: string; name: string },
    deptsAndJobs: { departments: any[]; jobTitles: any[] },
    emailDomain: string,
    count: number
  ): Promise<void> {
    // Generate realistic users using factory
    const generatedUsers = UserFactory.generateBulkUsers({
      count,
      emailDomain,
      companyId: company.id,
      departmentIds: deptsAndJobs.departments.map(d => d.id),
      jobTitleIds: deptsAndJobs.jobTitles.map(j => j.id),
      generateAvatars: false, // Skip avatars for performance
      distribution: 'pareto',
    })

    // Get employee role for this company
    const employeeRole = await this.prisma.role.findFirst({
      where: { companyId: company.id, name: 'Empregado' },
    })

    if (!employeeRole) {
      this.logWarning(`No 'Empregado' role found for company ${company.name}`)
      return
    }

    // Batch create users
    const usersToCreate = generatedUsers.map(u => ({
      auth0Id: u.auth0Id,
      email: u.email,
      name: u.name,
      companyId: company.id,
      departmentId: u.departmentId || null,
      jobTitleId: u.jobTitleId || null,
      avatar: u.avatarUrl || null,
    }))

    const createdUsers = await this.prisma.user.createMany({
      data: usersToCreate,
      skipDuplicates: true,
    })

    // Get the created users to assign roles
    const users = await this.prisma.user.findMany({
      where: {
        auth0Id: { in: generatedUsers.map(u => u.auth0Id) },
      },
    })

    // Batch create user-role relationships
    const userRolesToCreate = users.map(u => ({
      userId: u.id,
      roleId: employeeRole.id,
    }))

    await this.prisma.userRole.createMany({
      data: userRolesToCreate,
      skipDuplicates: true,
    })

    this.logInfo(`Generated ${users.length} realistic users for ${company.name}`)
  }
}
