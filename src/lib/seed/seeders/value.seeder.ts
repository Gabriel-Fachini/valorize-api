/**
 * Company value seeder
 */

import { BaseSeeder } from './base.seeder'
import { DEMO_COMPANY_VALUES } from '../data/values'

export class ValueSeeder extends BaseSeeder {
  protected get name(): string {
    return 'company values'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    let totalValues = 0

    for (const companyValues of DEMO_COMPANY_VALUES) {
      let orderIndex = 1
      for (const value of companyValues.values) {
        await this.prisma.companyValue.create({
          data: {
            companyId: companyValues.companyId,
            title: value.title,
            description: value.description,
            example: null,
            iconName: value.iconName,
            iconColor: value.iconColor || null,
            order: orderIndex,
            isActive: value.isActive,
          },
        })
        totalValues++
        orderIndex++
      }
      
      const company = await this.prisma.company.findUnique({
        where: { id: companyValues.companyId },
      })
      this.logInfo(`Created ${companyValues.values.length} values for '${company?.name}'`)
    }
    
    this.logComplete(totalValues, 'company values')
  }
}
