import { AuthenticatedUser } from '@shared/presentation/middlewares/auth0Middleware'
import { logger } from '@shared/infrastructure/logger/Logger'
import jwt from 'jsonwebtoken'

export interface SessionInfo {
  isValid: boolean
  user: AuthenticatedUser
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

export class SessionService {
  // Threshold in seconds - when token has less than this time remaining, suggest refresh
  private static readonly REFRESH_THRESHOLD = 5 * 60 // 5 minutes

  /**
   * Get detailed session information
   */
  async getSessionInfo(user: AuthenticatedUser, token: string): Promise<SessionInfo> {
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
      const needsRefresh = timeRemaining <= SessionService.REFRESH_THRESHOLD

      logger.info('Session info retrieved', {
        userId: user.sub,
        email: user.email,
        expiresAt: expiresAt.toISOString(),
        timeRemaining,
        needsRefresh,
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
        userId: user.sub,
        error: error instanceof Error ? error.message : String(error),
      })
      
      throw new Error('Failed to retrieve session information')
    }
  }

  /**
   * Validate token structure and expiration
   */
  validateToken(token: string): TokenValidationResult {
    try {
      // Decode without verification (just to check structure and expiration)
      const decoded = jwt.decode(token) as any
      
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

      const expiresAt = new Date(decoded.exp * 1000)
      const now = new Date()
      const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
      const expired = timeRemaining <= 0

      const user: AuthenticatedUser = {
        sub: decoded.sub,
        email: decoded.email,
        email_verified: decoded.email_verified,
        name: decoded.name,
        picture: decoded.picture,
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
  }

  /**
   * Generate refresh token instructions for Auth0
   */
  getRefreshInstructions(clientId?: string): {
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
  }

  /**
   * Check if token needs refresh based on remaining time
   */
  needsRefresh(timeRemaining: number): boolean {
    return timeRemaining <= SessionService.REFRESH_THRESHOLD
  }

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
  }
}
