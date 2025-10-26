import axios from 'axios'
import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'
import { AuthenticatedUser } from '@/middleware/auth'
import { User } from '../users/user.model'
import { prisma } from '@/lib/database'
import { rbacService } from '../rbac/rbac.service'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
  user_info: {
    sub: string
    email: string
    email_verified: boolean
    name?: string
    avatar?: string
    [key: string]: unknown
  }
}

export interface AuthError {
  error: string
  error_description?: string
  status_code?: number
}

export interface SessionInfo {
  isValid: boolean
  user: User
  expiresAt: Date
  timeRemaining: number // in seconds
  needsRefresh: boolean
}

export interface TokenValidationResult {
  valid: boolean
  expired: boolean
  user?: AuthenticatedUser
  expiresAt?: Date
  timeRemaining?: number
  error?: string
}

export const authService = {
  // Threshold in seconds - when token has less than this time remaining, suggest refresh
  REFRESH_THRESHOLD: 5 * 60, // 5 minutes

  /**
   * Admin login with permission validation
   */
  async adminLogin(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // First, authenticate with Auth0
      const loginResult = await this.login(credentials)
      
      logger.info('Admin login attempt', {
        email: credentials.email,
        auth0Id: loginResult.user_info.sub,
      })

      // Get user from database to check permissions
      const user = await this.getUserByAuth0Id(loginResult.user_info.sub)
      
      if (!user) {
        throw new Error('User not found in database')
      }

      // Get user permissions and roles
      const userPermissions = await rbacService.getUserPermissions(loginResult.user_info.sub)
      
      // Define admin permissions
      const adminPermissions = [
        'admin:access_panel',
        'admin:view_analytics',
        'admin:manage_company',
        'admin:manage_system',
        'users:manage_roles',
        'roles:manage_permissions',
        'company:manage_settings',
      ]

      // Check if user has any admin permissions
      const hasAdminPermissions = userPermissions.permissions.some(permission =>
        adminPermissions.includes(permission),
      )

      if (!hasAdminPermissions) {
        logger.warn('Admin login denied - insufficient permissions', {
          email: credentials.email,
          auth0Id: loginResult.user_info.sub,
          userPermissions: userPermissions.permissions,
        })

        throw new Error('Access denied: Admin permissions required')
      }

      // Filter admin permissions from user's permissions
      const userAdminPermissions = userPermissions.permissions.filter(permission =>
        adminPermissions.includes(permission),
      )

      logger.info('Admin login successful', {
        email: credentials.email,
        auth0Id: loginResult.user_info.sub,
        adminPermissions: userAdminPermissions,
        roles: userPermissions.roles.map(role => role.name),
      })

      return { ...loginResult }
    } catch (error) {
      logger.error('Admin login failed', {
        email: credentials.email,
        error: error instanceof Error ? error.message : String(error),
      })

      // Re-throw the error to be handled by the route
      throw error
    }
  },

  /**
   * Authenticate user using Resource Owner Password Grant
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const auth0Domain = process.env.AUTH0_DOMAIN!
      const clientId = process.env.AUTH0_CLIENT_ID!
      const clientSecret = process.env.AUTH0_CLIENT_SECRET!
      const audience = process.env.AUTH0_AUDIENCE!
      const scope = process.env.AUTH0_SCOPE ?? 'openid profile email offline_access'

      // Validate required environment variables
      if (!auth0Domain || !clientId || !clientSecret || !audience) {
        throw new Error('Missing required Auth0 environment variables')
      }

      logger.info('Attempting Auth0 login', {
        email: credentials.email,
        domain: auth0Domain,
        clientId,
      })

      // Prepare the request body for Auth0's oauth/token endpoint
      const tokenRequestBody: Record<string, string> = {
        grant_type: 'password',
        username: credentials.email,
        password: credentials.password,
        client_id: clientId,
        client_secret: clientSecret,
        scope,
        audience,
      }

      // Make the token request to Auth0
      const tokenResponse = await axios.post(
        `https://${auth0Domain}/oauth/token`,
        tokenRequestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      const tokenData = tokenResponse.data

      if (!tokenData.access_token) {
        throw new Error('No access token received from Auth0')
      }

      logger.info('Auth0 login successful', {
        email: credentials.email,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        hasRefreshToken: !!tokenData.refresh_token,
      })

      const userInfo = await this.getUser(credentials.email)

      if (!userInfo) {
        throw new Error('User not found in database')
      }

      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type ?? 'Bearer',
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope ?? scope,
        user_info: userInfo,
      }
    } catch (error) {
      logger.error('Auth0 login failed', {
        email: credentials.email,
        error: error instanceof Error ? error.message : String(error),
      })

      if (axios.isAxiosError(error)) {
        const authError = error.response?.data as AuthError
        
        if (authError?.error) {
          // Auth0 specific error
          throw new Error(`Authentication failed: ${authError.error_description ?? authError.error}`)
        }
        
        // HTTP error
        throw new Error(`Authentication failed: HTTP ${error.response?.status}`)
      }

      throw new Error('Authentication service unavailable')
    }
  },

  /**
   * Get user information from Auth0 using access token
   */
  async getUserFromAuth0(accessToken: string): Promise<LoginResponse['user_info']> {
    try {
      const auth0Domain = process.env.AUTH0_DOMAIN!
      
      const userInfoResponse = await axios.get(
        `https://${auth0Domain}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      const userInfo = userInfoResponse.data

      return {
        sub: userInfo.sub,
        email: userInfo.email,
        email_verified: userInfo.email_verified ?? false,
        name: userInfo.name,
        avatar: userInfo.avatar,
        ...userInfo, // Include any additional claims
      }
    } catch (error) {
      logger.warn('Failed to get user info from Auth0', {
        error: error instanceof Error ? error.message : String(error),
      })

      throw new Error('Failed to retrieve user information from Auth0')
    }
  },


  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<Omit<LoginResponse, 'user_info'>> {
    try {
      const auth0Domain = process.env.AUTH0_DOMAIN!
      const clientId = process.env.AUTH0_CLIENT_ID!
      const clientSecret = process.env.AUTH0_CLIENT_SECRET!
      const audience = process.env.AUTH0_AUDIENCE!
      const scope = process.env.AUTH0_SCOPE ?? 'openid profile email offline_access'

      logger.info('Attempting to refresh Auth0 token')

      // Prepare the refresh token request body
      const refreshRequestBody: Record<string, string> = {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        audience,
      }

      const refreshResponse = await axios.post(
        `https://${auth0Domain}/oauth/token`,
        refreshRequestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      const tokenData = refreshResponse.data

      logger.info('Auth0 token refresh successful', {
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
      })

      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type ?? 'Bearer',
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token ?? refreshToken, // Keep old refresh token if new one not provided
        scope: tokenData.scope ?? scope,
      }
    } catch (error) {
      logger.error('Auth0 token refresh failed', {
        error: error instanceof Error ? error.message : String(error),
      })

      if (axios.isAxiosError(error)) {
        const authError = error.response?.data as AuthError
        
        if (authError?.error) {
          throw new Error(`Token refresh failed: ${authError.error_description ?? authError.error}`)
        }
        
        throw new Error(`Token refresh failed: HTTP ${error.response?.status}`)
      }

      throw new Error('Token refresh service unavailable')
    }
  },

  /**
   * Get user information from database by Auth0 ID
   */
  async getUserByAuth0Id(auth0Id: string): Promise<User | null> {
    try {
      const user = await User.findByAuth0Id(auth0Id)
      
      if (!user) {
        logger.warn('User not found in database', { auth0Id })
        return null
      }

      return user
    } catch (error) {
      logger.error('Failed to get user from database', {
        auth0Id,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  },

  /**
   * Get detailed session information
   */
  async getSessionInfo(auth0Id: string, token: string): Promise<SessionInfo> {
    try {
      // Decode the token to get expiration time
      const decoded = jwt.decode(token) as Record<string, unknown>
      
      if (!decoded?.exp) {
        throw new Error('Invalid token format')
      }

      const expiresAt = new Date(Number(decoded.exp) * 1000)
      const now = new Date()
      const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
      const isValid = timeRemaining > 0
      const needsRefresh = timeRemaining <= this.REFRESH_THRESHOLD

      // Get user data from database
      const user = await this.getUserByAuth0Id(auth0Id)

      if (!user) {
        throw new Error('User not found in database')
      }

      logger.info('Session info retrieved', {
        userId: auth0Id,
        email: user.email,
        expiresAt: expiresAt.toISOString(),
        timeRemaining,
        needsRefresh,
        hasDatabaseUser: !!user,
      })

      return {
        isValid,
        user,
        expiresAt,
        timeRemaining,
        needsRefresh,
      }
    } catch (error) {
      logger.error('Error getting session info', {
        userId: auth0Id,
        error: error instanceof Error ? error.message : String(error),
      })
      
      throw new Error('Failed to retrieve session information')
    }
  },

  /**
   * Validate token structure and expiration
   */
  validateToken(token: string): TokenValidationResult {
    try {
      // Decode without verification (just to check structure and expiration)
      const decoded = jwt.decode(token) as Record<string, unknown>
      
      if (!decoded) {
        return {
          valid: false,
          expired: false,
          error: 'Invalid token format',
        }
      }

      if (!decoded.exp) {
        return {
          valid: false,
          expired: false,
          error: 'Token missing expiration',
        }
      }

      const expiresAt = new Date((decoded.exp as number) * 1000)
      const now = new Date()
      const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
      const expired = timeRemaining <= 0

      const user: AuthenticatedUser = {
        sub: decoded.sub as string,
        email: decoded.email as string,
        email_verified: decoded.email_verified as boolean,
        name: decoded.name as string,
        avatar: decoded.avatar as string,
        ...decoded,
      }

      return {
        valid: !expired,
        expired,
        user,
        expiresAt,
        timeRemaining,
      }
    } catch (error) {
      logger.warn('Token validation failed', {
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        valid: false,
        expired: false,
        error: 'Token validation failed',
      }
    }
  },

  /**
   * Validate token format and basic structure
   */
  validateTokenFormat(token: string): boolean {
    try {
      // Basic JWT format check (header.payload.signature)
      const parts = token.split('.')
      if (parts.length !== 3) {
        return false
      }

      // Try to decode the payload (without verification)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
      
      // Check for required claims
      return !!(payload.sub && payload.exp)
    } catch {
      return false
    }
  },

  /**
   * Check if token needs refresh based on remaining time
   */
  needsRefresh(timeRemaining: number): boolean {
    return timeRemaining <= this.REFRESH_THRESHOLD
  },

  /**
   * Format time remaining in human-readable format
   */
  formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) {
      return 'Expired'
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  },

  /**
   * Generate refresh token instructions for Auth0
   */
  getRefreshInstructions(): {
    endpoint: string
    instructions: string
    requiredFields: string[]
  } {
    const auth0Domain = process.env.AUTH0_DOMAIN
    
    return {
      endpoint: `https://${auth0Domain}/oauth/token`,
      instructions: 'Para renovar o token, faça uma requisição POST para o endpoint fornecido com o refresh_token',
      requiredFields: [
        'grant_type: "refresh_token"',
        'client_id: "seu_client_id"',
        'client_secret: "seu_client_secret" (se aplicável)',
        'refresh_token: "seu_refresh_token"',
      ],
    }
  },

  /**
   * Get user information from database by email
   */
  async getUser(email: string): Promise<LoginResponse['user_info'] | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          email,
          isActive: true,
        },
        select: {
          auth0Id: true,
          email: true,
          name: true,
          avatar: true,
        },
      })
      
      if (!user) {
        return null
      }

      return {
        sub: user.auth0Id,
        email: user.email,
        email_verified: true,
        name: user.name,
        avatar: user.avatar ?? undefined,
      }
    } catch (error) {
      logger.error('Error fetching user from database', {
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  },
}
