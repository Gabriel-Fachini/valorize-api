import { JobTitle, type JobTitleWithCount } from './job-title.model'
import { logger } from '@/lib/logger'

export const jobTitleService = {
  /**
   * Get all job titles for a company with user counts
   */
  async getJobTitlesByCompany(companyId: string): Promise<JobTitleWithCount[]> {
    try {
      logger.info('Fetching job titles for company', { companyId })
      return await JobTitle.findByCompanyWithUserCount(companyId)
    } catch (error) {
      logger.error('Failed to get job titles', { error, companyId })
      throw error
    }
  },

  /**
   * Validate if job title belongs to company
   */
  async validateJobTitleBelongsToCompany(
    jobTitleId: string,
    companyId: string,
  ): Promise<boolean> {
    try {
      return await JobTitle.validateJobTitleBelongsToCompany(jobTitleId, companyId)
    } catch (error) {
      logger.error('Failed to validate job title', { error, jobTitleId, companyId })
      throw error
    }
  },
}
