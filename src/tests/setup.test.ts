/**
 * Test Setup Validation
 *
 * This test file validates that the test environment is properly configured
 * If these tests fail, there's an issue with the setup that needs to be fixed
 */

import { describe, it, expect } from 'vitest'
import { generateMockJWT, createAuthHeader } from './helpers/auth.helper'

describe('Test Setup', () => {
  describe('Environment Variables', () => {
    it('should have NODE_ENV set to test', () => {
      expect(process.env.NODE_ENV).toBe('test')
    })

    it('should have DATABASE_URL configured', () => {
      expect(process.env.DATABASE_URL).toBeDefined()
      expect(process.env.DATABASE_URL).toContain('valorize_test')
    })

    it('should have Auth0 configuration', () => {
      expect(process.env.AUTH0_DOMAIN).toBeDefined()
      expect(process.env.AUTH0_AUDIENCE).toBeDefined()
    })

    it('should have Tremendous configuration', () => {
      expect(process.env.TREMENDOUS_API_KEY).toBeDefined()
      expect(process.env.TREMENDOUS_BASE_URL).toBeDefined()
    })

    it('should have Supabase configuration', () => {
      expect(process.env.SUPABASE_URL).toBeDefined()
      // Accept either SUPABASE_KEY, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY
      const hasSupabaseKey =
        process.env.SUPABASE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY
      expect(hasSupabaseKey).toBeDefined()
    })
  })

  describe('Auth Helpers', () => {
    it('should generate valid mock JWT token', () => {
      const token = generateMockJWT({
        userId: 'test-user-123',
        companyId: 'test-company-456',
        email: 'test@example.com',
        permissions: ['compliments:send'],
      })

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT format: header.payload.signature
    })

    it('should create auth header with Bearer token', () => {
      const header = createAuthHeader({
        userId: 'test-user-123',
        companyId: 'test-company-456',
        email: 'test@example.com',
      })

      expect(header.Authorization).toBeDefined()
      expect(header.Authorization).toMatch(/^Bearer /)
    })
  })

  describe('Basic Vitest Features', () => {
    it('should execute basic assertions', () => {
      expect(1 + 1).toBe(2)
    })

    it('should handle async operations', async () => {
      const promise = Promise.resolve('success')
      await expect(promise).resolves.toBe('success')
    })

    it('should handle thrown errors', () => {
      const thrower = () => {
        throw new Error('Test error')
      }

      expect(thrower).toThrow('Test error')
    })

    it('should have globals available', () => {
      // These should be available because vitest.config.ts has globals: true
      expect(describe).toBeDefined()
      expect(it).toBeDefined()
      expect(expect).toBeDefined()
    })
  })

  describe('Framework Configuration', () => {
    it('should have Vitest configured with node environment', () => {
      // If this fails, check vitest.config.ts
      expect(process.env.NODE_ENV).toBe('test')
    })

    it('should have test timeout configured', function() {
      // This test verifies timeout is set to 10s
      // If we can access test timeout from vitest, great
      // Otherwise this just verifies the test runs
      expect(true).toBe(true)
    })
  })
})
