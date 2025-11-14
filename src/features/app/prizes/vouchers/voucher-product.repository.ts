/**
 * VoucherProduct Repository
 *
 * Operações de banco de dados para VoucherProduct (catálogo de produtos)
 */

import { prisma } from '@/lib/database'
import {
  ListVoucherProductsFilters,
  SyncVoucherProductDTO,
  VoucherProduct,
} from './voucher-product.model'

export class VoucherProductRepository {
  /**
   * Sincroniza/atualiza produto do provider (upsert)
   */
  async sync(data: SyncVoucherProductDTO): Promise<VoucherProduct> {
    const result = await prisma.voucherProduct.upsert({
      where: {
        provider_externalId: {
          provider: data.provider,
          externalId: data.externalId,
        },
      },
      create: {
        provider: data.provider,
        externalId: data.externalId,
        name: data.name,
        description: data.description ?? null,
        category: data.category,
        brand: data.brand ?? null,
        images: data.images ?? [],
        minValue: data.minValue,
        maxValue: data.maxValue,
        currency: data.currency,
        countries: data.countries,
        isActive: data.isActive ?? true,
        lastSyncAt: new Date(),
      },
      update: {
        name: data.name,
        description: data.description ?? null,
        category: data.category,
        brand: data.brand ?? null,
        images: data.images ?? [],
        minValue: data.minValue,
        maxValue: data.maxValue,
        currency: data.currency,
        countries: data.countries,
        isActive: data.isActive ?? true,
        lastSyncAt: new Date(),
      },
    })
    return this.mapToVoucherProduct(result)
  }

  /**
   * Busca produto por ID
   */
  async findById(id: string): Promise<VoucherProduct | null> {
    const result = await prisma.voucherProduct.findUnique({
      where: { id },
    })
    return result ? this.mapToVoucherProduct(result) : null
  }

  /**
   * Busca produto por provider + externalId
   */
  async findByExternalId(provider: string, externalId: string): Promise<VoucherProduct | null> {
    const result = await prisma.voucherProduct.findUnique({
      where: {
        provider_externalId: {
          provider,
          externalId,
        },
      },
    })
    return result ? this.mapToVoucherProduct(result) : null
  }

  /**
   * Lista produtos com filtros
   */
  async list(
    filters: ListVoucherProductsFilters,
  ): Promise<{ items: VoucherProduct[]; total: number }> {
    const where: any = {}

    if (filters.provider) {
      where.provider = filters.provider
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.country) {
      where.countries = {
        has: filters.country,
      }
    }

    if (filters.currency) {
      where.currency = filters.currency
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.minValue !== undefined || filters.maxValue !== undefined) {
      where.AND = []

      if (filters.minValue !== undefined) {
        where.AND.push({
          minValue: {
            gte: filters.minValue,
          },
        })
      }

      if (filters.maxValue !== undefined) {
        where.AND.push({
          maxValue: {
            lte: filters.maxValue,
          },
        })
      }
    }

    const [items, total] = await Promise.all([
      prisma.voucherProduct.findMany({
        where,
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.voucherProduct.count({ where }),
    ])

    // Buscar os prizeIds associados (via VoucherPrize)
    const voucherPrizes = await prisma.voucherPrize.findMany({
      where: {
        provider: filters.provider ?? undefined,
        externalId: {
          in: items.map((item) => item.externalId),
        },
      },
      select: {
        externalId: true,
        prizeId: true,
      },
    })

    // Mapear prizeIds por externalId para fácil lookup
    const prizeIdMap = new Map(
      voucherPrizes.map((vp) => [vp.externalId, vp.prizeId]),
    )

    // Enriquecer items com prizeId
    const enrichedItems = items.map((item) => {
      const mappedItem = this.mapToVoucherProduct(item)
      mappedItem.prizeId = prizeIdMap.get(item.externalId)
      return mappedItem
    })

    return { items: enrichedItems, total }
  }

  /**
   * Mapeia resultado do Prisma para VoucherProduct
   */
  private mapToVoucherProduct(data: any): VoucherProduct {
    return {
      ...data,
      minValue: typeof data.minValue === 'number' ? data.minValue : Number(data.minValue),
      maxValue: typeof data.maxValue === 'number' ? data.maxValue : Number(data.maxValue),
    }
  }

  /**
   * Desativa produtos não sincronizados (cleanup)
   */
  async deactivateNotSynced(provider: string, syncedIds: string[]): Promise<number> {
    const result = await prisma.voucherProduct.updateMany({
      where: {
        provider,
        externalId: {
          notIn: syncedIds,
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    return result.count
  }

  /**
   * Conta produtos ativos por provider
   */
  async countByProvider(provider: string): Promise<number> {
    return prisma.voucherProduct.count({
      where: {
        provider,
        isActive: true,
      },
    })
  }
}
