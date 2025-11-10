import { logger } from '@/lib/logger'
import { prisma } from '@/lib/database'
import { RedemptionModel } from './redemption.model'
import { RedemptionTrackingModel } from './redemption-tracking.model'
import { WalletModel } from '@/features/wallets/wallet.model'
import { CompanyWalletModel } from '@/features/wallets/company-wallet.model'
import { AddressModel } from '@/features/addresses/address.model'
import { VoucherProviderFactory } from '@/lib/voucher-providers'
import { COIN_TO_BRL_RATE } from '@/features/economy/economy.constants'

interface RedeemPrizeInput {
  userId: string
  prizeId: string
  variantId?: string
  companyId: string
  addressId?: string // Agora opcional (não precisa para vouchers)
  campaignId?: string // Opcional: ID da campaign template (apenas para vouchers)
}

interface BulkRedeemVoucherItem {
  userId: string
  prizeId: string
  addressId?: string
}

interface BulkRedeemVoucherResult {
  userId: string
  email?: string
  prizeId: string
  success: boolean
  redemptionId?: string
  error?: string
}

interface Reservation {
  redemption: any
  prize: any
  voucherPrize: any
  user: any
  item: BulkRedeemVoucherItem
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
  /**
   * Validate that a user's email matches their database record
   */
  async validateUserEmailMatch(userId: string, email: string, companyId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error(`User ${userId} not found`)
    }

    if (user.email !== email) {
      throw new Error('Email does not match user record')
    }

    if (user.companyId !== companyId) {
      throw new Error('User does not belong to this company')
    }

