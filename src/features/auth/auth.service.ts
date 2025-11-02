import axios from 'axios'
import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'
import { AuthenticatedUser } from '@/middleware/auth'
import { User } from '../users/user.model'
import { prisma } from '@/lib/database'
import { rbacService } from '../rbac/rbac.service'
import { demoDataService } from '@/lib/seed/demo-data.service'
import { PERMISSION } from '@/features/rbac/permissions.constants'

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  name: string
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
    jobTitle?: string | null
    department?: string | null
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
        PERMISSION.ADMIN_ACCESS_PANEL,
        PERMISSION.ADMIN_VIEW_ANALYTICS,
        PERMISSION.ADMIN_MANAGE_COMPANY,
        PERMISSION.ADMIN_MANAGE_SYSTEM,
        PERMISSION.USERS_MANAGE_ROLES,
        PERMISSION.ROLES_MANAGE_PERMISSIONS,
        PERMISSION.COMPANY_MANAGE_SETTINGS,
      ]

      // Check if user has any admin permissions
      const hasAdminPermissions = userPermissions.permissions.some((permission: string) =>
        adminPermissions.includes(permission as any),
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
        adminPermissions.includes(permission as typeof adminPermissions[number]),
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
          jobTitle: { select: { name: true } },
          department: { select: { name: true } },
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
        jobTitle: user.jobTitle?.name ?? null,
        department: user.department?.name ?? null,
      }
    } catch (error) {
      logger.error('Error fetching user from database', {
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  },

  /**
   * Create a new user account in Auth0 and local database
   */
  async signup(signupData: SignupRequest): Promise<{ user: User; message: string }> {
    try {
      const auth0Domain = process.env.AUTH0_DOMAIN!
      const clientId = process.env.AUTH0_M2M_CLIENT_ID!
      const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET!
      const audience = process.env.AUTH0_AUDIENCE!

      // Validate required environment variables
      if (!auth0Domain || !clientId || !clientSecret || !audience) {
        throw new Error('Missing required Auth0 environment variables')
      }


      // Check if user already exists in our database
      const existingUser = await prisma.user.findUnique({
        where: { email: signupData.email.toLowerCase() },
      })

      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Create user in Auth0
      const auth0UserData = {
        email: signupData.email.toLowerCase(),
        name: signupData.name,
        password: 'V@alorize', // Default password as specified
        email_verified: true,
        connection: 'Username-Password-Authentication', // Default Auth0 connection
      }

      const managementToken = await this.getManagementToken()

      const auth0Response = await axios.post(
        `https://${auth0Domain}/api/v2/users`,
        auth0UserData,
        {
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
        },
      )

      const auth0User = auth0Response.data

      if (!auth0User.user_id) {
        throw new Error('Failed to create user in Auth0')
      }

      logger.info('User created in Auth0', {
        auth0Id: auth0User.user_id,
        email: signupData.email,
      })

      // Create user in local database
      const newUser = User.create({
        auth0Id: auth0User.user_id,
        email: signupData.email.toLowerCase(),
        name: signupData.name,
        companyId: 'demo-company-001', // Default company as specified
        isActive: true,
      })

      const savedUser = await newUser.save()

      // Create wallet with initial balance of 10000 coins
      await this.createWalletWithInitialBalance(savedUser.id)

      // Assign default employee role
      await this.assignDefaultRole(savedUser.id, 'demo-company-001')

      // Create demo data for testing (only in development)
      if (process.env.NODE_ENV === 'development') {
        await demoDataService.createDemoDataForUser({
          userId: savedUser.id,
          companyId: savedUser.companyId,
          userName: savedUser.name,
          userEmail: savedUser.email,
        })
      }

      logger.info('User created successfully', {
        userId: savedUser.id,
        auth0Id: auth0User.user_id,
        email: savedUser.email,
        companyId: savedUser.companyId,
      })

      return {
        user: savedUser,
        message: 'User account created successfully. You can now login with the default password.',
      }

    } catch (error) {
      logger.error('Error during user signup', {
        email: signupData.email,
        name: signupData.name,
        error: error instanceof Error ? error.message : String(error),
      })

      // Handle specific Auth0 errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Auth0 Management API authentication failed. Check your client credentials and scopes.')
        }
        if (error.response?.status === 403) {
          throw new Error('Auth0 Management API access denied. Ensure your application has the required scopes: create:users, read:users')
        }
        if (error.response?.status === 409) {
          throw new Error('User with this email already exists in Auth0')
        }
        if (error.response?.status === 400) {
          const errorMessage = error.response.data?.message ?? 'Invalid user data'
          throw new Error(`Auth0 validation error: ${errorMessage}`)
        }
        if (error.response?.status === 422) {
          const errorMessage = error.response.data?.message ?? 'Invalid user data format'
          throw new Error(`Auth0 data validation error: ${errorMessage}`)
        }
      }

      throw error
    }
  },

  /**
   * Get Auth0 Management API token
   */
  async getManagementToken(): Promise<string> {
    const auth0Domain = process.env.AUTH0_DOMAIN!
    const clientId = process.env.AUTH0_M2M_CLIENT_ID!
    const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET!

    try {
      const tokenResponse = await axios.post(
        `https://${auth0Domain}/oauth/token`,
        {
          client_id: clientId,
          client_secret: clientSecret,
          audience: `https://${auth0Domain}/api/v2/`,
          grant_type: 'client_credentials',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      return tokenResponse.data.access_token
    } catch (error) {
      logger.error('Failed to get Auth0 Management API token', {
        error: axios.isAxiosError(error) ? {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        } : error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to obtain Auth0 Management API token. Check your Auth0 configuration.')
    }
  },

  /**
   * Assign default role to new user
   */
  async assignDefaultRole(userId: string, companyId: string): Promise<void> {
    try {
      // Find the employee role for the company
      const employeeRole = await prisma.role.findFirst({
        where: {
          name: 'employee',
          companyId: companyId,
        },
      })

      if (!employeeRole) {
        logger.warn('Employee role not found for company', {
          companyId,
          userId,
        })
        return
      }

      // Assign the role to the user
      await prisma.userRole.create({
        data: {
          userId: userId,
          roleId: employeeRole.id,
        },
      })


    } catch (error) {
      logger.error('Error assigning default role', {
        userId,
        companyId,
        error: error instanceof Error ? error.message : String(error),
      })
      // Don't throw error here as user creation should still succeed
    }
  },

  /**
   * Create wallet with initial balance for new user
   */
  async createWalletWithInitialBalance(userId: string): Promise<void> {
    try {
      // Create wallet with initial redeemable balance of 10000 coins
      await prisma.wallet.create({
        data: {
          userId: userId,
          complimentBalance: 500, // Default weekly balance
          redeemableBalance: 10000, // Initial bonus balance
        },
      })


    } catch (error) {
      logger.error('Error creating wallet with initial balance', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
      // Don't throw error here as user creation should still succeed
    }
  },

  /**
   * Get company ID for the authenticated user
   * This is more efficient than fetching the entire user object
   */
  async getCompanyId(auth0Id: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { auth0Id },
        select: { companyId: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      return user.companyId
    } catch (error) {
      logger.error('Failed to get company ID', {
        auth0Id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to retrieve company information')
    }
  },

  /**
   * Generate a temporary password for a user and trigger change password ticket
   * Returns the change password ticket URL that can be sent to the user
   */
  async generateTemporaryPassword(auth0Id: string): Promise<{ ticket_url: string }> {
    try {
      const auth0Domain = process.env.AUTH0_DOMAIN!
      
      const managementToken = await this.getManagementToken()

      // Request a change password ticket from Auth0
      const response = await axios.post(
        `https://${auth0Domain}/api/v2/tickets/password-change`,
        {
          user_id: auth0Id,
          result_url: process.env.AUTH0_PASSWORD_RESET_REDIRECT_URI ?? `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password`,
          ttl_sec: 86400, // 24 hours
          includeEmailInRedirect: false,
          mark_email_as_verified: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
        },
      )

      const ticketUrl = response.data.ticket

      logger.info('Temporary password ticket generated', {
        auth0Id,
        ticketUrl: ticketUrl.substring(0, 50) + '...', // Log only first 50 chars for security
      })

      return { ticket_url: ticketUrl }
    } catch (error) {
      logger.error('Failed to generate temporary password', {
        auth0Id,
        error: axios.isAxiosError(error) ? {
          status: error.response?.status,
          data: error.response?.data,
        } : error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to generate temporary password')
    }
  },

  /**
   * Reset password for a user by creating a new ticket
   * This generates a change password URL that should be sent to the user
   */
  async resetUserPassword(auth0Id: string): Promise<{ ticket_url: string }> {
    try {
      logger.info('Resetting password for user', { auth0Id })
      return await this.generateTemporaryPassword(auth0Id)
    } catch (error) {
      logger.error('Failed to reset password', {
        auth0Id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  /**
   * Create a new user in Auth0 from Admin Panel
   * Generates a password reset ticket automatically for first login
   */
  async createAdminUser(userData: {
    email: string
    name: string
  }): Promise<{ auth0Id: string; ticketUrl: string }> {
    try {
      const auth0Domain = process.env.AUTH0_DOMAIN!
      const clientId = process.env.AUTH0_M2M_CLIENT_ID!
      const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET!

      // Validate required environment variables
      if (!auth0Domain || !clientId || !clientSecret) {
        throw new Error('Missing required Auth0 environment variables')
      }

      // Create user in Auth0
      const auth0UserData = {
        email: userData.email.toLowerCase(),
        name: userData.name,
        password: 'T3mp0r@ryP@ss', // Temporary password (will be reset)
        email_verified: true,
        connection: 'Username-Password-Authentication',
      }

      const managementToken = await this.getManagementToken()

      const auth0Response = await axios.post(
        `https://${auth0Domain}/api/v2/users`,
        auth0UserData,
        {
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
        },
      )

      const auth0User = auth0Response.data

      if (!auth0User.user_id) {
        throw new Error('Failed to create user in Auth0')
      }

      logger.info('User created in Auth0 via Admin Panel', {
        auth0Id: auth0User.user_id,
        email: userData.email,
      })

      // Generate password reset ticket
      const passwordTicket = await this.generateTemporaryPassword(auth0User.user_id)

      return {
        auth0Id: auth0User.user_id,
        ticketUrl: passwordTicket.ticket_url,
      }
    } catch (error) {
      logger.error('Error creating user in Auth0 via Admin Panel', {
        email: userData.email,
        error: axios.isAxiosError(error) ? {
          status: error.response?.status,
          data: error.response?.data,
        } : error instanceof Error ? error.message : String(error),
      })

      // Handle specific Auth0 errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Auth0 Management API authentication failed')
        }
        if (error.response?.status === 403) {
          throw new Error('Auth0 Management API access denied')
        }
        if (error.response?.status === 409) {
          throw new Error('User with this email already exists in Auth0')
        }
        if (error.response?.status === 400) {
          const errorMessage = error.response.data?.message ?? 'Invalid user data'
          throw new Error(`Auth0 validation error: ${errorMessage}`)
        }
      }

      throw error
    }
  },
}
