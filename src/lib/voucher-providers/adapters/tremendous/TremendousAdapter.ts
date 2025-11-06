import { IVoucherProvider } from '../../interfaces/IVoucherProvider'
import {
  CreateVoucherRequest,
  CreateVoucherResponse,
  ListProductsOptions,
  VoucherProduct,
} from '../../types'
import {
  TremendousCreateOrderRequest,
  TremendousCreateOrderResponse,
  TremendousGetOrderResponse,
  TremendousListProductsResponse,
  TremendousGetProductResponse,
  TremendousErrorResponse,
  TremendousProduct,
} from './types'
import { logger } from '@/lib/logger'

/**
 * Adapter para a API Tremendous
 *
 * Documentação: https://developers.tremendous.com/docs
 *
 * Autenticação: Bearer token via API_KEY
 * Sandbox URL: https://testflight.tremendous.com/api/v2
 * Production URL: https://www.tremendous.com/api/v2
 */
export class TremendousAdapter implements IVoucherProvider {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly fundingSourceId: string

  constructor() {
    // Carregar configurações do ambiente
    this.apiKey = process.env.TREMENDOUS_API_KEY ?? ''
    this.baseUrl =
      process.env.TREMENDOUS_BASE_URL ??
      'https://testflight.tremendous.com/api/v2' // Sandbox por padrão
    this.fundingSourceId = process.env.TREMENDOUS_FUNDING_SOURCE_ID ?? 'BALANCE'

    if (!this.apiKey) {
      logger.warn('TREMENDOUS_API_KEY not configured')
    }
  }

  getName(): string {
    return 'tremendous'
  }

  /**
   * Cria um voucher (order + reward) na Tremendous
   */
  async createVoucher(
    request: CreateVoucherRequest,
  ): Promise<CreateVoucherResponse> {
    logger.info('Creating voucher with Tremendous', {
      externalId: request.externalId,
      amount: request.amount,
      currency: request.currency,
      productId: request.productId,
    })

    try {
      // IMPORTANTE: Tremendous espera valores em REAIS, não em centavos!
      const denomination = request.amount

      // Montar request no formato da Tremendous
      const tremendousRequest: TremendousCreateOrderRequest = {
        external_id: request.externalId,
        payment: {
          funding_source_id: this.fundingSourceId,
        },
        reward: {
          value: {
            denomination,
            currency_code: request.currency,
          },
          products: [request.productId],
          ...(request.campaignId && { campaign_id: request.campaignId }),
          delivery: {
            method: 'LINK', // Gerar link (não enviar email)
          },
          recipient: {
            name: request.recipient.name,
            email: request.recipient.email,
          },
        },
      }

      // Fazer request para Tremendous
      const response = await this.makeRequest<TremendousCreateOrderResponse>(
        'POST',
        '/orders',
        tremendousRequest,
      )

      // Pegar o primeiro reward (normalmente é só um)
      const reward = response.order.rewards[0]

      if (!reward) {
        throw new Error('No reward found in order response')
      }

      logger.info('Voucher created successfully', {
        orderId: response.order.id,
        rewardId: reward.id,
        externalId: request.externalId,
      })

      // Transformar response para formato padrão
      return {
        success: true,
        orderId: response.order.id,
        rewardId: reward.id,
        link: reward.delivery.link ?? '',
        metadata: {
          orderStatus: response.order.status,
          createdAt: response.order.created_at,
        },
      }
    } catch (error: any) {
      logger.error('Error creating voucher with Tremendous', {
        error: error.message,
        externalId: request.externalId,
      })
      throw error
    }
  }

  /**
   * Cria um voucher via EMAIL (Tremendous envia o email diretamente)
   */
  async createVoucherViaEmail(
    request: CreateVoucherRequest,
  ): Promise<CreateVoucherResponse> {
    logger.info('Creating voucher with EMAIL delivery', {
      externalId: request.externalId,
      amount: request.amount,
      currency: request.currency,
      productId: request.productId,
      recipientEmail: request.recipient.email,
    })

    try {
      // IMPORTANTE: Tremendous espera valores em REAIS, não em centavos!
      const denomination = request.amount

      // Montar request no formato da Tremendous
      const tremendousRequest: TremendousCreateOrderRequest = {
        external_id: request.externalId,
        payment: {
          funding_source_id: this.fundingSourceId,
        },
        reward: {
          value: {
            denomination,
            currency_code: request.currency,
          },
          products: [request.productId],
          ...(request.campaignId && { campaign_id: request.campaignId }),
          delivery: {
            method: 'EMAIL', // Tremendous envia email diretamente
          },
          recipient: {
            name: request.recipient.name,
            email: request.recipient.email,
          },
        },
      }

      // Fazer request para Tremendous
      const response = await this.makeRequest<TremendousCreateOrderResponse>(
        'POST',
        '/orders',
        tremendousRequest,
      )

      // Pegar o primeiro reward (normalmente é só um)
      const reward = response.order.rewards[0]

      if (!reward) {
        throw new Error('No reward found in order response')
      }

      logger.info('Voucher created successfully (EMAIL delivery)', {
        orderId: response.order.id,
        rewardId: reward.id,
        externalId: request.externalId,
        deliveryStatus: reward.delivery.status,
      })

      // Para EMAIL delivery, não há link imediato (o link vai no email)
      return {
        success: true,
        orderId: response.order.id,
        rewardId: reward.id,
        link: '', // Email delivery não retorna link na API
        metadata: {
          orderStatus: response.order.status,
          createdAt: response.order.created_at,
          deliveryMethod: 'EMAIL',
          deliveryStatus: reward.delivery.status,
        },
      }
    } catch (error: any) {
      logger.error('Error creating voucher with EMAIL delivery', {
        error: error.message,
        externalId: request.externalId,
      })
      throw error
    }
  }

