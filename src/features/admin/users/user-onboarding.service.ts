import { logger } from '@/lib/logger'
import { prisma } from '@/lib/database'
import { getSupabaseAdmin } from '@/lib/supabase'
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

      // Get user with authUserId and name
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          authUserId: true,
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

      const supabaseAdmin = getSupabaseAdmin()
      const redirectUrl =
        process.env.FRONTEND_ONBOARDING_URL ??
        process.env.FRONTEND_PASSWORD_RESET_URL ??
        `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/onboarding`

      // Send welcome email via Supabase Admin API
      // inviteUserByEmail creates the user in Supabase Auth AND sends the email
      // If user already exists, it just resends the invitation
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        user.email.toLowerCase(),
        {
          redirectTo: redirectUrl,
          data: {
            name: user.name, // Include user metadata
          },
        },
      )

      if (inviteError) {
        logger.error('Failed to send welcome email', {
          userId,
          email: user.email,
          error: inviteError.message,
        })

        // Check for rate limit error from Supabase
        if (inviteError.message.includes('rate limit')) {
          throw new Error(
            'Email rate limit exceeded. Supabase Free tier allows 30 emails/hour. Please wait a few minutes and try again, or upgrade to Pro tier for higher limits.'
          )
        }

        throw new Error(`Failed to send email: ${inviteError.message}`)
      }

      // Get authUserId from invite response
      // For new users: inviteData.user contains the created user
      // For existing users: we need to use the user's existing authUserId
      const finalAuthUserId = inviteData?.user?.id ?? user.authUserId

      if (!finalAuthUserId) {
        throw new Error('Failed to get auth user ID from Supabase')
      }

      logger.info('Welcome email sent successfully', {
        userId,
        email: user.email,
        authUserId: finalAuthUserId,
        wasNewUser: !user.authUserId,
      })

      // Update user record with authUserId and email tracking
      const now = new Date()
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          authUserId: finalAuthUserId, // Save authUserId from invite response
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
