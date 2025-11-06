/**
 * Types específicos da API Tremendous
 *
 * Documentação: https://developers.tremendous.com/docs
 */

/**
 * Request para criar um order na Tremendous
 */
export interface TremendousCreateOrderRequest {
  external_id?: string // ID externo para rastreamento
  payment: {
    funding_source_id: string // ID da fonte de pagamento (usa "BALANCE" para saldo pré-carregado)
  }
  reward: {
    value: {
      denomination: number // Valor em reais (ex: 50.00 = R$50.00)
      currency_code: string // "BRL", "USD", etc.
    }
    products: string[] // Array com IDs dos produtos (ex: ["QHKXSG4TR76E"])
    campaign_id?: string // ID da campaign (template de email customizado)
    delivery: {
      method: 'LINK' | 'EMAIL' | 'PHONE' // "LINK" = gera link, "EMAIL" = envia por email, "PHONE" = envia SMS
    }
    recipient: {
      name: string
      email: string
    }
  }
}

/**
 * Response da criação de order (estrutura REAL da API)
 */
export interface TremendousCreateOrderResponse {
  order: {
    id: string
    external_id?: string
    status: 'PENDING' | 'PROCESSING' | 'EXECUTED' | 'FAILED' | 'CART'
    created_at: string
    payment?: {
      subtotal: number
      total: number
      fees: number
    }
    rewards: Array<{
      // ← rewards é um ARRAY!
      id: string
      order_id: string
      created_at: string
      value: {
        denomination: number
        currency_code: string
      }
      delivery: {
        method: string
        status?: string
        link?: string // Link para acessar o reward (quando method = "LINK")
      }
      recipient: {
        name: string
        email: string
        phone?: string
      }
    }>
  }
}

/**
 * Response de GET /orders/{id}
 */
export interface TremendousGetOrderResponse {
  order: {
    id: string
    external_id?: string
    status: 'PENDING' | 'PROCESSING' | 'EXECUTED' | 'FAILED' | 'CART'
    created_at: string
    rewards: Array<{
      id: string
      delivery: {
        method: string
        status?: string
        link?: string
      }
    }>
  }
}

/**
 * Produto disponível na Tremendous (estrutura REAL da API)
 */
export interface TremendousProduct {
  id: string
  name: string
  description?: string
  category?: string // String diretamente (ex: "paypal", "charities", "gift_card")
  brand?: {
    id: string
    name: string
  }
  images?: Array<{
    src: string
    type?: string // "logo", "card", etc.
  }>
  countries?: Array<{
    abbr: string // Código do país (ex: "BR", "US")
  }>
  currency_codes?: string | string[] // Pode ser string ("USD,BRL") ou array (["USD", "BRL"])
  skus?: Array<{
    min: number // Valor mínimo em reais (ex: 60.0 = R$60.00)
    max: number // Valor máximo em reais (ex: 2240.0 = R$2240.00)
  }>
  disclaimer?: string
  disclosure?: string // Termos e condições (importante para vouchers BR)
  usage_instructions?: string // Instruções de uso e resgate (importante para vouchers BR)
  subcategory?: string // Subcategoria (ex: "mobility_and_fuel")
}

/**
 * Response de GET /products
 */
export interface TremendousListProductsResponse {
  products: TremendousProduct[]
}

/**
 * Response de GET /products/{id}
 */
export interface TremendousGetProductResponse {
  product: TremendousProduct
}

/**
 * Error response da Tremendous
 */
export interface TremendousErrorResponse {
  errors: Array<{
    message: string
    path?: string
    type?: string
  }>
}
