import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { FastifyInstance } from 'fastify'
import { authService } from './auth.service'

import {
  createAuthHeader,
  generateExpiredMockJWT,
} from '../../../tests/helpers/auth.helper'
import { createTestApp, closeTestApp } from '../../../tests/helpers/app.helper'

describe('App Auth Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await closeTestApp(app)
  })

  beforeEach(() => {
    vi.clearAllMocks()

    vi.spyOn(authService, 'formatTimeRemaining').mockReturnValue('59m 59s')
  })

  it('logs in with email and password when the service succeeds', async () => {
    const loginSpy = vi.spyOn(authService, 'login').mockResolvedValue({
      access_token: 'signed-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'refresh-token',
      scope: 'openid profile email',
      user_info: {
        sub: 'auth-user-1',
        email: 'user@valorize.dev',
        email_verified: true,
        name: 'Test User',
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'user@valorize.dev',
        password: 'secret',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(loginSpy).toHaveBeenCalledWith({
      email: 'user@valorize.dev',
      password: 'secret',
    })
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        access_token: 'signed-access-token',
      },
    })
  })

  it('logs in with a Supabase access token when provided', async () => {
    const loginWithAccessTokenSpy = vi
      .spyOn(authService, 'loginWithAccessToken')
      .mockResolvedValue({
      access_token: 'oauth-token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'oauth-refresh-token',
      scope: 'openid profile email',
      user_info: {
        sub: 'auth-user-2',
        email: 'oauth@valorize.dev',
        email_verified: true,
      },
      })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        access_token: 'oauth-token',
        refresh_token: 'oauth-refresh-token',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(loginWithAccessTokenSpy).toHaveBeenCalledWith({
      access_token: 'oauth-token',
      refresh_token: 'oauth-refresh-token',
    })
  })

  it('returns 401 for invalid credentials', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(
      new Error('Invalid email or password'),
    )

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'user@valorize.dev',
        password: 'wrong-password',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({
      success: false,
      message: 'Invalid email or password',
    })
  })

  it('verifies a valid session in minimal mode with a local signed token', async () => {
    vi.spyOn(authService, 'validateToken').mockReturnValue({
      valid: true,
      expired: false,
      timeRemaining: 1800,
    })

    const response = await app.inject({
      method: 'GET',
      url: '/auth/verify?minimal=true',
      headers: createAuthHeader({
        userId: 'auth-user-3',
        email: 'token@valorize.dev',
      }),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        isValid: true,
        timeRemaining: 1800,
      },
    })
  })

  it('rejects expired tokens before reaching protected auth routes', async () => {
    const token = generateExpiredMockJWT({
      userId: 'expired-user',
      email: 'expired@valorize.dev',
    })

    const response = await app.inject({
      method: 'GET',
      url: '/auth/verify?minimal=true',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns full session info when the token is valid and the service resolves', async () => {
    const getSessionInfoSpy = vi.spyOn(authService, 'getSessionInfo').mockResolvedValue({
      isValid: true,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      timeRemaining: 3600,
      needsRefresh: false,
      user: {
        id: 'local-user-1',
        email: 'session@valorize.dev',
        name: 'Session User',
        avatar: '',
        companyId: 'company-1',
        isActive: true,
        jobTitle: null,
        department: null,
      },
    })

    const response = await app.inject({
      method: 'GET',
      url: '/auth/verify',
      headers: createAuthHeader({
        userId: 'auth-user-4',
        email: 'session@valorize.dev',
      }),
    })

    expect(response.statusCode).toBe(200)
    expect(getSessionInfoSpy).toHaveBeenCalled()
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        isValid: true,
        user: {
          email: 'session@valorize.dev',
        },
      },
    })
  })

})
