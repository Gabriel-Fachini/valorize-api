/**
 * Permission seeder
 */

import { BaseSeeder } from './base.seeder'
import { PERMISSIONS } from '../data/permissions'

export class PermissionSeeder extends BaseSeeder {
  protected get name(): string {
    return 'permissions'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    for (const permission of PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { name: permission.name },
        update: { description: permission.description },
        create: permission,
      })
    }
    
    this.logComplete(PERMISSIONS.length, 'permissions')
  }
}
