import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/features/rbac/rbac.service', () => ({
  rbacService: { checkPermission: vi.fn() },
}))

import { requirePermission } from '../src/features/rbac/rbac.middleware'
import { rbacService } from '../src/features/rbac/rbac.service'
import { ForbiddenError } from '../src/middleware/error-handler'

const mockRequest: any = { authenticatedUser: { sub: 'user-1' } }
const mockReply: any = {}

describe('requirePermission middleware', () => {
  it('allows when permission is granted', async () => {
    ;(rbacService.checkPermission as any).mockResolvedValueOnce(true)
    const middleware = requirePermission('users:manage_roles')
    await expect(middleware(mockRequest, mockReply)).resolves.toBeUndefined()
  })

  it('throws ForbiddenError when permission is missing', async () => {
    ;(rbacService.checkPermission as any).mockResolvedValueOnce(false)
    const middleware = requirePermission('users:manage_roles')
    await expect(middleware(mockRequest, mockReply)).rejects.toBeInstanceOf(ForbiddenError)
  })
})
