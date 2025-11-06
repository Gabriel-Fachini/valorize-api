import { logger } from '@/lib/logger'
import { prisma } from '@/lib/database'
import { RedemptionModel } from './redemption.model'
import { RedemptionTrackingModel } from './redemption-tracking.model'
import { WalletModel } from '@/features/wallets/wallet.model'
import { AddressModel } from '@/features/addresses/address.model'
import { VoucherProviderFactory } from '@/lib/voucher-providers'

interface RedeemPrizeInput {
  userId: string
  prizeId: string
  variantId?: string
  companyId: string
  addressId?: string // Agora opcional (não precisa para vouchers)
  campaignId?: string // Opcional: ID da campaign template (apenas para vouchers)
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
    const { userId, prizeId, variantId, companyId, addressId, campaignId } = input

    return prisma.$transaction(async (tx) => {
      // 1. Buscar prêmio com lock
      const prize = await tx.prize.findFirst({
        where: { id: prizeId, isActive: true },
        include: {
          variants: true,
          voucherPrize: true, // Carregar dados do voucher se existir
        },
      })

      if (!prize) {
        throw new Error('Prize not found or is not active')
      }

      // Verificar se prêmio é global ou da empresa
      if (prize.companyId && prize.companyId !== companyId) {
        throw new Error('Prize does not belong to this company')
      }

      // Detectar categoria do prêmio
      const isVoucher = prize.category === 'voucher'

      // 2. Validar endereço (obrigatório apenas para produtos físicos)
      if (!isVoucher) {
        if (!addressId) {
          throw new Error('Address is required for physical products')
        }

        const address = await AddressModel.findById(addressId)
        if (!address) {
          throw new Error('Address not found')
        }

        if (address.userId !== userId) {
          throw new Error('Address does not belong to this user')
        }
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
          addressId: addressId ?? null, // Pode ser null para vouchers
        },
        tx,
      )

      // 8. Se for voucher, criar DIRETO (síncrono)
      if (isVoucher) {
        // Validar campos obrigatórios do voucher
        if (!prize.voucherPrize) {
          throw new Error('Prize is missing voucher configuration')
        }

        // Obter dados do usuário para email
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        })

        if (!user) {
          throw new Error('User not found')
        }

        try {
          logger.info('[RedemptionService] Creating voucher synchronously', {
            redemptionId: redemption.id,
            provider: prize.voucherPrize.provider,
            productId: prize.voucherPrize.externalId,
          })

          // Criar voucher via provider
          const voucherProvider = VoucherProviderFactory.create(prize.voucherPrize.provider)

          const voucherResult = await voucherProvider.createVoucher({
            externalId: redemption.id, // Usar redemptionId para idempotência
            productId: prize.voucherPrize.externalId,
            amount: prize.voucherPrize.minValue.toNumber(),
            currency: prize.voucherPrize.currency,
            recipient: {
              name: user.name ?? '',
              email: user.email,
            },
            campaignId,
          })

          logger.info('[RedemptionService] Voucher created successfully', {
            redemptionId: redemption.id,
            orderId: voucherResult.orderId,
            voucherLink: voucherResult.link,
          })

          // Criar registro na tabela VoucherRedemption
          await tx.voucherRedemption.create({
            data: {
              redemptionId: redemption.id,
              provider: prize.voucherPrize.provider,
              providerOrderId: voucherResult.orderId,
              providerRewardId: voucherResult.rewardId,
              voucherLink: voucherResult.link,
              voucherCode: voucherResult.code ?? null,
              amount: prize.voucherPrize.minValue,
              currency: prize.voucherPrize.currency,
              status: 'completed',
              completedAt: new Date(),
              expiresAt: voucherResult.expiresAt ?? null,
            },
          })

          // Atualizar status da redemption para completed
          await tx.redemption.update({
            where: { id: redemption.id },
            data: { status: 'completed' },
          })

          // Criar tracking de sucesso
          await RedemptionTrackingModel.create(
            {
              redemptionId: redemption.id,
              status: 'completed',
              notes: 'Voucher criado com sucesso',
              createdBy: userId,
            },
            tx,
          )
        } catch (error: any) {
          logger.error('[RedemptionService] Failed to create voucher', {
            redemptionId: redemption.id,
            error: error.message,
          })

          // Criar registro de falha
          await tx.voucherRedemption.create({
            data: {
              redemptionId: redemption.id,
              provider: prize.voucherPrize.provider,
              amount: prize.voucherPrize.minValue,
              currency: prize.voucherPrize.currency,
              status: 'failed',
              errorMessage: error.message,
            },
          })

          // Marcar redemption como failed
          await tx.redemption.update({
            where: { id: redemption.id },
            data: { status: 'failed' },
          })

          // Criar tracking de erro
          await RedemptionTrackingModel.create(
            {
              redemptionId: redemption.id,
              status: 'failed',
              notes: `Erro ao criar voucher: ${error.message}`,
              createdBy: userId,
            },
            tx,
          )

          throw error
        }
      } else {
        // Produto físico: criar tracking pending
        await RedemptionTrackingModel.create(
          {
            redemptionId: redemption.id,
            status: 'pending',
            notes: 'Resgate realizado com sucesso',
            createdBy: userId,
          },
          tx,
        )
      }

      logger.info('Prize redeemed successfully', {
        redemptionId: redemption.id,
        userId,
        prizeId,
        variantId,
        coinsSpent: finalPrice,
        isVoucher,
      })

      return redemption.toJSON()
    }, { timeout: 30000 }) // 30s timeout (voucher API pode demorar)
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

