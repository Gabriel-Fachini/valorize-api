import { vi } from 'vitest'

interface SupabaseSessionOptions {
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  userId?: string
  email?: string
  name?: string
}

export function isSupabaseIntegrationTestEnabled(): boolean {
  return process.env.ENABLE_SUPABASE_INTEGRATION_TESTS === 'true'
}

export function createSupabaseSession(options: SupabaseSessionOptions = {}) {
  const userId = options.userId ?? 'supabase-user-test'
  const email = options.email ?? 'test@valorize.dev'
  const name = options.name ?? 'Test User'

  return {
    access_token: options.accessToken ?? 'mock-access-token',
    refresh_token: options.refreshToken ?? 'mock-refresh-token',
    expires_in: options.expiresIn ?? 3600,
    token_type: 'bearer',
    user: {
      id: userId,
      email,
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {
        name,
      },
    },
  }
}

export function createSupabaseAuthClientMock() {
  return {
    auth: {
      signInWithPassword: vi.fn(),
      refreshSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  }
}

export function createSupabaseAdminClientMock() {
  return {
    auth: {
      admin: {
        createUser: vi.fn(),
        updateUserById: vi.fn(),
      },
    },
  }
}
