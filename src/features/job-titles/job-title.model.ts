import { prisma } from '@/lib/database'

export interface JobTitleWithCount {
  id: string
  name: string
  userCount: number
}

export const JobTitle = {
  /**
   * Get all job titles for a company with user counts
   */
  async findByCompanyWithUserCount(companyId: string): Promise<JobTitleWithCount[]> {
    const jobTitles = await prisma.jobTitle.findMany({
      where: {
        companyId,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return jobTitles.map((jobTitle) => ({
      id: jobTitle.id,
      name: jobTitle.name,
      userCount: jobTitle._count.users,
    }))
  },

  /**
   * Get job titles for a company filtered by department
   */
  async findByDepartment(
    companyId: string,
    departmentId: string,
  ): Promise<JobTitleWithCount[]> {
    const jobTitles = await prisma.jobTitle.findMany({
      where: {
        companyId,
        users: {
          some: {
            departmentId,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: {
              where: {
                departmentId,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return jobTitles.map((jobTitle) => ({
      id: jobTitle.id,
      name: jobTitle.name,
      userCount: jobTitle._count.users,
    }))
  },

  /**
   * Validate if job title belongs to company
   */
  async validateJobTitleBelongsToCompany(
    jobTitleId: string,
    companyId: string,
  ): Promise<boolean> {
    const jobTitle = await prisma.jobTitle.findFirst({
      where: {
        id: jobTitleId,
        companyId,
      },
    })

    return !!jobTitle
  },
}
