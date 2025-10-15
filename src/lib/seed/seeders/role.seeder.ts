/**
 * Role seeder - creates roles with permissions for each company
 */

import { BaseSeeder } from './base.seeder'
import { ROLES_CONFIG } from '../data/roles'
import { DEMO_COMPANIES } from '../data/companies'

export class RoleSeeder extends BaseSeeder {
  protected get name(): string {
    return 'roles'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    let totalRoles = 0
    
    // Create roles for each company
    for (const company of DEMO_COMPANIES) {
      for (const roleConfig of ROLES_CONFIG) {
        // Create role
        const role = await this.prisma.role.upsert({
          where: { 
            name_companyId: { 
              name: roleConfig.name, 
              companyId: company.id, 
            }, 
          },
          update: { description: roleConfig.description },
          create: {
            name: roleConfig.name,
            description: roleConfig.description,
            companyId: company.id,
          },
        })
        
        // Get permissions for this role
        const permissions = await this.prisma.permission.findMany({
          where: { name: { in: roleConfig.permissions } },
        })
        
        // Create role-permission relationships
        for (const permission of permissions) {
          await this.prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id,
            },
          })
        }
        
        this.logInfo(`Created role '${roleConfig.name}' for '${company.name}' with ${permissions.length} permissions`)
        totalRoles++
      }
    }
    
    this.logComplete(totalRoles, 'roles')
  }
}
