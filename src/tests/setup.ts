/**
 * Global Test Setup
 * Runs once before all tests
 *
 * Responsibilities:
 * - Load test environment variables (.env.test)
 * - Configure logger to silent mode during tests
 * - Setup mocks for external services (Auth0, Tremendous, etc)
 * - Initialize test database connection
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { beforeAll, afterAll } from 'vitest'

/**
 * Load .env.test configuration
 * This should run first before anything else
 * Use override: true to ensure test variables take precedence
 */
const envPath = resolve(__dirname, '../../.env.test')
const result = config({ path: envPath, override: true })

if (result.error && !process.env.DATABASE_URL) {
  console.warn(`⚠️  Could not load .env.test from ${envPath}`)
  console.warn('Make sure the file exists or DATABASE_URL is set')
}

/**
 * Verify test environment is configured correctly
 */
function verifyTestEnvironment() {
  const requiredVars = ['DATABASE_URL', 'NODE_ENV', 'AUTH0_DOMAIN']
  const missing = requiredVars.filter(v => !process.env[v])

  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`)
  }

  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  NODE_ENV is not set to "test"')
  }

  if (!process.env.DATABASE_URL?.includes('test')) {
    console.warn('⚠️  DATABASE_URL does not contain "test" - are you using the test database?')
  }
}

/**
 * Configure logger to silent mode during tests
 * This prevents test output from being polluted with logs
 */
function configureTestLogger() {
  const oldWarn = console.warn
  const oldError = console.error

  // Allow warnings and errors for debugging
  // But suppress info and debug logs
  globalThis.console = {
    ...console,
    log: () => {}, // Suppress
    info: () => {}, // Suppress
    debug: () => {}, // Suppress
    warn: oldWarn, // Keep warnings
    error: oldError, // Keep errors
  } as any
}

/**
 * Global test hooks
 */
beforeAll(() => {
  verifyTestEnvironment()
  configureTestLogger()

  console.warn('🧪 Test environment initialized')
  console.warn(`📦 DATABASE_URL: ${process.env.DATABASE_URL}`)
  console.warn(`🔒 NODE_ENV: ${process.env.NODE_ENV}`)
})

afterAll(() => {
  // Cleanup after all tests
  console.warn('✅ Test suite completed')
})

/**
 * Global error handling for unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// TODO: Add global mocks for:
// - Auth0 JWKS endpoint
// - Tremendous API adapter
// - Supabase Storage
// As needed when writing tests that use these services
