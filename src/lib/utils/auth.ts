import { prisma } from '@/lib/database'

/**
 * Get company ID from authenticated user's auth0Id
 * Centralizado para evitar duplicação em múltiplos arquivos
 */
export async function getCompanyIdFromUser(auth0Id: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { auth0Id },
    select: { companyId: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user.companyId
}
