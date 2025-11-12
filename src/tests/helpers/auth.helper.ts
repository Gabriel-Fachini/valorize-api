/**
 * Authentication Test Helpers
 *
 * Provides utilities for creating authenticated test requests
 * and generating mock JWT tokens
 */

import jwt from 'jsonwebtoken'

/**
 * JWT Token Payload for Mocks
 */
export interface MockJWTPayload {
  userId: string
  companyId: string
  email: string
  permissions?: string[]
}

/**
 * Generate a mock JWT token for testing
 *
 * @param payload - User and company information
 * @returns Valid JWT token signed with test secret
 *
 * @example
 * const token = generateMockJWT({
 *   userId: 'user-123',
 *   companyId: 'company-456',
 *   email: 'user@test.com',
 *   permissions: ['compliments:send', 'prizes:redeem']
 * })
 *
 * // Use in request headers:
 * app.inject({
 *   url: '/compliments',
 *   headers: {
 *     Authorization: `Bearer ${token}`
 *   }
 * })
 */
export function generateMockJWT(payload: MockJWTPayload): string {
  const secret = process.env.JWT_SECRET ?? 'test-jwt-secret-for-mock-tokens'

  return jwt.sign(
    {
      sub: payload.userId, // Standard OIDC subject claim
      'https://valorize.api/companyId': payload.companyId, // Custom claim matching app behavior
      email: payload.email,
      permissions: payload.permissions ?? [],
    },
    secret,
    {
      expiresIn: '1h',
      algorithm: 'HS256',
    },
  )
}

/**
 * Generate Authorization header value
 *
 * @param token - JWT token
 * @returns Bearer token header value
 *
 * @example
 * const header = getAuthHeader(token)
 * // "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export function getAuthHeader(token: string): string {
  return `Bearer ${token}`
}

/**
 * Create a complete authorization header object
 *
 * @param payload - User and company information
 * @returns Object with Authorization header ready for Fastify inject
 *
 * @example
 * const headers = createAuthHeader({
 *   userId: 'user-123',
 *   companyId: 'company-456',
 *   email: 'user@test.com'
 * })
 *
 * app.inject({
 *   url: '/api/v1/compliments',
 *   headers
 * })
 */
export function createAuthHeader(
  payload: MockJWTPayload,
): { Authorization: string } {
  const token = generateMockJWT(payload)
  return {
    Authorization: getAuthHeader(token),
  }
}

/**
 * Verify a mock JWT token (for testing purposes only)
 *
 * @param token - JWT token to verify
 * @returns Decoded token payload
 *
 * @example
 * const decoded = verifyMockJWT(token)
 * expect(decoded.email).toBe('user@test.com')
 */
export function verifyMockJWT(token: string): any {
  const secret = process.env.JWT_SECRET ?? 'test-jwt-secret-for-mock-tokens'

  try {
    return jwt.verify(token, secret, {
      algorithms: ['HS256'],
    })
  } catch (error) {
    throw new Error(`Invalid mock JWT token: ${error}`)
  }
}

/**
 * Create multiple mock tokens for different users
 *
 * Useful for tests that need multiple authenticated users
 *
 * @example
 * const [adminToken, userToken] = await createMultipleTokens([
 *   {
 *     userId: 'admin-1',
 *     companyId: 'company-1',
 *     email: 'admin@test.com',
 *     permissions: ['admin:access_panel']
 *   },
 *   {
 *     userId: 'user-1',
 *     companyId: 'company-1',
 *     email: 'user@test.com',
 *     permissions: ['compliments:send']
 *   }
 * ])
 */
export function createMultipleTokens(
  payloads: MockJWTPayload[],
): string[] {
  return payloads.map(payload => generateMockJWT(payload))
}

/**
 * Create tokens for a common test scenario
 *
 * Returns tokens for:
 * - Admin user
 * - Regular user
 * - User from different company
 *
 * @example
 * const tokens = createCommonTestTokens()
 * const { adminToken, userToken, otherCompanyToken } = tokens
 */
export function createCommonTestTokens() {
  return {
    adminToken: generateMockJWT({
      userId: 'admin-user-test',
      companyId: 'company-test-1',
      email: 'admin@test.com',
      permissions: ['admin:access_panel', 'users:manage', 'companies:manage'],
    }),

    userToken: generateMockJWT({
      userId: 'regular-user-test',
      companyId: 'company-test-1',
      email: 'user@test.com',
      permissions: ['compliments:send', 'prizes:redeem', 'wallets:view'],
    }),

    otherCompanyToken: generateMockJWT({
      userId: 'other-company-user-test',
      companyId: 'company-test-2', // Different company!
      email: 'other@test.com',
      permissions: ['compliments:send'],
    }),
  }
}

// TODO: Add these helpers as needed:
// - mockAuth0JWKS() - Mock Auth0 JWKS endpoint for testing real JWT verification
// - mockTokenExpiration() - Create expired tokens for testing
// - createUserContextWithRole() - Create complete user context with database entry
// - mockRBACCheck() - Mock RBAC permission validation
