import { BaseSeeder } from './base.seeder'
import { DEMO_COMPANY_DEPARTMENTS } from '../data/departments'

export class DepartmentSeeder extends BaseSeeder {
  protected get name(): string {
    return 'departments'
  }

  async seed(): Promise<void> {
    this.logStart()

    let created = 0

    for (const company of DEMO_COMPANY_DEPARTMENTS) {
      const departmentsData = company.departments.map((deptName: string) => ({
        companyId: company.companyId,
        name: deptName,
      }))
      const result = await this.prisma.department.createMany({
        data: departmentsData,
        skipDuplicates: true,
      })
      created += result.count
      this.logInfo(`Created ${departmentsData.length} departments for company ${company.companyId}`)
    }

    this.logComplete(created, 'departments')
  }
}
