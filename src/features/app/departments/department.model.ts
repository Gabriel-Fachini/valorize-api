import { prisma } from '@/lib/database'

export interface DepartmentWithCount {
  id: string
  name: string
  userCount: number
}

export const Department = {
  /**
   * Get all departments for a company with user counts
   */
  async findByCompanyWithUserCount(companyId: string): Promise<DepartmentWithCount[]> {
    const departments = await prisma.department.findMany({
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

    return departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      userCount: dept._count.users,
    }))
  },

  /**
   * Validate if department belongs to company
   */
  async validateDepartmentBelongsToCompany(
    departmentId: string,
    companyId: string,
  ): Promise<boolean> {
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId,
      },
    })

    return !!department
  },
}
