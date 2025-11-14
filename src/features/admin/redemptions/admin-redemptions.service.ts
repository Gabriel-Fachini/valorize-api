import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'
import { PRODUCT_STATUS, NON_CANCELABLE_STATUSES, type RedemptionStatus } from '@/features/app/prizes/redemptions/redemption.constants'
import type {
  RedemptionListFilters,
  RedemptionListItem,
  RedemptionDetailsResponse,
  CancelRedemptionResult,
} from './types'

export const adminRedemptionsService = {
  /**
   * List company redemptions with filters
   * Supports filtering by status and prize type
   * Search field searches both user name and prize name (case-insensitive, partial match)
   */
  async listRedemptions(
    companyId: string,
    filters: RedemptionListFilters,
  ): Promise<{ items: RedemptionListItem[]; total: number }> {
    try {
      const where: Prisma.RedemptionWhereInput = { companyId }

      if (filters.status) {
        // Cast status string to RedemptionStatus enum
        where.status = filters.status as any
      }

      // Search by user name OR prize name (case-insensitive partial match)
      if (filters.search) {
        where.OR = [
          {
            user: {
              name: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          },
          {
            prize: {
              name: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          },
        ]
      }

      // Build prize type filter if needed
      if (filters.type) {
        where.prize = {
          type: filters.type,
        }
      }

      const limit = filters.limit ?? 20
      const offset = filters.offset ?? 0

      const [redemptions, total] = await Promise.all([
        prisma.redemption.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            prize: {
              select: {
                id: true,
                name: true,
                type: true,
                images: true,
              },
            },
          },
          orderBy: { redeemedAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.redemption.count({ where }),
      ])

      const items: RedemptionListItem[] = redemptions.map(r => ({
        id: r.id,
        userId: r.userId,
        userName: r.user.name,
        userEmail: r.user.email,
        userAvatar: r.user.avatar,
        prizeId: r.prizeId,
        prizeName: r.prize.name,
        prizeType: r.prize.type,
        prizeImage: r.prize.images.length > 0 ? r.prize.images[0] : null,
        status: r.status,
        coinsSpent: r.coinsSpent,
        redeemedAt: r.redeemedAt,
        trackingCode: r.trackingCode,
      }))

      logger.info('Listed company redemptions', {
        companyId,
        filters,
        total,
        returned: items.length,
      })

      return { items, total }
    } catch (error) {
      logger.error('Error listing redemptions', { error, companyId, filters })
      throw new Error('Failed to list redemptions')
    }
  },

  /**
   * Get complete details of a redemption including user, prize, and tracking history
   */
  async getRedemptionDetails(
    redemptionId: string,
    companyId: string,
  ): Promise<RedemptionDetailsResponse> {
    try {
      const redemption = await prisma.redemption.findUnique({
        where: { id: redemptionId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          prize: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
            },
          },
          voucherRedemption: {
            select: {
              provider: true,
              voucherCode: true,
              voucherLink: true,
              status: true,
              completedAt: true,
            },
          },
          tracking: {
            select: {
              id: true,
              status: true,
              notes: true,
              createdBy: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (!redemption) {
        throw new Error('Redemption not found')
      }

      if (redemption.companyId !== companyId) {
        throw new Error('Unauthorized: redemption belongs to another company')
      }

      // Transform voucherRedemption to convert nulls to undefined
      const voucherRedemption = redemption.voucherRedemption
        ? {
            provider: redemption.voucherRedemption.provider,
            voucherCode: redemption.voucherRedemption.voucherCode ?? undefined,
            voucherLink: redemption.voucherRedemption.voucherLink ?? undefined,
            status: redemption.voucherRedemption.status,
            completedAt: redemption.voucherRedemption.completedAt ?? undefined,
          }
        : undefined

      const response: RedemptionDetailsResponse = {
        id: redemption.id,
        userId: redemption.userId,
        user: redemption.user,
        prizeId: redemption.prizeId,
        prize: redemption.prize,
        variantId: redemption.variantId,
        variant: redemption.variant,
        status: redemption.status,
        coinsSpent: redemption.coinsSpent,
        redeemedAt: redemption.redeemedAt,
        addressId: redemption.addressId,
        trackingCode: redemption.trackingCode,
        trackingCarrier: undefined, // TODO: add to redemption model if needed
        notes: undefined, // TODO: add to redemption model if needed
        voucherRedemption,
        tracking: redemption.tracking,
      }

      logger.info('Retrieved redemption details', { redemptionId, companyId })

      return response
    } catch (error) {
      logger.error('Error getting redemption details', {
        error,
        redemptionId,
        companyId,
      })
      throw error
    }
  },

  /**
   * Update redemption status and optionally add notes via tracking entry
   */
  async updateRedemptionStatus(
    redemptionId: string,
    newStatus: RedemptionStatus,
    companyId: string,
    adminUserId: string,
    notes?: string,
  ): Promise<void> {
    try {
      const redemption = await prisma.redemption.findUnique({
        where: { id: redemptionId },
      })

      if (!redemption) {
        throw new Error('Redemption not found')
      }

      if (redemption.companyId !== companyId) {
        throw new Error('Unauthorized: redemption belongs to another company')
      }

      await prisma.$transaction(async tx => {
        // Update redemption status
        await tx.redemption.update({
          where: { id: redemptionId },
          data: { status: newStatus },
        })

        // Create tracking entry
        await tx.redemptionTracking.create({
          data: {
            id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            redemptionId,
            status: newStatus,
            notes: notes ?? null,
            createdBy: adminUserId,
          },
        })
      })

      logger.info('Updated redemption status', {
        redemptionId,
        newStatus,
        adminUserId,
        notes,
      })
    } catch (error) {
      logger.error('Error updating redemption status', {
        error,
        redemptionId,
        newStatus,
      })
      throw error
    }
  },

  /**
   * Add tracking code and carrier information to a redemption
   */
  async addTrackingCode(
    redemptionId: string,
    trackingCode: string,
    companyId: string,
    adminUserId: string,
    carrier?: string,
    notes?: string,
  ): Promise<void> {
    try {
      const redemption = await prisma.redemption.findUnique({
        where: { id: redemptionId },
      })

      if (!redemption) {
        throw new Error('Redemption not found')
      }

      if (redemption.companyId !== companyId) {
        throw new Error('Unauthorized: redemption belongs to another company')
      }

      const trackingNotes = carrier
        ? `${carrier} - ${trackingCode}${notes ? ` | ${notes}` : ''}`
        : trackingCode + (notes ? ` | ${notes}` : '')

      await prisma.$transaction(async tx => {
        // Update tracking code on redemption
        await tx.redemption.update({
          where: { id: redemptionId },
          data: { trackingCode },
        })

        // Create tracking entry
        await tx.redemptionTracking.create({
          data: {
            id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            redemptionId,
            status: redemption.status, // Use current redemption status for audit trail
            notes: `[TRACKING] ${trackingNotes ?? ''}`,
            createdBy: adminUserId,
          },
        })
      })

      logger.info('Added tracking code to redemption', {
        redemptionId,
        trackingCode,
        carrier,
        adminUserId,
      })
    } catch (error) {
      logger.error('Error adding tracking code', {
        error,
        redemptionId,
        trackingCode,
      })
      throw error
    }
  },

  /**
   * Add admin note to redemption via tracking entry
   */
  async addAdminNote(
    redemptionId: string,
    note: string,
    companyId: string,
    adminUserId: string,
  ): Promise<void> {
    try {
      const redemption = await prisma.redemption.findUnique({
        where: { id: redemptionId },
      })

      if (!redemption) {
        throw new Error('Redemption not found')
      }

      if (redemption.companyId !== companyId) {
        throw new Error('Unauthorized: redemption belongs to another company')
      }

      await prisma.redemptionTracking.create({
        data: {
          id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          redemptionId,
          status: redemption.status, // Use current redemption status for audit trail
          notes: `[ADMIN NOTE] ${note}`,
          createdBy: adminUserId,
        },
      })

      logger.info('Added admin note to redemption', {
        redemptionId,
        adminUserId,
      })
    } catch (error) {
      logger.error('Error adding admin note', { error, redemptionId })
      throw error
    }
  },

  /**
   * Cancel a redemption and refund coins + budget
   * Atomic transaction with complete rollback on error
   */
  async cancelRedemptionByAdmin(
    redemptionId: string,
    companyId: string,
    adminUserId: string,
    reason?: string,
  ): Promise<CancelRedemptionResult> {
    try {
      const redemption = await prisma.redemption.findUnique({
        where: { id: redemptionId },
        include: { prize: true },
      })

      if (!redemption) {
        throw new Error('Redemption not found')
      }

      if (redemption.companyId !== companyId) {
        throw new Error('Unauthorized: redemption belongs to another company')
      }

      // Prevent cancellation of certain statuses
      if (NON_CANCELABLE_STATUSES.has(redemption.status as any)) {
        throw new Error(
          `Cannot cancel redemption with status: ${redemption.status}`,
        )
      }

      const result = await prisma.$transaction(async tx => {
        const coinsToRefund = redemption.coinsSpent
        const budgetToRefund = coinsToRefund * 0.06 // Fixed conversion rate

        // 1. Get user's wallet for transaction audit
        const wallet = await tx.wallet.findUnique({
          where: { userId: redemption.userId },
        })

        if (!wallet) {
          throw new Error('User wallet not found')
        }

        // 2. Refund coins to user's redeemable balance
        const updatedWallet = await tx.wallet.update({
          where: { userId: redemption.userId },
          data: {
            redeemableBalance: {
              increment: coinsToRefund,
            },
          },
        })

        // 3. Create wallet transaction record for audit
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: redemption.userId,
            transactionType: 'CREDIT',
            balanceType: 'REDEEMABLE',
            amount: coinsToRefund,
            previousBalance: updatedWallet.redeemableBalance - coinsToRefund,
            newBalance: updatedWallet.redeemableBalance,
            reason: `Refund - Redemption ${redemptionId} cancelled by admin`,
            metadata: {
              redemptionId,
              reason: reason ?? 'No reason provided',
            },
          },
        })

        // 4. Refund budget to company wallet
        await tx.companyWallet.update({
          where: { companyId },
          data: {
            balance: {
              increment: budgetToRefund,
            },
          },
        })

        // 5. Restore prize stock if applicable
        if (redemption.prize.type === 'product' && redemption.prize.stock) {
          await tx.prize.update({
            where: { id: redemption.prizeId },
            data: {
              stock: {
                increment: 1,
              },
            },
          })
        }

        // 6. Update redemption status
        await tx.redemption.update({
          where: { id: redemptionId },
          data: { status: PRODUCT_STATUS.CANCELLED },
        })

        // 7. Create final tracking entry
        await tx.redemptionTracking.create({
          data: {
            id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            redemptionId,
            status: PRODUCT_STATUS.CANCELLED,
            notes: `Cancelled by admin. Reason: ${reason ?? 'No reason provided'}. Refunded ${coinsToRefund} coins and R$ ${budgetToRefund.toFixed(2)}`,
            createdBy: adminUserId,
          },
        })

        return {
          redemptionId,
          coinsRefunded: coinsToRefund,
          budgetRefunded: budgetToRefund,
          message: `Redemption cancelled successfully. Refunded ${coinsToRefund} coins and R$ ${budgetToRefund.toFixed(2)} to company budget.`,
        }
      })

      logger.info('Cancelled redemption by admin', {
        redemptionId,
        coinsRefunded: result.coinsRefunded,
        budgetRefunded: result.budgetRefunded,
        adminUserId,
        reason,
      })

      return result
    } catch (error) {
      logger.error('Error cancelling redemption', {
        error,
        redemptionId,
        companyId,
      })
      throw error
    }
  },
}
