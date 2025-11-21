import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'
import { AuthenticatedUser } from '@/middleware/auth'
import { User } from '../users/user.model'
import { prisma } from '@/lib/database'
import { rbacService } from '../rbac/rbac.service'
import { demoDataService } from '@/lib/seed/demo-data.service'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'
import { getSupabaseAuth, getSupabaseAdmin } from '@/lib/supabase'

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
      // First, authenticate with Supabase Auth
      const loginResult = await this.login(credentials)

      logger.info('Admin login attempt', {
        email: credentials.email,
        authUserId: loginResult.user_info.sub,
      })

      // Get user from database to check permissions
      const user = await this.getUserByAuthUserId(loginResult.user_info.sub)

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
        adminPermissions.includes(permission as typeof adminPermissions[number]),
      )

      if (!hasAdminPermissions) {
        logger.warn('Admin login denied - insufficient permissions', {
          email: credentials.email,
          authUserId: loginResult.user_info.sub,
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
        authUserId: loginResult.user_info.sub,
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
      logger.info('Attempting Supabase Auth login', {
        email: credentials.email,
      })

      const supabase = getSupabaseAuth()

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        logger.error('Supabase Auth login failed', {
          email: credentials.email,
          error: error.message,
        })
        throw new Error(`Authentication failed: ${error.message}`)
      }

      if (!data.session || !data.user) {
        throw new Error('No session data received from Supabase Auth')
      }

      logger.info('Supabase Auth login successful', {
        email: credentials.email,
        userId: data.user.id,
        expiresIn: data.session.expires_in,
        hasRefreshToken: !!data.session.refresh_token,
      })

      // Get user information from database
      const userInfo = await this.getUser(credentials.email)

      if (!userInfo) {
        throw new Error('User not found in database')
      }

      return {
        access_token: data.session.access_token,
        token_type: 'Bearer',
        expires_in: data.session.expires_in || 3600,
        refresh_token: data.session.refresh_token,
        scope: 'openid profile email',
        user_info: userInfo,
      }
    } catch (error) {
      logger.error('Supabase Auth login failed', {
        email: credentials.email,
        error: error instanceof Error ? error.message : String(error),
      })

      // Re-throw error with user-friendly message
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password')
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before logging in')
        }
        throw error
      }

      throw new Error('Authentication service unavailable')
    }
  },



  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<Omit<LoginResponse, 'user_info'>> {
    try {
      logger.info('Attempting to refresh Supabase Auth token')

      const supabase = getSupabaseAuth()

      // Refresh session with Supabase Auth
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      })

      if (error) {
        logger.error('Supabase Auth token refresh failed', {
          error: error.message,
        })
        throw new Error(`Token refresh failed: ${error.message}`)
      }

      if (!data.session) {
        throw new Error('No session data received from Supabase Auth')
      }

      logger.info('Supabase Auth token refresh successful', {
        expiresIn: data.session.expires_in,
      })

      return {
        access_token: data.session.access_token,
        token_type: 'Bearer',
        expires_in: data.session.expires_in || 3600,
        refresh_token: data.session.refresh_token ?? refreshToken,
        scope: 'openid profile email',
      }
    } catch (error) {
      logger.error('Supabase Auth token refresh failed', {
        error: error instanceof Error ? error.message : String(error),
      })

      if (error instanceof Error) {
        if (error.message.includes('Invalid Refresh Token') || error.message.includes('refresh_token_not_found')) {
          throw new Error('Refresh token is invalid or has expired')
        }
        throw error
      }

      throw new Error('Token refresh service unavailable')
    }
  },

  /**
   * Get user information from database by Auth User ID (Supabase Auth ID)
   */
  async getUserByAuthUserId(authUserId: string): Promise<User | null> {
    try {
      const user = await User.findByAuthUserId(authUserId)

      if (!user) {
        logger.warn('User not found in database', { authUserId })
        return null
      }

      return user
    } catch (error) {
      logger.error('Failed to get user from database', {
        authUserId,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  },

  /**
   * Deprecated: Use getUserByAuthUserId instead
   * Kept for backward compatibility during migration
   */
  async getUserByAuth0Id(authUserId: string): Promise<User | null> {
    return this.getUserByAuthUserId(authUserId)
  },

  /**
   * Get detailed session information
   */
  async getSessionInfo(authUserId: string, token: string): Promise<SessionInfo> {
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
      const user = await this.getUserByAuthUserId(authUserId)

      if (!user) {
        throw new Error('User not found in database')
      }

      logger.info('Session info retrieved', {
        authUserId,
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
        authUserId,
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
          authUserId: true,
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
        sub: user.authUserId,
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
   * Create a new user account in Supabase Auth and local database
   */
  async signup(signupData: SignupRequest): Promise<{ user: User; message: string }> {
    try {
      logger.info('Starting signup process with Supabase Auth', {
        email: signupData.email,
        name: signupData.name,
      })

      // Check if user already exists in our database
      const existingUser = await prisma.user.findUnique({
        where: { email: signupData.email.toLowerCase() },
      })

      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      const supabaseAdmin = getSupabaseAdmin()
      const defaultPassword = 'V@alorize'

      // Create user in Supabase Auth using Admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: signupData.email.toLowerCase(),
        password: defaultPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: signupData.name,
        },
      })

      if (authError || !authData.user) {
        logger.error('Failed to create user in Supabase Auth', {
          email: signupData.email,
          error: authError?.message,
        })
        throw new Error(`Failed to create user: ${authError?.message ?? 'Unknown error'}`)
      }

      logger.info('User created in Supabase Auth', {
        authUserId: authData.user.id,
        email: signupData.email,
      })

      // Create user in local database
      const newUser = User.create({
        authUserId: authData.user.id,
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
        authUserId: authData.user.id,
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

      // Handle specific Supabase Auth errors
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          throw new Error('User with this email already exists')
        }
        if (error.message.includes('Invalid email')) {
          throw new Error('Invalid email format')
        }
        if (error.message.includes('Password')) {
          throw new Error('Password does not meet requirements')
        }
      }

      throw error
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
  async getCompanyId(authUserId: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { authUserId },
        select: { companyId: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      return user.companyId
    } catch (error) {
      logger.error('Failed to get company ID', {
        authUserId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to retrieve company information')
    }
  },

  /**
   * Request password reset email using Supabase Auth
   * Sends a password reset email to the user with a magic link
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      logger.info('Requesting password reset', { email })

      const supabase = getSupabaseAuth()
      const redirectUrl = process.env.FRONTEND_PASSWORD_RESET_URL ?? `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) {
        logger.error('Failed to send password reset email', {
          email,
          error: error.message,
        })
        throw new Error(`Password reset failed: ${error.message}`)
      }

      logger.info('Password reset email sent', { email })

      return {
        message: 'Password reset instructions sent to your email',
      }
    } catch (error) {
      logger.error('Failed to request password reset', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  /**
   * Update user password using Supabase Admin API
   * Used for admin-initiated password resets (e.g., bulk user imports)
   */
  async updateUserPassword(authUserId: string, newPassword: string): Promise<{ message: string }> {
    try {
      logger.info('Updating user password', { authUserId })

      const supabaseAdmin = getSupabaseAdmin()

      const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: newPassword,
      })

      if (error) {
        logger.error('Failed to update user password', {
          authUserId,
          error: error.message,
        })
        throw new Error(`Password update failed: ${error.message}`)
      }

      logger.info('User password updated successfully', { authUserId })

      return {
        message: 'Password updated successfully',
      }
    } catch (error) {
      logger.error('Failed to update user password', {
        authUserId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  /**
   * Create admin user in Supabase Auth (for CSV imports and company creation)
   * Creates user with auto-confirmed email and sends password reset email
   */
  async createAdminUser(userData: { email: string; name: string; sendEmail?: boolean }): Promise<{ authUserId: string; ticketUrl: string; emailSent: boolean }> {
    try {
      const { sendEmail = true } = userData
      logger.info('Creating admin user in Supabase Auth', { email: userData.email, sendEmail })

      const supabaseAdmin = getSupabaseAdmin()
      const defaultPassword = 'V@alorize2024!'

      // Create user in Supabase Auth using Admin API
      // email_confirm is set to false to require email confirmation (Opção B do plano)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email.toLowerCase(),
        password: defaultPassword,
        email_confirm: false, // Require email confirmation
        user_metadata: {
          name: userData.name,
        },
      })

      if (authError || !authData.user) {
        logger.error('Failed to create admin user in Supabase Auth', {
          email: userData.email,
          error: authError?.message,
        })
        throw new Error(`Failed to create user: ${authError?.message ?? 'Unknown error'}`)
      }

      logger.info('Admin user created in Supabase Auth', {
        authUserId: authData.user.id,
        email: userData.email,
        emailConfirmRequired: true,
      })

      let emailSent = false
      const redirectUrl = process.env.FRONTEND_PASSWORD_RESET_URL ?? `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password`

      // Send password reset email only if sendEmail is true
      if (sendEmail) {
        const supabase = getSupabaseAuth()
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(userData.email.toLowerCase(), {
          redirectTo: redirectUrl,
        })

        if (resetError) {
          logger.error('Failed to send password reset email for new admin', {
            authUserId: authData.user.id,
            email: userData.email,
            error: resetError.message,
          })
          // Don't throw - user is created, just warn about email
          logger.warn('Admin user created but password reset email failed', {
            authUserId: authData.user.id,
            email: userData.email,
          })
        } else {
          logger.info('Password reset email sent to new admin', {
            authUserId: authData.user.id,
            email: userData.email,
          })
          emailSent = true
        }
      } else {
        logger.info('Skipping email send for new admin (sendEmail = false)', {
          authUserId: authData.user.id,
          email: userData.email,
        })
      }

      return {
        authUserId: authData.user.id,
        ticketUrl: redirectUrl,
        emailSent,
      }
    } catch (error) {
      logger.error('Failed to create admin user', {
        email: userData.email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  /**
   * Generate temporary password reset ticket for a user
   * Returns a URL that allows the user to set their password
   */
  async generateTemporaryPassword(authUserId: string): Promise<{ ticket_url: string }> {
    try {
      logger.info('Generating temporary password ticket', { authUserId })

      // Get user email from database
      const user = await prisma.user.findUnique({
        where: { authUserId },
        select: { email: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const supabase = getSupabaseAuth()
      const redirectUrl = process.env.FRONTEND_PASSWORD_RESET_URL ?? `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password`

      // Request password reset which generates a magic link
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: redirectUrl,
      })

      if (error) {
        logger.error('Failed to generate password reset ticket', {
          authUserId,
          email: user.email,
          error: error.message,
        })
        throw new Error(`Failed to generate password ticket: ${error.message}`)
      }

      logger.info('Password reset ticket generated', { authUserId, email: user.email })

      // Return the redirect URL as the ticket URL
      // In Supabase, the actual magic link is sent via email
      return {
        ticket_url: redirectUrl,
      }
    } catch (error) {
      logger.error('Failed to generate temporary password', {
        authUserId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  /**
   * Reset user password (sends password reset email and returns ticket URL)
   * Similar to generateTemporaryPassword but for existing users
   */
  async resetUserPassword(authUserId: string): Promise<{ message: string; ticket_url: string }> {
    try {
      logger.info('Resetting user password', { authUserId })

      // Get user email from database
      const user = await prisma.user.findUnique({
        where: { authUserId },
        select: { email: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Generate password reset ticket
      const ticket = await this.generateTemporaryPassword(authUserId)

      return {
        message: 'Password reset instructions sent to your email',
        ticket_url: ticket.ticket_url,
      }
    } catch (error) {
      logger.error('Failed to reset user password', {
        authUserId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  /**
   * Get instructions on how to refresh an access token
   */
  getRefreshInstructions(): {
    message: string
    endpoint: string
    method: string
    body: Record<string, string>
    example: string
  } {
    return {
      message: 'To refresh your access token, send a POST request to the /auth/refresh endpoint with your refresh token',
      endpoint: '/auth/refresh',
      method: 'POST',
      body: {
        refresh_token: 'your_refresh_token_here',
      },
      example: 'curl -X POST http://localhost:3000/auth/refresh -H "Content-Type: application/json" -d \'{"refresh_token": "your_refresh_token"}\'',
    }
  },

}
