import { logger } from '@/lib/logger'
import { prisma } from '@/lib/database'
import { RedemptionModel } from './redemption.model'
import { RedemptionTrackingModel } from './redemption-tracking.model'
import { WalletModel } from '@/features/wallets/wallet.model'
import { AddressModel } from '@/features/addresses/address.model'

interface RedeemPrizeInput {
  userId: string
  prizeId: string
  variantId?: string
  companyId: string
  addressId: string
}

export class InsufficientBalanceError extends Error {
  constructor() {
    super('Insufficient redeemable balance')
    this.name = 'InsufficientBalanceError'
  }
}

export class InsufficientStockError extends Error {
  constructor() {
    super('Prize is out of stock')
    this.name = 'InsufficientStockError'
  }
}

export class CannotCancelShippedOrderError extends Error {
  constructor() {
    super('Cannot cancel order that has been shipped or delivered')
    this.name = 'CannotCancelShippedOrderError'
  }
}

export class CancellationPeriodExpiredError extends Error {
  constructor() {
    super('Cancellation period expired (max 3 days)')
    this.name = 'CancellationPeriodExpiredError'
  }
}

export class VariantRequiredError extends Error {
  constructor() {
    super('This prize has variants. You must select a variant to redeem')
    this.name = 'VariantRequiredError'
  }
}

