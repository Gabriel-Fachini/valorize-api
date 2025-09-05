import { FastifyReply, FastifyRequest } from 'fastify'
import { ForbiddenError } from '@/middleware/error-handler'
import { getCurrentUser } from '@/middleware/auth'
import { rbacService } from './rbac.service'

export const requirePermission = (permission: string) => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = getCurrentUser(request)
    const allowed = await rbacService.checkPermission(user.sub, permission)
    if (!allowed) {
      throw new ForbiddenError('Insufficient permissions')
    }
  }
}
