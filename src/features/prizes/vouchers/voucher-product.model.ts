/**
 * VoucherProduct Model
 *
 * Cache/Catálogo de produtos disponíveis nos providers de voucher
 */

export interface VoucherProduct {
  id: string
  provider: string
  externalId: string
  name: string
  description: string | null
  category: string
  brand: string | null
  images: string[]
  minValue: number
  maxValue: number
  currency: string
  countries: string[]
  isActive: boolean
  lastSyncAt: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO para sincronizar produtos do provider
 */
export interface SyncVoucherProductDTO {
  provider: string
  externalId: string
  name: string
  description?: string
  category: string
  brand?: string
  images?: string[]
  minValue: number
  maxValue: number
  currency: string
  countries: string[]
  isActive?: boolean
}

/**
 * Filtros para buscar produtos
 */
export interface ListVoucherProductsFilters {
  provider?: string
  category?: string
  country?: string
  currency?: string
  isActive?: boolean
  minValue?: number
  maxValue?: number
  limit?: number
  offset?: number
}
