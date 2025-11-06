/**
 * Types e DTOs para o sistema de voucher providers
 */

/**
 * Informações do destinatário do voucher
 */
export interface VoucherRecipient {
  name: string
  email: string
}

/**
 * Request para criar um voucher
 */
export interface CreateVoucherRequest {
  externalId: string // ID do VoucherRedemption (para rastreamento)
  productId: string // ID do produto no provider (ex: "QHKXSG4TR76E" na Tremendous)
  amount: number // Valor em reais (ex: 50.00)
  currency: string // "BRL", "USD", etc.
  recipient: VoucherRecipient
  campaignId?: string // ID da campaign (template customizado - ex: Tremendous)
}

/**
 * Response da criação de voucher
 */
export interface CreateVoucherResponse {
  success: boolean
  orderId: string // ID do pedido no provider
  rewardId: string // ID da recompensa no provider
  link: string // Link para acessar o voucher
  code?: string // Código do voucher (se aplicável)
  expiresAt?: Date // Data de expiração (se aplicável)
  metadata?: Record<string, any> // Dados extras do provider
}

/**
 * Informações de um produto disponível no provider
 */
export interface VoucherProduct {
  id: string // ID no provider
  name: string
  description?: string
  category: string // "gift_card", "charity", etc.
  brand?: string
  images?: string[]
  minValue: number
  maxValue: number
  currency: string
  countries: string[] // Países suportados (ex: ["BR", "US"])
  isActive: boolean
}

/**
 * Opções de listagem de produtos
 */
export interface ListProductsOptions {
  category?: string
  country?: string
  currency?: string
}

/**
 * Tipos de providers suportados
 */
export enum VoucherProviderType {
  TREMENDOUS = 'tremendous',
}
