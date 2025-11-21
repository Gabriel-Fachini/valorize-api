import { logger } from '@/lib/logger'
import { prisma } from '@/lib/database'
import { getSupabaseAuth } from '@/lib/supabase'
import type {
  SendWelcomeEmailResponse,
  BulkEmailSendResult,
  SendWelcomeEmailsBulkResponse,
} from './types'

export const userOnboardingService = {
  /**
   * Send or resend welcome email to a user
   * Validates email send count limit (max 3)
   */
  async sendWelcomeEmail(
    userId: string,
    requestedBy: string,
  ): Promise<SendWelcomeEmailResponse> {
    try {
      logger.info('Sending welcome email', { userId, requestedBy })

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          welcomeEmailSendCount: true,
          welcomeEmailSentAt: true,
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check send count limit
      if (user.welcomeEmailSendCount >= 3) {
        throw new Error(
          'Maximum email send limit (3) reached for this user',
        )
      }

      // Send email via Supabase
      const supabase = getSupabaseAuth()
      const redirectUrl =
        process.env.FRONTEND_PASSWORD_RESET_URL ??
        `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        user.email.toLowerCase(),
        {
          redirectTo: redirectUrl,
        },
      )

      if (resetError) {
        logger.error('Failed to send welcome email', {
          userId,
          email: user.email,
          error: resetError.message,
        })
        throw new Error(`Failed to send email: ${resetError.message}`)
      }

      // Update user record
      const now = new Date()
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          welcomeEmailSentAt: user.welcomeEmailSentAt ?? now, // Set only on first send
          lastWelcomeEmailSentAt: now,
          welcomeEmailSendCount: user.welcomeEmailSendCount + 1,
        },
      })

      logger.info('Welcome email sent successfully', {
        userId,
        email: user.email,
        sendCount: updatedUser.welcomeEmailSendCount,
      })

      return {
        message: 'Welcome email sent successfully',
        emailSendCount: updatedUser.welcomeEmailSendCount,
        lastSentAt: updatedUser.lastWelcomeEmailSentAt!,
      }
    } catch (error) {
      logger.error('Error sending welcome email', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  /**
   * Send welcome emails to multiple users
   */
  async sendWelcomeEmailsBulk(
    userIds: string[],
    requestedBy: string,
  ): Promise<SendWelcomeEmailsBulkResponse> {
    logger.info('Sending bulk welcome emails', {
      userCount: userIds.length,
      requestedBy,
    })

    const results: BulkEmailSendResult[] = []
    let sent = 0
    let failed = 0

    for (const userId of userIds) {
      try {
        const result = await this.sendWelcomeEmail(userId, requestedBy)
        results.push({
          userId,
          success: true,
          emailSendCount: result.emailSendCount,
        })
        sent++
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        results.push({ userId, success: false, error: errorMessage })
        failed++
        logger.warn('Failed to send email in bulk operation', {
          userId,
          error: errorMessage,
        })
      }
    }

    logger.info('Bulk email sending completed', {
      total: userIds.length,
      sent,
      failed,
    })

    return {
      message: `Sent ${sent} of ${userIds.length} emails`,
      results,
      summary: {
        total: userIds.length,
        sent,
        failed,
      },
    }
  },
}
