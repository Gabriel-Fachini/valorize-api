import { prisma } from '@/lib/database'

export const rbacService = {
  async checkPermission(auth0Id: string, permission: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { auth0Id },
      select: { id: true, companyId: true },
    })
    if (!user) return false

    const record = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        role: {
          companyId: user.companyId,
          permissions: {
            some: { permission: { name: permission } },
          },
        },
      },
    })

    return !!record
  },

  async createRole(
    companyId: string,
    name: string,
    permissions: string[] = [],
    description?: string,
  ) {
    return prisma.role.create({
      data: {
        name,
        description,
        companyId,
        permissions: {
          create: permissions.map(p => ({
            permission: {
              connectOrCreate: {
                where: { name: p },
                create: { name: p },
              },
            },
          })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
      },
    })
  },

  async assignRoleToUser(userId: string, roleId: string) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    })
  },
}
