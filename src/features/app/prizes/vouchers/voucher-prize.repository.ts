/**
 * VoucherPrize Repository
 *
 * Gerencia o relacionamento entre Prize e VoucherProduct
 * Responsável por criar/atualizar Prizes quando produtos voucher são sincronizados
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { BRL_TO_COIN_RATE } from '@/features/app/economy/economy.constants'

export interface CreateVoucherPrizeDTO {
  provider: string
  externalId: string
  name: string
  category: string
  minValue: number
  maxValue: number
  currency: string
  description?: string
  brand?: string
  images?: string[]
}

export class VoucherPrizeRepository {
  /**
   * Cria ou reativa um Prize para um VoucherProduct
   * Idempotente - não cria duplicatas
   *
   * @param data Dados do voucher product
   * @returns O Prize criado ou reativado
   */
  async createOrReactivate(data: CreateVoucherPrizeDTO): Promise<any> {
    // 1. Verificar se já existe Prize para este VoucherProduct
    const existingVoucherPrize = await prisma.voucherPrize.findFirst({
      where: {
        provider: data.provider,
        externalId: data.externalId,
      },
      include: {
        prize: true,
      },
    })

    // 2. Se existe, apenas reativar se estiver desativo
    if (existingVoucherPrize) {
      if (!existingVoucherPrize.prize.isActive) {
        logger.info('[VoucherPrizeRepository] Reativating prize', {
          prizeId: existingVoucherPrize.prizeId,
          provider: data.provider,
          externalId: data.externalId,
        })

        const updated = await prisma.prize.update({
          where: { id: existingVoucherPrize.prizeId },
          data: {
            isActive: true,
            updatedAt: new Date(),
          },
        })

        return updated
      }

      logger.info('[VoucherPrizeRepository] Prize already active, skipping', {
        prizeId: existingVoucherPrize.prizeId,
      })
      return existingVoucherPrize.prize
    }

    // 3. Se não existe, criar novo Prize + VoucherPrize
    logger.info('[VoucherPrizeRepository] Creating new prize for voucher product', {
      provider: data.provider,
      externalId: data.externalId,
      name: data.name,
    })

    /**
     * CONVERSÃO FIXA: 1 moeda = R$ 0.06 (ou R$ 1 = 10 moedas)
     * Definida em: src/features/app/economy/economy.constants.ts
     *
     * O coinPrice é calculado baseado no VALOR MÍNIMO (minValue) do voucher:
     * - Multiplica minValue por BRL_TO_COIN_RATE (10)
     * - Arredonda para CIMA com Math.ceil() (ex: R$ 10.50 = 105 moedas)
     *
     * Para vouchers VARIÁVEIS (range de valores):
     * - Este coinPrice serve como BASE para exibição no catálogo
     * - No momento do resgate, se customAmount for fornecido, o custo real
     *   é recalculado em redemption.service.ts usando a mesma fórmula
     */
    const coinPrice = Math.ceil(data.minValue * BRL_TO_COIN_RATE)

    const prize = await prisma.prize.create({
      data: {
        name: data.name,
        description: data.description ?? `${data.brand ?? data.name} - ${data.minValue} ${data.currency}`,
        type: 'voucher',
        category: 'voucher',
        images: data.images ?? [],
        coinPrice,
        brand: data.brand,
        stock: 999, // Valor alto simulando infinito para vouchers
        isActive: true,
        // Não definimos companyId pois é um voucher global
      },
    })

    // Criar registro VoucherPrize que conecta Prize ao produto do provider
    const voucherPrize = await prisma.voucherPrize.create({
      data: {
        prizeId: prize.id,
        provider: data.provider,
        externalId: data.externalId,
        minValue: Math.round(data.minValue * 100) / 100, // Garante 2 casas decimais
        maxValue: Math.round(data.maxValue * 100) / 100,
        currency: data.currency,
        metadata: {
          category: 'Voucher',
          syncedAt: new Date().toISOString(),
        },
      },
    })

    logger.info('[VoucherPrizeRepository] Prize created successfully', {
      prizeId: prize.id,
      voucherPrizeId: voucherPrize.id,
    })

    return prize
  }

  /**
   * Desativa Prizes cujos VoucherProducts foram removidos do catálogo
   * Encontra todos os Prizes de um provider que NÃO estão nos IDs sincronizados
   *
   * @param provider Nome do provider
   * @param syncedExternalIds IDs externos que foram sincronizados
   * @returns Quantidade de Prizes desativados
   */
  async deactivateOrphanPrizes(
    provider: string,
    syncedExternalIds: string[],
  ): Promise<number> {
    logger.info('[VoucherPrizeRepository] Deactivating orphan prizes', {
      provider,
      syncedCount: syncedExternalIds.length,
    })

    // Encontrar VoucherPrizes que NÃO estão na lista de sincronizados
    const orphanVoucherPrizes = await prisma.voucherPrize.findMany({
      where: {
        provider,
        externalId: {
          notIn: syncedExternalIds,
        },
        prize: {
          isActive: true,
        },
      },
      select: {
        prizeId: true,
      },
    })

    if (orphanVoucherPrizes.length === 0) {
      logger.info('[VoucherPrizeRepository] No orphan prizes to deactivate')
      return 0
    }

    const prizeIds = orphanVoucherPrizes.map((vp) => vp.prizeId)

    // Desativar os Prizes orfãos
    const result = await prisma.prize.updateMany({
      where: {
        id: {
          in: prizeIds,
        },
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    logger.info('[VoucherPrizeRepository] Orphan prizes deactivated', {
      provider,
      deactivatedCount: result.count,
    })

    return result.count
  }

  /**
   * Busca Prize por provider + externalId
   */
  async findByExternalId(provider: string, externalId: string): Promise<any | null> {
    const voucherPrize = await prisma.voucherPrize.findFirst({
      where: {
        provider,
        externalId,
      },
      include: {
        prize: true,
      },
    })

    return voucherPrize?.prize ?? null
  }
}
