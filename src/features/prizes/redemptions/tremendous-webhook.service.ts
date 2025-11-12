import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import type { TremendousWebhookPayload } from './tremendous-webhook.types'
import { VOUCHER_STATUS, TREMENDOUS_WEBHOOK_EVENTS } from './redemption.constants'

export const tremendousWebhookService = {
  /**
   * Process incoming webhook from Tremendous
   * Handles delivery success/failure events and updates redemption status
   */
  async processWebhook(payload: TremendousWebhookPayload): Promise<void> {
    try {
      const { event, uuid, payload: webhookData } = payload
      const rewardId = webhookData.resource.id

      // Log webhook event for idempotency and debugging
      await this.logWebhookEvent(uuid, event, payload)

      // Process based on event type
      switch (event) {
        case TREMENDOUS_WEBHOOK_EVENTS.DELIVERY_SUCCEEDED:
          await this.handleDeliverySucceeded(rewardId)
          break

        case TREMENDOUS_WEBHOOK_EVENTS.DELIVERY_FAILED:
          await this.handleDeliveryFailed(rewardId)
          break

        case TREMENDOUS_WEBHOOK_EVENTS.CANCELED:
          await this.handleCanceled(rewardId)
          break

        case TREMENDOUS_WEBHOOK_EVENTS.FLAGGED:
          await this.handleFlagged(rewardId)
          break

        default:
          logger.warn('Unknown Tremendous webhook event', { event, uuid })
      }

      logger.info('Webhook processed successfully', { event, uuid, rewardId })
    } catch (error) {
      logger.error('Failed to process Tremendous webhook', { error, payload })
      throw error
    }
  },

  /**
   * Handle successful reward delivery via email
   * Updates VoucherRedemption status to SENT
   */
  async handleDeliverySucceeded(rewardId: string): Promise<void> {
    const voucherRedemption = await prisma.voucherRedemption.findFirst({
      where: { providerRewardId: rewardId },
      include: { redemption: true },
    })

    if (!voucherRedemption) {
      logger.warn('VoucherRedemption not found for reward', { rewardId })
      return
    }

    await prisma.voucherRedemption.update({
      where: { id: voucherRedemption.id },
      data: { status: VOUCHER_STATUS.SENT },
    })

    logger.info('Voucher marked as sent', {
      voucherId: voucherRedemption.id,
      rewardId,
    })
  },

  /**
   * Handle failed reward delivery
   * Updates VoucherRedemption status to FAILED and refunds coins
   */
  async handleDeliveryFailed(rewardId: string): Promise<void> {
    const voucherRedemption = await prisma.voucherRedemption.findFirst({
      where: { providerRewardId: rewardId },
      include: { redemption: true },
    })

    if (!voucherRedemption) {
      logger.warn('VoucherRedemption not found for reward', { rewardId })
      return
    }

    const { redemption } = voucherRedemption

    // Update voucher status to FAILED
    await prisma.voucherRedemption.update({
      where: { id: voucherRedemption.id },
      data: { status: VOUCHER_STATUS.FAILED },
    })

    // Refund coins to user's redeemable balance
    const wallet = await prisma.wallet.update({
      where: { userId: redemption.userId },
      data: {
        redeemableBalance: {
          increment: redemption.coinsSpent,
        },
      },
    })

    // Create wallet transaction for audit trail
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: redemption.userId,
        transactionType: 'CREDIT',
        balanceType: 'REDEEMABLE',
        amount: redemption.coinsSpent,
        previousBalance: wallet.redeemableBalance - redemption.coinsSpent,
        newBalance: wallet.redeemableBalance,
        reason: `Voucher delivery failed for reward ${rewardId}`,
        metadata: {
          redemptionId: redemption.id,
          voucherId: voucherRedemption.id,
        },
      },
    })

    logger.info('Voucher marked as failed and coins refunded', {
      voucherId: voucherRedemption.id,
      rewardId,
      coinsRefunded: redemption.coinsSpent,
    })
  },

  /**
   * Handle reward cancellation
   */
  async handleCanceled(rewardId: string): Promise<void> {
    logger.info('Reward canceled', { rewardId })
    // Could implement additional logic here if needed
  },

  /**
   * Handle fraud flag
   */
  async handleFlagged(rewardId: string): Promise<void> {
    logger.warn('Reward flagged for fraud review', { rewardId })
    // Could implement additional logic here if needed
  },

  /**
   * Log webhook event for idempotency and debugging
   * Prevents duplicate processing of the same webhook
   */
  async logWebhookEvent(
    webhookUuid: string,
    event: string,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      await prisma.tremendousWebhookLog.upsert({
        where: { webhookUuid },
        update: { processed: true },
        create: {
          webhookUuid,
          event,
          payload,
          processed: true,
        },
      })
    } catch (error) {
      logger.error('Failed to log webhook event', { error, webhookUuid })
      throw error
    }
  },

  /**
   * Check if webhook has already been processed (for idempotency)
   */
  async isWebhookProcessed(webhookUuid: string): Promise<boolean> {
    const log = await prisma.tremendousWebhookLog.findUnique({
      where: { webhookUuid },
    })
    return !!log?.processed
  },
}
