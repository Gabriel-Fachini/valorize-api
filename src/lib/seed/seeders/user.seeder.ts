/**
 * User seeder - creates users and assigns roles
 */

import { BaseSeeder } from './base.seeder'
import { DEMO_USERS } from '../data/users'

export class UserSeeder extends BaseSeeder {
  protected get name(): string {
    return 'users'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    for (const userData of DEMO_USERS) {
      // Resolve jobTitle and department IDs (if provided)
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

      // Create or update user with optional jobTitleId and departmentId
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
      
      // Get roles for this user (from the same company)
      const roles = await this.prisma.role.findMany({
        where: { 
          name: { in: userData.roles },
          companyId: userData.companyId,
        },
      })
      
      // Create user-role relationships
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
        + (userData.departmentName ? `, department: ${userData.departmentName}` : ''),
      )
    }
    
    this.logComplete(DEMO_USERS.length, 'users')
  }
}
