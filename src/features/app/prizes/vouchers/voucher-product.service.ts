/**
 * VoucherProduct Service
 *
 * Gerencia sincronização e listagem do catálogo de produtos de vouchers
 */

import { VoucherProviderFactory } from '@/lib/voucher-providers'
import { VoucherProductRepository } from './voucher-product.repository'
import { VoucherPrizeRepository } from './voucher-prize.repository'
import { ListVoucherProductsFilters, UpdateVoucherProductDTO } from './voucher-product.model'
import { logger } from '@/lib/logger'

export class VoucherProductService {
  private repository = new VoucherProductRepository()
  private voucherPrizeRepository = new VoucherPrizeRepository()

  /**
   * Sincroniza catálogo de produtos do provider
   *
   * Fluxo:
   * 1. Busca produtos do provider (Tremendous API)
   * 2. Faz upsert de cada produto no banco
   * 3. Desativa produtos que não existem mais no provider
   *
   * @param provider Nome do provider (ex: 'tremendous')
   * @returns Estatísticas da sincronização
   */
  async syncCatalog(provider: string = 'tremendous') {
    logger.info(`[VoucherProductService] Starting catalog sync for provider: ${provider}`)

    try {
      // 1. Buscar produtos do provider
      const voucherProvider = VoucherProviderFactory.create(provider)
      const products = await voucherProvider.listProducts({
        country: 'BR',
        currency: 'BRL',
      })

      logger.info(`[VoucherProductService] Found ${products.length} products from ${provider}`)

      // 2. Sincronizar cada produto e criar/reativar Prizes (idempotente)
      const syncedIds: string[] = []
      let syncedCount = 0

      for (const product of products) {
        try {
          // 2a. Sincronizar VoucherProduct no catálogo
          await this.repository.sync({
            provider,
            externalId: product.id,
            name: product.name,
            description: product.description,
            category: product.category,
            brand: product.brand,
            images: product.images,
            minValue: product.minValue,
            maxValue: product.maxValue,
            currency: product.currency,
            countries: product.countries,
            isActive: true,
          })

          // 2b. Criar ou reativar Prize associado (idempotente)
          // Só cria uma vez - próximas execuções não criam duplicatas
          await this.voucherPrizeRepository.createOrReactivate({
            provider,
            externalId: product.id,
            name: product.name,
            category: product.category,
            minValue: Number(product.minValue),
            maxValue: Number(product.maxValue),
            currency: product.currency,
            description: product.description,
            brand: product.brand,
            images: product.images,
          })

          syncedIds.push(product.id)
          syncedCount++
        } catch (error) {
          logger.error('[VoucherProductService] Failed to sync product', {
            provider,
            productId: product.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          // Continua com os próximos produtos mesmo se um falhar
        }
      }

      // 3. Desativar produtos VoucherProducts que não existem mais no provider
      const deactivatedProductCount = await this.repository.deactivateNotSynced(
        provider,
        syncedIds,
      )

      // 4. Desativar Prizes orfãos (cujos VoucherProducts foram removidos)
      const deactivatedPrizeCount = await this.voucherPrizeRepository.deactivateOrphanPrizes(
        provider,
        syncedIds,
      )

      const totalActive = await this.repository.countByProvider(provider)

      logger.info('[VoucherProductService] Sync completed', {
        provider,
        syncedProducts: syncedCount,
        deactivatedProducts: deactivatedProductCount,
        deactivatedPrizes: deactivatedPrizeCount,
        totalActiveProducts: totalActive,
      })

      return {
        syncedProducts: syncedCount,
        deactivatedProducts: deactivatedProductCount,
        deactivatedPrizes: deactivatedPrizeCount,
        totalActiveProducts: totalActive,
      }
    } catch (error) {
      logger.error('[VoucherProductService] Sync failed', {
        provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Lista produtos com filtros
   *
   * @param filters Filtros opcionais
   * @returns Lista paginada de produtos
   */
  async listProducts(filters: ListVoucherProductsFilters) {
    logger.info('[VoucherProductService] Listing products', { filters })

    return this.repository.list(filters)
  }

  /**
   * Atualiza produto do catálogo (backoffice only)
   *
   * @param id ID do produto
   * @param data Dados para atualização
   * @returns Produto atualizado
   */
  async updateProduct(id: string, data: UpdateVoucherProductDTO) {
    logger.info('[VoucherProductService] Updating product', { id, data })

    const product = await this.repository.findById(id)
    if (!product) {
      throw new Error('Product not found')
    }

    const updated = await this.repository.update(id, data)

    logger.info('[VoucherProductService] Product updated successfully', {
      id,
      updatedFields: Object.keys(data),
    })

    return updated
  }

  /**
   * Busca produto por ID
   *
   * @param id ID do produto no banco
   * @returns Produto ou null
   */
  async getProduct(id: string) {
    return this.repository.findById(id)
  }

  /**
   * Busca produto por provider + externalId
   *
   * @param provider Nome do provider
   * @param externalId ID do produto no provider
   * @returns Produto ou null
   */
  async getProductByExternalId(provider: string, externalId: string) {
    return this.repository.findByExternalId(provider, externalId)
  }
}
