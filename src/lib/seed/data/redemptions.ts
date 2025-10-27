/**
 * Dados de seed para resgates
 * Resgates de prêmios de exemplo com vários status
 */

/**
 * Status de resgate
 */
export const REDEMPTION_STATUS = {
  PENDING: 'pending',           // Apenas resgatado, aguardando processamento
  PROCESSING: 'processing',     // Sendo preparado/pedido
  SHIPPED: 'shipped',           // Em trânsito
  DELIVERED: 'delivered',       // Entregue com sucesso
  CANCELLED: 'cancelled',       // Cancelado pelo usuário ou admin
  REFUNDED: 'refunded',         // Moedas devolvidas ao usuário
}

/**
 * Resgates de exemplo para Gabriel
 * Estes serão criados com status realistas e rastreamento
 */
export const GABRIEL_REDEMPTIONS = [
  {
    // Resgate recente - ainda pendente
    prizeName: 'Cartão Presente Amazon R$ 50',
    variantValue: 'R$ 50',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.PENDING,
    trackingCode: null,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida. O processamento começará em breve.',
        createdBy: 'system',
      },
    ],
  },
  {
    // Em andamento - sendo processado
    prizeName: 'Fones Bluetooth Sem Fio',
    variantValue: 'Preto',
    coinsSpent: 800,
    status: REDEMPTION_STATUS.PROCESSING,
    trackingCode: null,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Pedido realizado com fornecedor. Aguardando preparação para envio.',
        createdBy: 'admin',
      },
    ],
  },
  {
    // Enviado - a caminho
    prizeName: 'Tapete de Yoga Premium',
    variantValue: 'Roxo',
    coinsSpent: 350,
    status: REDEMPTION_STATUS.SHIPPED,
    trackingCode: 'YM2025101234',
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Pedido confirmado e sendo preparado.',
        createdBy: 'admin',
      },
      {
        status: REDEMPTION_STATUS.SHIPPED,
        notes: 'Pacote enviado via Correios. Código de rastreamento: YM2025101234',
        createdBy: 'admin',
      },
    ],
  },
  {
    // Entregue - concluído com sucesso
    prizeName: 'Spotify Premium - 3 Meses',
    variantValue: '3 meses',
    coinsSpent: 300,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'SPOT-CODE-ABC123',
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Gerando código digital.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Código digital entregue por email. Código: SPOT-CODE-ABC123',
        createdBy: 'system',
      },
    ],
  },
  {
    // Entregue - outro pedido concluído
    prizeName: 'Cartão Presente Starbucks R$ 50',
    variantValue: 'Digital',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'SB-DIGITAL-XYZ789',
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Processando cartão presente digital.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Cartão presente digital enviado para o email cadastrado.',
        createdBy: 'system',
      },
    ],
  },
]

/**
 * Resgates de exemplo para outros usuários (prêmios específicos da empresa)
 */
export const COMPANY_REDEMPTIONS = [
  {
    // Ana Costa - prêmio da empresa
    userAuth0Id: 'auth0|demo-employee-valorize-1',
    prizeName: 'Moletom Valorize',
    variantValue: 'M',
    coinsSpent: 600,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'MERCH-2025-001',
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Preparando pedido de produtos.',
        createdBy: 'admin',
      },
      {
        status: REDEMPTION_STATUS.SHIPPED,
        notes: 'Enviado via Correios. Rastreamento: MERCH-2025-001',
        createdBy: 'admin',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Pacote entregue e confirmado pelo destinatário.',
        createdBy: 'system',
      },
    ],
  },
  {
    // Pedro Lima - prêmio global
    userAuth0Id: 'auth0|demo-employee-valorize-2',
    prizeName: 'Kindle Paperwhite',
    variantValue: '8GB',
    coinsSpent: 1200,
    status: REDEMPTION_STATUS.SHIPPED,
    trackingCode: 'AMZN-KINDLE-456',
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Pedido realizado na Amazon.',
        createdBy: 'admin',
      },
      {
        status: REDEMPTION_STATUS.SHIPPED,
        notes: 'Em trânsito. Entrega esperada em 3-5 dias úteis.',
        createdBy: 'admin',
      },
    ],
  },
]

/**
 * Dados de endereço de exemplo para Gabriel
 * Este será usado para criar endereços para resgates
 */
export const GABRIEL_ADDRESS = {
  name: 'Gabriel Fachini',
  street: 'Rua das Flores',
  number: '123',
  complement: 'Apto 456',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567',
  country: 'BR',
  phone: '+55 11 99999-9999',
  isDefault: true,
}

/**
 * Endereços de exemplo para outros usuários
 */
export const SAMPLE_ADDRESSES = [
  {
    userAuth0Id: 'auth0|demo-employee-valorize-1',
    address: {
      name: 'Ana Costa',
      street: 'Rua Augusta',
      number: '456',
      complement: 'Apto 22',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-000',
      country: 'BR',
      phone: '+55 11 91234-5678',
      isDefault: true,
    },
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-2',
    address: {
      name: 'Pedro Lima',
      street: 'Avenida Paulista',
      number: '1578',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-200',
      country: 'BR',
      phone: '+55 11 98765-4321',
      isDefault: true,
    },
  },
]

/**
 * Helper para calcular dias atrás a partir da data atual
 */
export function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}
