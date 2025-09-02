import axios from 'axios'
import { logger } from '@shared/infrastructure/logger/Logger'

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
    picture?: string
    [key: string]: unknown
  }
}

export interface AuthError {
  error: string
  error_description?: string
  status_code?: number
}

export class AuthService {
  private readonly auth0Domain: string
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly audience?: string
  private readonly scope: string

  constructor() {
    const requiredEnvVars = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_AUDIENCE']
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`)
      }
    }

    this.auth0Domain = process.env.AUTH0_DOMAIN!
    this.clientId = process.env.AUTH0_CLIENT_ID!
    this.clientSecret = process.env.AUTH0_CLIENT_SECRET!
    this.audience = process.env.AUTH0_AUDIENCE!
    this.scope = process.env.AUTH0_SCOPE ?? 'openid profile email offline_access'
  }

  /**
   * Authenticate user using Resource Owner Password Grant
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      logger.info('Attempting Auth0 login', {
        email: credentials.email,
        domain: this.auth0Domain,
        clientId: this.clientId,
      })

      // Prepare the request body for Auth0's oauth/token endpoint
      const tokenRequestBody: Record<string, string> = {
        grant_type: 'password',
        username: credentials.email,
        password: credentials.password,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: this.scope,
        audience: this.audience!,
      }

      // Add audience if configured (for API access)
      if (this.audience) {
        console.log('🎯 Using audience:', this.audience)
        tokenRequestBody.audience = this.audience
      } else {
        console.log('⚠️ No audience configured - will return opaque token!')
      }
      
      console.log('📤 Token request body:', tokenRequestBody)

      // Make the token request to Auth0
      const tokenResponse = await axios.post(
        `https://${this.auth0Domain}/oauth/token`,
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
      
      // Check if token is JWT or opaque
      const isJWT = tokenData.access_token.includes('.')
      console.log('📥 Token received:', {
        isJWT,
        tokenStart: tokenData.access_token.substring(0, 50) + '...',
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
      })

      logger.info('Auth0 login successful', {
        email: credentials.email,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        hasRefreshToken: !!tokenData.refresh_token,
      })

      // Get user info using the access token
      const userInfo = await this.getUserInfo(tokenData.access_token)

      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type ?? 'Bearer',
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope ?? this.scope,
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
  }

  /**
   * Get user information from Auth0 userinfo endpoint
   */
  private async getUserInfo(accessToken: string): Promise<LoginResponse['user_info']> {
    try {
      const userInfoResponse = await axios.get(
        `https://${this.auth0Domain}/userinfo`,
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
        picture: userInfo.picture,
        ...userInfo, // Include any additional claims
      }
    } catch (error) {
      logger.warn('Failed to get user info from Auth0', {
        error: error instanceof Error ? error.message : String(error),
      })

      // Return minimal user info if userinfo endpoint fails
      // This shouldn't happen with valid tokens, but provides fallback
      throw new Error('Failed to retrieve user information')
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<Omit<LoginResponse, 'user_info'>> {
    try {
      logger.info('Attempting to refresh Auth0 token')

      // Prepare the refresh token request body
      const refreshRequestBody: Record<string, string> = {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }

      // Add audience if configured (for API access)
      if (this.audience) {
        refreshRequestBody.audience = this.audience
      }

      const refreshResponse = await axios.post(
        `https://${this.auth0Domain}/oauth/token`,
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
        scope: tokenData.scope ?? this.scope,
      }
    } catch (error) {
      logger.error('Auth0 token refresh failed', {
        error: error instanceof Error ? error.message : String(error),
      })

      logger.error('Refresh token error details', { errorData: axios.isAxiosError(error) ? error.response?.data : error })

      if (axios.isAxiosError(error)) {
        const authError = error.response?.data as AuthError
        
        if (authError?.error) {
          throw new Error(`Token refresh failed: ${authError.error_description ?? authError.error}`)
        }
        
        throw new Error(`Token refresh failed: HTTP ${error.response?.status}`)
      }

      throw new Error('Token refresh service unavailable')
    }
  }

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
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      
      // Check for required claims
      return !!(payload.sub && payload.exp)
    } catch {
      return false
    }
  }

  /**
   * Get Auth0 domain for client reference
   */
  getAuth0Domain(): string {
    return this.auth0Domain
  }

  /**
   * Get configured scope
   */
  getScope(): string {
    return this.scope
  }
}