  /**
   * Lista produtos disponíveis na Tremendous
   */
  async listProducts(
    options?: ListProductsOptions,
  ): Promise<VoucherProduct[]> {
    logger.info('Listing products from Tremendous', { options })

    try {
      const response = await this.makeRequest<TremendousListProductsResponse>(
        'GET',
        '/products',
      )

      // Transformar produtos para formato padrão
      let products = response.products
        .map((p) => this.mapTremendousProduct(p))
        // Filtrar produtos sem preço válido
        .filter((p) => p.minValue > 0 && p.maxValue > 0)

      // Aplicar filtros
      if (options?.category) {
        products = products.filter((p) => p.category === options.category)
      }
      if (options?.country) {
        products = products.filter((p) => p.countries.includes(options.country!))
      }
      if (options?.currency) {
        products = products.filter((p) => p.currency === options.currency)
      }

      logger.info(`Found ${products.length} products`, { options })

      return products
    } catch (error: any) {
      logger.error('Error listing products from Tremendous', {
        error: error.message,
      })
      throw error
    }
  }

  /**
   * Busca um produto específico por ID
   */
  async getProduct(productId: string): Promise<VoucherProduct | null> {
    logger.info('Getting product from Tremendous', { productId })

    try {
      const response = await this.makeRequest<TremendousGetProductResponse>(
        'GET',
        `/products/${productId}`,
      )

      return this.mapTremendousProduct(response.product)
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null
      }
      logger.error('Error getting product from Tremendous', {
        error: error.message,
        productId,
      })
      throw error
    }
  }

  /**
   * Verifica o status de um pedido
   */
  async getOrderStatus(orderId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    link?: string
    code?: string
    errorMessage?: string
  }> {
    logger.info('Getting order status from Tremendous', { orderId })

    try {
      const response = await this.makeRequest<TremendousGetOrderResponse>(
        'GET',
        `/orders/${orderId}`,
      )

      // Mapear status da Tremendous para nosso formato
      const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
        PENDING: 'pending',
        PROCESSING: 'processing',
        EXECUTED: 'completed',
        FAILED: 'failed',
        CART: 'pending',
      }

      const reward = response.order.rewards[0]

      return {
        status: statusMap[response.order.status] || 'pending',
        link: reward?.delivery?.link,
      }
    } catch (error: any) {
      logger.error('Error getting order status from Tremendous', {
        error: error.message,
        orderId,
      })
      throw error
    }
  }

  /**
   * Faz uma requisição HTTP para a API da Tremendous
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    logger.debug('Making request to Tremendous', { method, url })

    // Adicionar timeout de 5 segundos para evitar espera indefinida
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      // Parse response
      const data = await response.json()

      // Se não for sucesso, lançar erro
      if (!response.ok) {
        const errorData = data as TremendousErrorResponse
        const errorMessage =
          errorData.errors?.[0]?.message || 'Unknown error from Tremendous'

        const error = new Error(errorMessage) as any
        error.statusCode = response.status
        error.tremendousErrors = errorData.errors

        throw error
      }

      return data as T
    } catch (error: any) {
      clearTimeout(timeoutId)

      // Tratar timeout especificamente
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Tremendous API timeout after 5s') as any
        timeoutError.statusCode = 408 // Request Timeout
        throw timeoutError
      }

      // Re-lançar outros erros
      throw error
    }
  }

  /**
   * Mapeia produto da Tremendous para formato padrão
   */
  private mapTremendousProduct(product: TremendousProduct): VoucherProduct {
    // Extrair valores de SKUs (primeiro SKU disponível)
    // IMPORTANTE: Os valores em SKUs já estão em reais, NÃO em centavos!
    const firstSku = product.skus?.[0]
    const minValue = firstSku?.min ?? 0
    const maxValue = firstSku?.max ?? 0

    // currency_codes pode ser string ou array
    let currencies: string[] = []
    if (typeof product.currency_codes === 'string') {
      currencies = product.currency_codes.split(',').map((c) => c.trim())
    } else if (Array.isArray(product.currency_codes)) {
      currencies = product.currency_codes
    }
    const currency = currencies[0] ?? 'USD'

    // countries é array de objetos {abbr: string}
    const countries = product.countries?.map((c) => c.abbr) ?? []

    // Para vouchers BR, description geralmente vem vazio
    // Priorizar: usage_instructions > disclosure > description
    const description =
      product.usage_instructions ??
      product.disclosure ??
      product.description ??
      ''

    return {
      id: product.id,
      name: product.name,
      description,
      category: product.category ?? 'other',
      brand: product.brand?.name,
      images: product.images?.map((img) => img.src) ?? [],
      minValue,
      maxValue,
      currency,
      countries,
      isActive: true,
    }
  }
}
