import { Prize, PrizeVariant } from '@prisma/client'

/**
 * Prize type (delivery format)
 */
export type PrizeType = 'voucher' | 'experience' | 'product'

/**
 * Prize sort/order options
 */
export type PrizeSortBy = 'createdAt' | 'updatedAt' | 'coinPrice' | 'name'
export type SortOrder = 'asc' | 'desc'

/**
 * Request body for creating a prize
 */
export interface CreatePrizeRequest {
  name: string
  description: string
  type: PrizeType
  category?: string
  coinPrice: number
  brand?: string
  stock: number
  specifications?: Record<string, unknown>
  isGlobal?: boolean // If true, companyId will be null (available to all companies)
}

/**
 * Request body for updating a prize
 */
export interface UpdatePrizeRequest {
  name?: string
  description?: string
  type?: PrizeType
  category?: string
  coinPrice?: number
  brand?: string
  stock?: number
  specifications?: Record<string, unknown>
  isActive?: boolean
}

/**
 * Query parameters for listing prizes
 */
export interface ListPrizesQuery {
  page?: number
  limit?: number
  type?: PrizeType
  category?: string
  isActive?: boolean
  isGlobal?: boolean
  search?: string
  orderBy?: PrizeSortBy
  order?: SortOrder
}

/**
 * Response for prize list with pagination
 */
export interface ListPrizesResponse {
  prizes: PrizeWithRelations[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Prize with relations
 */
export interface PrizeWithRelations extends Prize {
  variants?: PrizeVariant[]
}

/**
 * Response for single prize
 */
export interface PrizeResponse {
  prize: PrizeWithRelations
}

/**
 * Response for upload images
 */
export interface UploadImagesResponse {
  images: string[]
  message: string
}

/**
 * Response for delete image
 */
export interface DeleteImageResponse {
  images: string[]
  message: string
}
