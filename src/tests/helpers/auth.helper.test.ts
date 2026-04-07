import { describe, expect, it } from 'vitest'
import {
  createAuthHeader,
  generateExpiredMockJWT,
  generateMockJWT,
  verifyMockJWT,
} from './auth.helper'

describe('Auth Test Helpers', () => {
  it('should generate a valid mock Supabase JWT token', () => {
    const token = generateMockJWT({
      userId: 'test-user-123',
      companyId: 'test-company-456',
      email: 'test@example.com',
      permissions: ['compliments:send'],
    })

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    const decoded = verifyMockJWT(token)

    if (typeof decoded === 'string') {
      throw new TypeError('Expected decoded payload to be an object')
    }

    expect(decoded.sub).toBe('test-user-123')
    expect(decoded.email).toBe('test@example.com')
    expect(decoded.iss).toBe(`${process.env.SUPABASE_URL}/auth/v1`)
  })

  it('should generate expired tokens for negative auth scenarios', () => {
    const token = generateExpiredMockJWT({
      userId: 'expired-user-123',
      email: 'expired@example.com',
    })

    expect(token.split('.')).toHaveLength(3)
  })

  it('should create an authorization header with Bearer token', () => {
    const header = createAuthHeader({
      userId: 'test-user-123',
      companyId: 'test-company-456',
      email: 'test@example.com',
    })

    expect(header.Authorization).toMatch(/^Bearer /)
  })
})
