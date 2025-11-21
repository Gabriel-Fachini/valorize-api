import { prisma } from '@/lib/database'

/**
 * Get company ID from authenticated user's authUserId
 * Centralizado para evitar duplicação em múltiplos arquivos
 */
export async function getCompanyIdFromUser(authUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { authUserId },
    select: { companyId: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user.companyId
}