    return user
  },

  /**
   * Validate that a custom amount is within the voucher's min/max range
   */
  validateCustomAmount(amount: number, voucherPrize: any) {
    const min = Number(voucherPrize.minValue)
    const max = Number(voucherPrize.maxValue)

    if (amount < min || amount > max) {
      throw new Error(`Amount must be between ${min} and ${max} ${voucherPrize.currency}`)
    }
  },

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

      // Detectar tipo do prêmio
      const isVoucher = prize.type === 'voucher'

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
      const hasVariants = (prize.variants as any[]) && (prize.variants as any[]).length > 0
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
        const variant = (prize.variants as any[]).find((v: any) => v.id === variantId)
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
        const voucherPrize = (prize as any).voucherPrize
        if (!voucherPrize) {
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
            provider: voucherPrize.provider,
            productId: voucherPrize.externalId,
          })

          // Criar voucher via provider
          const voucherProvider = VoucherProviderFactory.create(voucherPrize.provider)

          const voucherResult = await voucherProvider.createVoucher({
            externalId: redemption.id, // Usar redemptionId para idempotência
            productId: voucherPrize.externalId,
            amount: voucherPrize.minValue.toNumber(),
            currency: voucherPrize.currency,
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
              provider: voucherPrize.provider,
              providerOrderId: voucherResult.orderId,
              providerRewardId: voucherResult.rewardId,
              voucherLink: voucherResult.link,
              voucherCode: voucherResult.code ?? null,
              amount: voucherPrize.minValue,
              currency: voucherPrize.currency,
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
              provider: voucherPrize.provider,
              amount: voucherPrize.minValue,
              currency: voucherPrize.currency,
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
    }, { timeout: 8000 }) // 8s timeout (voucher API pode demorar)
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

  async bulkRedeemVouchers(
    prizeId: string,
    customAmount: number,
    companyId: string,
    users: Array<{ userId: string; email: string }>,
    campaignId?: string,
  ): Promise<BulkRedeemVoucherResult[]> {
    /**
     * Bulk redemption ADMINISTRATIVA para vouchers digitais (versão refatorada)
     *
     * ATENÇÃO: Esta é uma função ADMINISTRATIVA onde a EMPRESA paga pelos vouchers,
     * NÃO os usuários individuais. Os usuários recebem os vouchers gratuitamente.
     *
     * Novo formato:
     * - Um único prizeId para todos os usuários
     * - Um customAmount válido (dentro de minValue/maxValue do voucher)
     * - Array de usuários com userId + email para validação
     * - campaignId opcional para Tremendous template
     *
     * Estratégia:
     * - Máximo 100 usuários por requisição
     * - Processa em batches de 10 com rate limiting
     * - Valida todos os usuários antes de iniciar
     * - Para cada usuário, chama completeSendVoucher() em background
     *
     * Timeline esperada para 100 usuários:
     * - Validação inicial: ~500ms
     * - 10 batches × 1s sleep ≈ 10s
     * - Processamento async (não bloqueia resposta)
     */

    // Validar quantidade (1-100 usuários)
    if (users.length === 0 || users.length > 100) {
      throw new Error('Bulk redemption accepts between 1 and 100 users')
    }

    logger.info('[RedemptionService] Starting ADMIN bulk voucher redemption (NEW FORMAT)', {
      userCount: users.length,
      prizeId,
      customAmount,
      companyId,
    })

    // 1. Resolver ID: aceita tanto VoucherProduct ID quanto Prize ID
    let actualPrizeId = prizeId

    const voucherProduct = await prisma.voucherProduct.findUnique({
      where: { id: prizeId },
    })

    if (voucherProduct) {
      // ID passado é de VoucherProduct, resolver para Prize ID
      const voucherPrize = await prisma.voucherPrize.findFirst({
        where: {
          provider: voucherProduct.provider,
          externalId: voucherProduct.externalId,
        },
      })

      if (!voucherPrize) {
        throw new Error(`Voucher product "${voucherProduct.name}" não possui prize associado. Execute a sincronização primeiro.`)
      }

      actualPrizeId = voucherPrize.prizeId
    }

    // 2. Validar o prêmio uma vez com ID resolvido
    const prize = await prisma.prize.findFirst({
      where: { id: actualPrizeId, isActive: true },
      include: { voucherPrize: true },
    })

    if (!prize) {
      throw new Error(`Prize not found or is not active (ID: ${actualPrizeId}). Verifique se o voucher está ativo e foi sincronizado.`)
    }

    if (prize.type !== 'voucher') {
      throw new Error('Prize is not a voucher')
    }

    if (!prize.voucherPrize) {
      throw new Error('Prize is missing voucher configuration')
    }

    // Validar customAmount dentro do range
    this.validateCustomAmount(customAmount, prize.voucherPrize)

    // Buscar todos os usuários de uma vez
    const userIds = users.map(u => u.userId)
    const dbUsers = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        companyId,
      },
      select: { id: true, name: true, email: true },
    })

    if (dbUsers.length !== users.length) {
      throw new Error('One or more users not found in your company')
    }

    // Validar que email matches para todos
    for (const reqUser of users) {
      const dbUser = dbUsers.find(u => u.id === reqUser.userId)
      if (!dbUser || dbUser.email !== reqUser.email) {
        throw new Error(`Email mismatch for user ${reqUser.userId}`)
      }
    }

    const batchSize = 10
    const sleepMs = 1000
    const results: BulkRedeemVoucherResult[] = []

    // Processar em batches para rate limiting
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(users.length / batchSize)

      logger.info('[RedemptionService] Processing bulk batch', {
        batchNumber,
        totalBatches,
        itemsInBatch: batch.length,
      })

      // Processar cada usuário do batch
      for (const user of batch) {
        try {
          // Chamar sendVoucherToUser para cada usuário com Prize ID resolvido
          const result = await this.sendVoucherToUser(
            user.userId,
            actualPrizeId,
            companyId,
            customAmount,
            campaignId,
          )

          results.push({
            userId: user.userId,
            email: user.email,
            prizeId,
            success: true,
            redemptionId: result.redemption.id,
          })

        } catch (error: any) {
          logger.error('[RedemptionService] Bulk voucher send failed for user', {
            userId: user.userId,
            prizeId,
            error: error.message,
          })

          results.push({
            userId: user.userId,
            email: user.email,
            prizeId,
            success: false,
            error: error.message,
          })
        }
      }

      // Sleep 1s antes do próximo batch (exceto no último)
      if (i + batchSize < users.length) {
        logger.info('[RedemptionService] Sleeping before next batch', {
          currentBatch: batchNumber,
          nextBatch: batchNumber + 1,
          sleepMs,
        })
        await new Promise(resolve => setTimeout(resolve, sleepMs))
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    logger.info('[RedemptionService] ADMIN bulk voucher redemption completed', {
      totalUsers: users.length,
      successCount,
      failureCount,
      successRate: `${((successCount / users.length) * 100).toFixed(1)}%`,
    })

    return results
  },

  /**
   * FASE 1: Reservar recursos para um batch (transação única)
   * Debita CompanyWallet UMA VEZ e cria redemptions com status 'processing'
   */
  async batchReserveResourcesAdmin(batch: BulkRedeemVoucherItem[], companyId: string): Promise<Reservation[]> {
    return prisma.$transaction(async (tx) => {
      // 1. Buscar o prize (apenas uma vez!)
      const firstPrizeId = batch[0].prizeId
      const prize = await tx.prize.findFirst({
        where: { id: firstPrizeId, isActive: true },
        include: { voucherPrize: true },
      })

      if (!prize) {
        throw new Error('Prize not found or is not active')
      }

      // Validar que é voucher
      if (prize.type !== 'voucher') {
        throw new Error('Prize is not a voucher')
      }

      if (!prize.voucherPrize) {
        throw new Error('Prize is missing voucher configuration')
      }

      // 2. Calcular custo total
      const totalCoins = batch.length * prize.coinPrice
      const totalBRL = totalCoins * COIN_TO_BRL_RATE // Conversão: 1 moeda = R$ 0.06

      logger.info('[RedemptionService] Batch cost calculated', {
        batchSize: batch.length,
        prizeCoins: prize.coinPrice,
        totalCoins,
        totalBRL,
      })

      // 3. Debitar CompanyWallet UMA VEZ
      await CompanyWalletModel.debitBalance(
        companyId,
        totalBRL,
        tx,
        `Bulk voucher redemption: ${batch.length} × ${prize.name}`,
        {
          prizeId: prize.id,
          prizeName: prize.name,
          batchSize: batch.length,
          totalCoins,
        },
      )

      // 4. Criar redemptions para cada usuário
      const reservations: Reservation[] = []

      for (const item of batch) {
        // Buscar dados do usuário
        const user = await tx.user.findUnique({
          where: { id: item.userId },
          select: { name: true, email: true },
        })

        if (!user) {
          throw new Error(`User not found: ${item.userId}`)
        }

        // Criar redemption com status 'processing' (USUÁRIO NÃO PAGA!)
        const redemption = await RedemptionModel.create(
          {
            userId: item.userId,
            prizeId: item.prizeId,
            variantId: null,
            companyId,
            coinsSpent: prize.coinPrice, // Para histórico, mas não debitado do usuário
            addressId: null,
          },
          tx,
        )

        // Criar tracking inicial
        await RedemptionTrackingModel.create(
          {
            redemptionId: redemption.id,
            status: 'processing',
            notes: 'Voucher administrativo - empresa pagou, aguardando criação',
            createdBy: item.userId,
          },
          tx,
        )

        reservations.push({
          redemption,
          prize,
          voucherPrize: prize.voucherPrize,
          user,
          item,
        })
      }

      return reservations
    }, { timeout: 5000 }) // Timeout de 5s (só operações DB)
  },

  /**
   * FASE 2: Processar voucher individual (fora da transação)
   * Chama API Tremendous e atualiza status
   */
  async processVoucherAdmin(reservation: any, companyId: string): Promise<BulkRedeemVoucherResult> {
    const { redemption, prize, voucherPrize, user, item } = reservation

    try {
      // Chamar API Tremendous
      const voucherProvider = VoucherProviderFactory.create(voucherPrize.provider)

      const voucherResult = await voucherProvider.createVoucher({
        externalId: redemption.id,
        productId: voucherPrize.externalId,
        amount: voucherPrize.minValue.toNumber(),
        currency: voucherPrize.currency,
        recipient: {
          name: user.name ?? '',
          email: user.email,
        },
      })

      logger.info('[RedemptionService] Voucher created successfully', {
        redemptionId: redemption.id,
        orderId: voucherResult.orderId,
        userId: item.userId,
      })

      // Atualizar para 'completed'
      await prisma.$transaction(async (tx) => {
        await tx.voucherRedemption.create({
          data: {
            redemptionId: redemption.id,
            provider: voucherPrize.provider,
            providerOrderId: voucherResult.orderId,
            providerRewardId: voucherResult.rewardId,
            voucherLink: voucherResult.link,
            voucherCode: voucherResult.code ?? null,
            amount: voucherPrize.minValue,
            currency: voucherPrize.currency,
            status: 'completed',
            completedAt: new Date(),
            expiresAt: voucherResult.expiresAt ?? null,
          },
        })

        await tx.redemption.update({
          where: { id: redemption.id },
          data: { status: 'completed' },
        })

        await RedemptionTrackingModel.create(
          {
            redemptionId: redemption.id,
            status: 'completed',
            notes: 'Voucher criado com sucesso',
            createdBy: item.userId,
          },
          tx,
        )
      })

      return {
        userId: item.userId,
        prizeId: item.prizeId,
        success: true,
        redemptionId: redemption.id,
        voucherLink: voucherResult.link,
        voucherCode: voucherResult.code ?? undefined,
      }

    } catch (error: any) {
      logger.error('[RedemptionService] Voucher creation failed - rolling back', {
        redemptionId: redemption.id,
        userId: item.userId,
        error: error.message,
      })

      // Rollback: devolver dinheiro à CompanyWallet e marcar como failed
      try {
        await prisma.$transaction(async (tx) => {
          // Devolver R$ à empresa
          const coinsBRL = prize.coinPrice * COIN_TO_BRL_RATE
          await CompanyWalletModel.creditBalance(
            companyId,
            coinsBRL,
            tx,
            `Rollback: voucher creation failed for ${item.userId}`,
            {
              redemptionId: redemption.id,
              originalError: error.message,
            },
          )

          // Marcar redemption como 'failed'
          await tx.redemption.update({
            where: { id: redemption.id },
            data: { status: 'failed' },
          })

          await tx.voucherRedemption.create({
            data: {
              redemptionId: redemption.id,
              provider: voucherPrize.provider,
              amount: voucherPrize.minValue,
              currency: voucherPrize.currency,
              status: 'failed',
              errorMessage: error.message,
            },
          })

          await RedemptionTrackingModel.create(
            {
              redemptionId: redemption.id,
              status: 'failed',
              notes: `Erro ao criar voucher: ${error.message}`,
              createdBy: item.userId,
            },
            tx,
          )
        })

        logger.info('[RedemptionService] Rollback completed successfully', {
          redemptionId: redemption.id,
          userId: item.userId,
        })

      } catch (rollbackError: any) {
        logger.error('[RedemptionService] CRITICAL: Rollback failed!', {
          redemptionId: redemption.id,
          userId: item.userId,
          originalError: error.message,
          rollbackError: rollbackError.message,
        })
      }

      return {
        userId: item.userId,
        prizeId: item.prizeId,
        success: false,
        error: error.message,
      }
    }
  },

  /**
   * Enviar um único voucher para um usuário (ação administrativa)
   * A empresa paga pelo voucher, usuário recebe de graça
   *
   * Similar ao bulkRedeemVouchers mas para um único usuário
   */
  async sendVoucherToUser(
    userId: string,
    prizeId: string,
    companyId: string,
    customAmount?: number,
    campaignId?: string,
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Resolver ID: aceita tanto VoucherProduct ID quanto Prize ID
      let actualPrizeId = prizeId

      const voucherProduct = await tx.voucherProduct.findUnique({
        where: { id: prizeId },
      })

      if (voucherProduct) {
        // ID passado é de VoucherProduct, resolver para Prize ID
        const voucherPrize = await tx.voucherPrize.findFirst({
          where: {
            provider: voucherProduct.provider,
            externalId: voucherProduct.externalId,
          },
        })

        if (!voucherPrize) {
          throw new Error(`Voucher product "${voucherProduct.name}" não possui prize associado. Execute a sincronização primeiro.`)
        }

        actualPrizeId = voucherPrize.prizeId
      }

      // 2. Buscar o prize com ID resolvido
      const prize = await tx.prize.findFirst({
        where: { id: actualPrizeId, isActive: true },
        include: { voucherPrize: true },
      })

      if (!prize) {
        throw new Error(`Prize not found or is not active (ID: ${actualPrizeId}). Verifique se o voucher está ativo e foi sincronizado.`)
      }

      // Validar que é voucher
      if (prize.type !== 'voucher') {
        throw new Error('Prize is not a voucher')
      }

      // Validar que é global ou da mesma empresa
      if (prize.companyId && prize.companyId !== companyId) {
        throw new Error('Prize does not belong to this company')
      }

      if (!prize.voucherPrize) {
        throw new Error('Prize is missing voucher configuration')
      }

      // Validar customAmount se fornecido
      if (customAmount !== undefined) {
        this.validateCustomAmount(customAmount, prize.voucherPrize)
      }

      // 2. Calcular custo - usar customAmount ou coinPrice como fallback
      const amount = customAmount ?? Number(prize.voucherPrize.minValue)
      const totalBRL = prize.coinPrice * COIN_TO_BRL_RATE

      logger.info('[RedemptionService] Sending single voucher to user', {
        userId,
        prizeId: actualPrizeId,
        originalInputId: prizeId,
        companyId,
        totalBRL,
      })

      // 3. Debitar CompanyWallet
      await CompanyWalletModel.debitBalance(
        companyId,
        totalBRL,
        tx,
        `Single voucher redemption: ${prize.name}`,
        {
          prizeId: prize.id,
          prizeName: prize.name,
          userId,
        },
      )

      // 4. Buscar dados do usuário
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      })

      if (!user) {
        throw new Error(`User not found: ${userId}`)
      }

      // 5. Criar redemption com Prize ID resolvido
      const redemption = await RedemptionModel.create(
        {
          userId,
          prizeId: actualPrizeId,
          variantId: null,
          companyId,
          coinsSpent: prize.coinPrice,
          addressId: null,
        },
        tx,
      )

      // 6. Criar voucher na Tremendous com envio via EMAIL
      const voucherProvider = VoucherProviderFactory.create(prize.voucherPrize.provider)

      const voucherResult = await voucherProvider.createVoucherViaEmail({
        externalId: redemption.id,
        productId: prize.voucherPrize.externalId,
        amount: customAmount ?? Number(prize.voucherPrize.minValue),
        currency: prize.voucherPrize.currency,
        recipient: {
          name: user.name ?? '',
          email: user.email,
        },
        campaignId,
      })

      // 7. Registrar voucher redemption
      await tx.voucherRedemption.create({
        data: {
          redemptionId: redemption.id,
          provider: prize.voucherPrize.provider,
          providerOrderId: voucherResult.orderId,
          providerRewardId: voucherResult.rewardId,
          voucherLink: voucherResult.link,
          voucherCode: voucherResult.code ?? null,
          amount: customAmount ?? Number(prize.voucherPrize.minValue),
          currency: prize.voucherPrize.currency,
          status: 'completed',
          completedAt: new Date(),
          expiresAt: voucherResult.expiresAt ?? null,
        },
      })

      // 8. Atualizar redemption para 'sent'
      await tx.redemption.update({
        where: { id: redemption.id },
        data: { status: 'sent' },
      })

      // 9. Criar tracking final
      await RedemptionTrackingModel.create(
        {
          redemptionId: redemption.id,
          status: 'sent',
          notes: 'Voucher enviado com sucesso via email pela Tremendous API',
          createdBy: userId,
        },
        tx,
      )

      logger.info('[RedemptionService] Single voucher created successfully (EMAIL delivery)', {
        redemptionId: redemption.id,
        orderId: voucherResult.orderId,
        userId,
      })

      return { redemption, user, prize, voucherPrize: prize.voucherPrize, voucherResult }
    }, { timeout: 15000 })
  },
}

