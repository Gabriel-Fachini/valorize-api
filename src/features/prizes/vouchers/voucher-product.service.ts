/**
 * VoucherProduct Service
 *
 * Gerencia sincronização e listagem do catálogo de produtos de vouchers
 */

import { VoucherProviderFactory } from '@/lib/voucher-providers'
import { VoucherProductRepository } from './voucher-product.repository'
import { ListVoucherProductsFilters } from './voucher-product.model'
import { logger } from '@/lib/logger'

export class VoucherProductService {
  private repository = new VoucherProductRepository()

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

      // 2. Sincronizar cada produto (upsert)
      const syncedIds: string[] = []
      let syncedCount = 0

      for (const product of products) {
        try {
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

      // 3. Desativar produtos que não existem mais no provider
      const deactivatedCount = await this.repository.deactivateNotSynced(
        provider,
        syncedIds,
      )

      const totalActive = await this.repository.countByProvider(provider)

      logger.info('[VoucherProductService] Sync completed', {
        provider,
        synced: syncedCount,
        deactivated: deactivatedCount,
        totalActive,
      })

      return {
        synced: syncedCount,
        deactivated: deactivatedCount,
        total: totalActive,
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
