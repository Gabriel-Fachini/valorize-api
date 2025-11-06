import { VoucherRedemptionJob } from '../queues/voucher-redemption.queue'
import { logger } from '@/lib/logger'
import { VoucherProviderFactory } from '@/lib/voucher-providers'
import { prisma } from '@/lib/prisma'

/**
 * Processor - Função que processa um job de resgate de voucher
 *
 * Essa função é chamada pelo Worker sempre que há um job na fila.
 *
 * O que ela faz:
 * 1. Buscar dados do voucher redemption no banco
 * 2. Obter o provider adapter correto (Tremendous, Giftty, etc)
 * 3. Chamar a API do provider para criar o voucher
 * 4. Atualizar o banco com o resultado (voucherLink, status, etc)
 * 5. Se falhar, lança erro para o BullMQ fazer retry automático
 *
 * @param job Dados do job
 * @returns Promise<any> Resultado do processamento
 */
export async function processVoucherRedemption(
  job: VoucherRedemptionJob,
): Promise<any> {
  const {
    voucherRedemptionId,
    redemptionId,
    userId,
    amount,
    provider,
    productId,
    recipientEmail,
    recipientName,
  } = job

  logger.info('Processing voucher redemption job', {
    voucherRedemptionId,
    redemptionId,
    userId,
    provider,
    amount,
  })

  try {
    // 1. Buscar dados do voucher redemption no banco
    const voucherRedemption = await prisma.voucherRedemption.findUnique({
      where: { id: voucherRedemptionId },
      include: {
        redemption: {
          include: {
            user: true,
            prize: true,
          },
        },
      },
    })

    if (!voucherRedemption) {
      throw new Error(`VoucherRedemption ${voucherRedemptionId} not found`)
    }

    // Validar se já foi processado (idempotência)
    if (voucherRedemption.status === 'completed') {
      logger.info('Voucher redemption already completed, skipping', {
        voucherRedemptionId,
      })
      return {
        success: true,
        alreadyCompleted: true,
        voucherLink: voucherRedemption.voucherLink,
      }
    }

    // 2. Obter provider adapter
    const voucherProvider = VoucherProviderFactory.create(provider)

    // 3. Criar voucher na API do provider
    const result = await voucherProvider.createVoucher({
      externalId: voucherRedemptionId,
      productId,
      amount,
      currency: 'BRL',
      recipient: {
        name: recipientName,
        email: recipientEmail,
      },
    })

    logger.info('Voucher created successfully in provider', {
      voucherRedemptionId,
      orderId: result.orderId,
      rewardId: result.rewardId,
    })

    // 4. Atualizar VoucherRedemption no banco
    await prisma.voucherRedemption.update({
      where: { id: voucherRedemptionId },
      data: {
        status: 'completed',
        providerOrderId: result.orderId,
        providerRewardId: result.rewardId,
        voucherLink: result.link,
        voucherCode: result.code,
        expiresAt: result.expiresAt,
        completedAt: new Date(),
        errorMessage: null, // Limpar erro anterior
      },
    })

    // 5. Atualizar Redemption pai
    await prisma.redemption.update({
      where: { id: redemptionId },
      data: {
        status: 'completed',
      },
    })

    logger.info('Voucher redemption processed successfully', {
      voucherRedemptionId,
      redemptionId,
    })

    return {
      success: true,
      voucherLink: result.link,
      voucherCode: result.code,
      providerOrderId: result.orderId,
      providerRewardId: result.rewardId,
    }
  } catch (error: any) {
    logger.error('Error processing voucher redemption', {
      voucherRedemptionId,
      error: error.message,
      stack: error.stack,
    })

    // Atualizar retry count no banco
    try {
      await prisma.voucherRedemption.update({
        where: { id: voucherRedemptionId },
        data: {
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
          errorMessage: error.message?.substring(0, 500), // Limitar tamanho
        },
      })
    } catch (dbError: any) {
      logger.error('Failed to update retry count', {
        voucherRedemptionId,
        error: dbError.message,
      })
    }

    // Re-lançar erro para o BullMQ fazer retry automático
    throw error
  }
}
