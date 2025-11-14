import { Department, type DepartmentWithCount } from './department.model'
import { logger } from '@/lib/logger'

export const departmentService = {
  /**
   * Get all departments for a company with user counts
   */
  async getDepartmentsByCompany(companyId: string): Promise<DepartmentWithCount[]> {
    try {
      logger.info('Fetching departments for company', { companyId })
      return await Department.findByCompanyWithUserCount(companyId)
    } catch (error) {
      logger.error('Failed to get departments', { error, companyId })
      throw error
    }
  },

  /**
   * Validate if department belongs to company
   */
  async validateDepartmentBelongsToCompany(
    departmentId: string,
    companyId: string,
  ): Promise<boolean> {
    try {
      return await Department.validateDepartmentBelongsToCompany(departmentId, companyId)
    } catch (error) {
      logger.error('Failed to validate department', { error, departmentId, companyId })
      throw error
    }
  },
}
