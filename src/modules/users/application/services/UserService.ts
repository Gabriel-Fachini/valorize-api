import { User } from '../../domain/entities/User'
import { UserRepository } from '../../domain/repositories/UserRepository'
import { AuthenticatedUser } from '@shared/presentation/middlewares/auth0Middleware'
import { logger } from '@shared/infrastructure/logger/Logger'
import axios from 'axios'

export interface SignUpResult {
  user: User
  isNewUser: boolean
}

export interface LoginResult {
  user: User
  lastLoginAt: Date
}

export interface Auth0TokenResult {
  access_token: string
  token_type: string
  expires_in: number
  user: User
  lastLoginAt: Date
}

export interface AuthorizeUrlResult {
  authorizeUrl: string
  state: string
}

export interface CallbackRequest {
  code: string
  state: string
}

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async signUp(auth0User: AuthenticatedUser): Promise<SignUpResult> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByAuth0Id(auth0User.sub)
      
      if (existingUser) {
        logger.info('User already exists, returning existing user', {
          userId: existingUser.id,
          auth0Id: auth0User.sub
        })
        
        return {
          user: existingUser,
          isNewUser: false
        }
      }

      // Validate required Auth0 user data
      if (!auth0User.email) {
        throw new Error('Email is required from Auth0 user data')
      }

      if (!auth0User.name && !auth0User.email) {
        throw new Error('Name or email is required from Auth0 user data')
      }

      // Create new user
      const newUser = User.create({
        auth0Id: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name || auth0User.email.split('@')[0], // Fallback to email prefix if name not provided
        isActive: true
      })

      const savedUser = await this.userRepository.save(newUser)

      logger.info('New user created successfully', {
        userId: savedUser.id,
        auth0Id: savedUser.auth0Id,
        email: savedUser.email
      })

      return {
        user: savedUser,
        isNewUser: true
      }

    } catch (error) {
      logger.error('Error during user signup', {
        auth0Id: auth0User.sub,
        email: auth0User.email,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async login(auth0User: AuthenticatedUser): Promise<LoginResult> {
    try {
      // Find user by Auth0 ID
      const user = await this.userRepository.findByAuth0Id(auth0User.sub)
      
      if (!user) {
        logger.warn('User not found during login, this might indicate they need to sign up first', {
          auth0Id: auth0User.sub,
          email: auth0User.email
        })
        throw new Error('User not found. Please sign up first.')
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn('Inactive user attempted to login', {
          userId: user.id,
          auth0Id: auth0User.sub
        })
        throw new Error('User account is deactivated. Please contact support.')
      }

      // Update user profile if Auth0 data has changed
      let hasChanges = false
      
      if (auth0User.email && user.email !== auth0User.email.toLowerCase()) {
        logger.info('User email updated from Auth0', {
          userId: user.id,
          oldEmail: user.email,
          newEmail: auth0User.email
        })
        // Note: For email changes, we might want to create a separate method
        // For now, we'll just log it as this requires more complex business logic
      }

      if (auth0User.name && user.name !== auth0User.name) {
        logger.info('User name updated from Auth0', {
          userId: user.id,
          oldName: user.name,
          newName: auth0User.name
        })
        user.updateName(auth0User.name)
        hasChanges = true
      }

      // Save changes if any
      let updatedUser = user
      if (hasChanges) {
        updatedUser = await this.userRepository.save(user)
      }

      logger.info('User login successful', {
        userId: updatedUser.id,
        auth0Id: auth0User.sub,
        email: updatedUser.email
      })

      return {
        user: updatedUser,
        lastLoginAt: new Date()
      }

    } catch (error) {
      logger.error('Error during user login', {
        auth0Id: auth0User.sub,
        email: auth0User.email,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async getUserProfile(auth0Id: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findByAuth0Id(auth0Id)
      
      if (user && !user.isActive) {
        logger.warn('Inactive user profile requested', {
          userId: user.id,
          auth0Id
        })
        return null
      }

      return user
    } catch (error) {
      logger.error('Error fetching user profile', {
        auth0Id,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Generates authorization URL for Auth0 login
   */
  async generateAuthorizationUrl(redirectUri: string): Promise<AuthorizeUrlResult> {
    try {
      const auth0Domain = process.env.AUTH0_DOMAIN
      const clientId = process.env.AUTH0_CLIENT_ID

      if (!auth0Domain || !clientId) {
        throw new Error('Auth0 configuration is missing')
      }

      // Generate a random state for CSRF protection
      const state = this.generateRandomString(32)
      
      // Build authorization URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state: state,
        audience: process.env.AUTH0_AUDIENCE || ''
      })

      const authorizeUrl = `https://${auth0Domain}/authorize?${params.toString()}`

      logger.info('Authorization URL generated', {
        state,
        redirectUri
      })

      return {
        authorizeUrl,
        state
      }

    } catch (error) {
      logger.error('Error generating authorization URL', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Exchanges authorization code for access token
   */
  async exchangeCodeForToken(request: CallbackRequest, redirectUri: string): Promise<Auth0TokenResult> {
    try {
      const { code, state } = request

      if (!code || !state) {
        throw new Error('Authorization code and state are required')
      }

      const auth0Domain = process.env.AUTH0_DOMAIN
      const clientId = process.env.AUTH0_CLIENT_ID
      const clientSecret = process.env.AUTH0_CLIENT_SECRET

      if (!auth0Domain || !clientId || !clientSecret) {
        throw new Error('Auth0 configuration is missing')
      }

      // Exchange code for token
      const tokenResponse = await axios.post(`https://${auth0Domain}/oauth/token`, {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const { access_token, token_type, expires_in } = tokenResponse.data

      // Get user profile from Auth0
      const userResponse = await axios.get(`https://${auth0Domain}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })

      const auth0UserProfile = userResponse.data

      // Create AuthenticatedUser object
      const authenticatedUser: AuthenticatedUser = {
        sub: auth0UserProfile.sub,
        email: auth0UserProfile.email,
        email_verified: auth0UserProfile.email_verified,
        name: auth0UserProfile.name,
        picture: auth0UserProfile.picture,
        ...auth0UserProfile
      }

      // Check if user exists in our database, if not create them
      let user: User
      const existingUser = await this.userRepository.findByAuth0Id(authenticatedUser.sub)
      
      if (!existingUser) {
        // Auto sign up the user
        const signUpResult = await this.signUp(authenticatedUser)
        user = signUpResult.user
        
        logger.info('New user auto-created during authorization code flow', {
          userId: user.id,
          email: user.email
        })
      } else {
        // Use existing user and update login
        const loginResult = await this.login(authenticatedUser)
        user = loginResult.user
      }

      logger.info('Authorization code exchange successful', {
        userId: user.id,
        email: user.email
      })

      return {
        access_token,
        token_type,
        expires_in,
        user,
        lastLoginAt: new Date()
      }

    } catch (error: any) {
      logger.error('Authorization code exchange failed', {
        error: error?.response?.data || error.message
      })

      // Handle specific Auth0 errors
      if (error?.response?.status === 400) {
        const errorData = error?.response?.data
        if (errorData?.error === 'invalid_grant') {
          throw new Error('Invalid or expired authorization code')
        }
        if (errorData?.error === 'invalid_client') {
          throw new Error('Invalid client configuration')
        }
      }

      throw new Error(error?.response?.data?.error_description || 'Token exchange failed')
    }
  }

  /**
   * Generates a random string for state parameter
   */
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return result
  }
} 