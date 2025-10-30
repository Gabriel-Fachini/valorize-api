import { BaseSeeder } from './base.seeder'
import { DEMO_COMPANY_JOB_TITLES } from '../data/job_titles'

export class JobTitleSeeder extends BaseSeeder {
  protected get name(): string {
    return 'job titles'
  }

  async seed(): Promise<void> {
    this.logStart()

    let created = 0

    for (const company of DEMO_COMPANY_JOB_TITLES) {
      const jobTitlesData = company.titles.map((title: string) => ({
        companyId: company.companyId,
        name: title,
      }))
      const result = await this.prisma.jobTitle.createMany({
        data: jobTitlesData,
        skipDuplicates: true,
      })
      created += result.count
      this.logInfo(`Created ${result.count} job titles for company ${company.companyId}`)
    }

    this.logComplete(created, 'job titles')
  }
}
