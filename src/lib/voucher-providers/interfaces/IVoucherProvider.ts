import {
  CreateVoucherRequest,
  CreateVoucherResponse,
  ListProductsOptions,
  VoucherProduct,
} from '../types'

/**
 * Interface que define o contrato para qualquer provider de vouchers
 *
 * Todos os adapters (Tremendous, Giftty, etc.) devem implementar essa interface.
 *
 * Isso garante que o sistema seja agnóstico ao provider e possamos
 * trocar facilmente de um provider para outro sem mudar a lógica de negócio.
 */
export interface IVoucherProvider {
  /**
   * Nome do provider (ex: "tremendous", "giftty")
   */
  getName(): string

  /**
   * Cria um voucher na API do provider com entrega via LINK
   *
   * @param request Dados do voucher a ser criado
   * @returns Promise com os dados do voucher criado (retorna um link para o voucher)
   * @throws Error se a criação falhar
   */
  createVoucher(request: CreateVoucherRequest): Promise<CreateVoucherResponse>

  /**
   * Cria um voucher na API do provider com entrega via EMAIL
   *
   * O provider envia o voucher diretamente para o email do destinatário.
   * Este é o método recomendado para envios a usuários específicos.
   *
   * @param request Dados do voucher a ser criado (deve incluir recipientEmail e recipientName)
   * @returns Promise com os dados do voucher criado
   * @throws Error se a criação falhar
   */
  createVoucherViaEmail(request: CreateVoucherRequest): Promise<CreateVoucherResponse>

  /**
   * Lista produtos disponíveis no provider
   *
   * Usado para sincronizar o catálogo local (tabela voucher_products)
   *
   * @param options Filtros opcionais
   * @returns Promise com array de produtos
   */
  listProducts(options?: ListProductsOptions): Promise<VoucherProduct[]>

  /**
   * Busca um produto específico por ID
   *
   * @param productId ID do produto no provider
   * @returns Promise com os dados do produto ou null se não encontrado
   */
  getProduct(productId: string): Promise<VoucherProduct | null>

  /**
   * Verifica o status de um pedido
   *
   * Útil para sincronizar o status quando o processamento é assíncrono
   *
   * @param orderId ID do pedido no provider
   * @returns Promise com os dados atualizados do pedido
   */
  getOrderStatus(orderId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    link?: string
    code?: string
    errorMessage?: string
  }>
}