export const redemptionService = {
  async redeemPrize(input: RedeemPrizeInput) {
    const { userId, prizeId, variantId, companyId, addressId } = input

    return prisma.$transaction(async (tx) => {
      // 1. Validate address belongs to user
      const address = await AddressModel.findById(addressId)
      if (!address) {
        throw new Error('Address not found')
      }

      if (address.userId !== userId) {
        throw new Error('Address does not belong to this user')
      }

      // 2. Buscar prêmio com lock
      const prize = await tx.prize.findFirst({
        where: { id: prizeId, isActive: true },
        include: { variants: true },
      })

      if (!prize) {
        throw new Error('Prize not found or is not active')
      }

      // Verificar se prêmio é global ou da empresa
      if (prize.companyId && prize.companyId !== companyId) {
        throw new Error('Prize does not belong to this company')
      }

      // Validar regra de negócio: se o prêmio tem variantes, uma deve ser selecionada
      const hasVariants = prize.variants && prize.variants.length > 0
      if (hasVariants && !variantId) {
        throw new VariantRequiredError()
      }

      // Se não tem variantes, não deve ter variantId
      if (!hasVariants && variantId) {
        throw new Error('This prize does not have variants')
      }

      // 3. Calcular preço final (fixo do prêmio, sem ajuste de variante)
      const finalPrice = prize.coinPrice

      // 4. Verificar saldo do usuário
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!wallet) {
        throw new Error('Wallet not found')
      }

      if (wallet.redeemableBalance < finalPrice) {
        throw new InsufficientBalanceError()
      }

      // 5. Atualização atômica de estoque (SOLUÇÃO RACE CONDITION)
      // Usa updateMany com WHERE condicional - só atualiza se tiver estoque
      let stockUpdate

      if (variantId) {
        // Resgatar variante específica
        const variant = prize.variants.find((v) => v.id === variantId)
        if (!variant) {
          throw new Error('Variant not found')
        }

        if (!variant.isActive) {
          throw new Error('Variant is not active')
        }

        stockUpdate = await tx.prizeVariant.updateMany({
          where: {
            id: variantId,
            stock: { gte: 1 },
            isActive: true,
          },
          data: {
            stock: { decrement: 1 },
          },
        })
      } else {
        // Resgatar prêmio sem variante
        stockUpdate = await tx.prize.updateMany({
          where: {
            id: prizeId,
            stock: { gte: 1 },
            isActive: true,
          },
          data: {
            stock: { decrement: 1 },
          },
        })
      }

      // Se count === 0, outro usuário pegou o último item
      if (stockUpdate.count === 0) {
        throw new InsufficientStockError()
      }

      // 6. Debitar moedas da carteira
      await WalletModel.debitRedeemableBalance(
        userId,
        finalPrice,
        tx,
        `Prize redemption: ${prize.name}`,
        {
          prizeId,
          prizeName: prize.name,
          variantId,
        },
      )

      // 7. Criar redemption
      const redemption = await RedemptionModel.create(
        {
          userId,
          prizeId,
          variantId: variantId ?? null,
          companyId,
          coinsSpent: finalPrice,
          addressId,
        },
        tx,
      )

      // 8. Criar primeiro tracking (pending)
      await RedemptionTrackingModel.create(
        {
          redemptionId: redemption.id,
          status: 'pending',
          notes: 'Resgate realizado com sucesso',
          createdBy: userId,
        },
        tx,
      )

      logger.info('Prize redeemed successfully', {
        redemptionId: redemption.id,
        userId,
        prizeId,
        variantId,
        coinsSpent: finalPrice,
      })

      return redemption.toJSON()
    })
  },

  async cancelRedemption(redemptionId: string, userId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const redemption = await tx.redemption.findUnique({
        where: { id: redemptionId },
        include: { prize: true, variant: true },
      })

      if (!redemption) {
        throw new Error('Redemption not found')
      }

      // Validação: apenas o usuário dono pode cancelar
      if (redemption.userId !== userId) {
        throw new Error('You can only cancel your own redemptions')
      }

      // Validação: não pode cancelar se já foi enviado ou entregue
      if (redemption.status === 'shipped' || redemption.status === 'delivered') {
        throw new CannotCancelShippedOrderError()
      }

      // Validação: limite de 3 dias
      const now = new Date()
      const redeemedAt = new Date(redemption.redeemedAt)
      const diffInMs = now.getTime() - redeemedAt.getTime()
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

      if (diffInDays > 3) {
        throw new CancellationPeriodExpiredError()
      }

      // 1. Devolver estoque
      if (redemption.variantId) {
        await tx.prizeVariant.update({
          where: { id: redemption.variantId },
          data: { stock: { increment: 1 } },
        })
      } else {
        await tx.prize.update({
          where: { id: redemption.prizeId },
          data: { stock: { increment: 1 } },
        })
      }

      // 2. Devolver moedas ao usuário
      await WalletModel.creditRedeemableBalance(
        userId,
        redemption.coinsSpent,
        tx,
        `Redemption cancelled: ${redemption.prize.name}`,
        {
          redemptionId,
          prizeId: redemption.prizeId,
          prizeName: redemption.prize.name,
          reason,
        },
      )

      // 3. Atualizar status da redemption
      await tx.redemption.update({
        where: { id: redemptionId },
        data: { status: 'cancelled' },
      })

      // 4. Criar tracking de cancelamento
      await RedemptionTrackingModel.create(
        {
          redemptionId,
          status: 'cancelled',
          notes: reason ?? 'Cancelled by user',
          createdBy: userId,
        },
        tx,
      )

      logger.info('Redemption cancelled successfully', {
        redemptionId,
        userId,
        reason,
      })

      return { success: true, message: 'Redemption cancelled successfully' }
    })
  },

  async getUserRedemptions(
    userId: string,
    pagination: { limit: number; offset: number },
  ) {
    try {
      const redemptions = await RedemptionModel.findByUserId(
        userId,
        pagination,
      )

      logger.info('User redemptions retrieved', {
        userId,
        count: redemptions.length,
      })

      return redemptions
    } catch (error) {
      logger.error('Error getting user redemptions', { error, userId })
      throw new Error('Failed to get user redemptions')
    }
  },

  async getRedemptionDetails(redemptionId: string, userId: string) {
    try {
      const redemption = await RedemptionModel.findById(redemptionId, true)

      if (!redemption) {
        throw new Error('Redemption not found')
      }

      if (redemption.userId !== userId) {
        throw new Error('Unauthorized access to redemption')
      }

      logger.info('Redemption details retrieved', { redemptionId, userId })

      return redemption.toJSON()
    } catch (error) {
      logger.error('Error getting redemption details', { error, redemptionId })
      throw error
    }
  },
}

