import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '@/lib/logger'
import { validateTremendousWebhookSignature } from './tremendous-webhook.validator'
import { tremendousWebhookService } from './tremendous-webhook.service'
import type { TremendousWebhookPayload } from './tremendous-webhook.types'

async function tremendousWebhookRoutes(fastify: FastifyInstance) {
  const secret = process.env.TREMENDOUS_WEBHOOK_SECRET

  if (!secret) {
    logger.warn('TREMENDOUS_WEBHOOK_SECRET not configured, webhook validation will be disabled')
  }

  /**
   * POST /webhooks/tremendous
   * Receive webhooks from Tremendous about reward events
   *
   * Events handled:
   * - REWARDS.DELIVERY.SUCCEEDED: Email delivered to recipient
   * - REWARDS.DELIVERY.FAILED: Email delivery failed
   * - REWARDS.CANCELED: Reward was canceled
   * - REWARDS.FLAGGED: Reward flagged for fraud review
   */
  fastify.post<{ Body: TremendousWebhookPayload }>('/webhooks/tremendous', async (request: any, reply) => {
    try {
      const uuid = request.body?.uuid

      // Validate webhook signature if secret is configured
      if (secret) {
        const signature = request.headers['tremendous-webhook-signature'] as string | undefined
        const rawBody = request.rawBody as Buffer | undefined

        // Check if we have both signature and body
        if (!signature) {
          logger.warn('Webhook missing signature header', { uuid })
          return reply.status(401).send({ error: 'Missing signature' })
        }

        if (!rawBody) {
          logger.error('Webhook missing raw body - cannot validate signature', { uuid })
          return reply.status(400).send({ error: 'Invalid request' })
        }

        // Validate the signature
        const isValid = validateTremendousWebhookSignature(signature, rawBody, secret)

        if (!isValid) {
          logger.warn('Invalid Tremendous webhook signature', {
            uuid,
            hasSignature: !!signature,
            signatureFormat: signature?.substring(0, 10),
            bodyLength: rawBody?.length,
            isDevelopment: process.env.NODE_ENV !== 'production',
          })

          // In development, provide more details for debugging
          if (process.env.NODE_ENV !== 'production' || process.env.WEBHOOK_SKIP_VALIDATION === 'true') {
            logger.debug('Webhook signature mismatch details (DEV MODE)', {
              uuid,
              signature: signature?.substring(0, 30) + '...',
              bodyPreview: rawBody.toString('utf-8').substring(0, 150),
              bodyHash: require('crypto')
                .createHmac('sha256', secret)
                .update(rawBody)
                .digest('hex')
                .substring(0, 20),
            })

            // Allow webhook processing in development mode if signature validation is skipped
            if (process.env.WEBHOOK_SKIP_VALIDATION === 'true') {
              logger.warn('Webhook validation SKIPPED (WEBHOOK_SKIP_VALIDATION=true) - DEV MODE ONLY', { uuid })
            } else {
              return reply.status(401).send({ error: 'Invalid signature' })
            }
          } else {
            // In production, reject invalid signatures
            return reply.status(401).send({ error: 'Invalid signature' })
          }
        }

        logger.info('Webhook signature validated successfully', { uuid })
      } else {
        logger.warn('Webhook signature validation disabled (TREMENDOUS_WEBHOOK_SECRET not configured)', { uuid })
      }

      const payload = request.body as TremendousWebhookPayload

      // Check for idempotency - skip if already processed
      const isProcessed = await tremendousWebhookService.isWebhookProcessed(payload.uuid)

      if (isProcessed) {
        logger.debug('Webhook already processed, returning 200', { uuid: payload.uuid })
        return reply.status(200).send({ status: 'already_processed' })
      }

      // Process the webhook asynchronously
      // Return 200 immediately to acknowledge receipt
      tremendousWebhookService
        .processWebhook(payload)
        .catch((error) => {
          logger.error('Error processing webhook in background', { error, uuid: payload.uuid })
        })

      reply.status(200).send({ status: 'received' })
    } catch (error) {
      logger.error('Error in webhook endpoint', { error })
      reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default tremendousWebhookRoutes
