/**
 * Redemption seed data
 * Sample prize redemptions with various statuses
 */

/**
 * Redemption status enum
 */
export const REDEMPTION_STATUS = {
  PENDING: 'pending',           // Just redeemed, awaiting processing
  PROCESSING: 'processing',     // Being prepared/ordered
  SHIPPED: 'shipped',           // In transit
  DELIVERED: 'delivered',       // Successfully delivered
  CANCELLED: 'cancelled',       // Cancelled by user or admin
  REFUNDED: 'refunded',         // Coins returned to user
}

/**
 * Sample redemptions for Gabriel
 * Distributed over the last 60 days for dashboard visualization
 */
export const GABRIEL_REDEMPTIONS = [
  {
    // Recent redemption - still pending (1 day ago)
    prizeName: 'Cartão Presente Amazon R$ 50',
    variantValue: 'R$ 50',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.PENDING,
    trackingCode: null,
    daysAgo: 1,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida. O processamento começará em breve.',
        createdBy: 'system',
      },
    ],
  },
  {
    // In progress - being processed (5 days ago)
    prizeName: 'Fones Bluetooth Sem Fio',
    variantValue: 'Preto',
    coinsSpent: 800,
    status: REDEMPTION_STATUS.PROCESSING,
    trackingCode: null,
    daysAgo: 5,
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
    // Shipped - on the way (8 days ago)
    prizeName: 'Tapete de Yoga Premium',
    variantValue: 'Roxo',
    coinsSpent: 350,
    status: REDEMPTION_STATUS.SHIPPED,
    trackingCode: 'YM2025101234',
    daysAgo: 8,
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
    // Delivered - recent (12 days ago)
    prizeName: 'Spotify Premium - 3 Meses',
    variantValue: '3 meses',
    coinsSpent: 300,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'SPOT-CODE-ABC123',
    daysAgo: 12,
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
    // Delivered (20 days ago)
    prizeName: 'Cartão Presente Starbucks R$ 50',
    variantValue: 'Digital',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'SB-DIGITAL-XYZ789',
    daysAgo: 20,
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
  {
    // Delivered (28 days ago)
    prizeName: 'Netflix Premium - 1 Mês',
    variantValue: '1 mês',
    coinsSpent: 200,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'NETFLIX-2025-VLZ',
    daysAgo: 28,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Gerando código de assinatura.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Código de assinatura enviado com sucesso.',
        createdBy: 'system',
      },
    ],
  },
  {
    // Delivered (35 days ago)
    prizeName: 'Garrafa Térmica Personalizada',
    variantValue: 'Azul',
    coinsSpent: 400,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'GT-2025-0421',
    daysAgo: 35,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Pedido em produção.',
        createdBy: 'admin',
      },
      {
        status: REDEMPTION_STATUS.SHIPPED,
        notes: 'Produto enviado via transportadora.',
        createdBy: 'admin',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Produto entregue e confirmado pelo destinatário.',
        createdBy: 'system',
      },
    ],
  },
  {
    // Delivered (45 days ago)
    prizeName: 'Curso Online Udemy',
    variantValue: 'Qualquer curso',
    coinsSpent: 600,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'UDEMY-VLZ-2025',
    daysAgo: 45,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Processando voucher de curso.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Voucher enviado por email com instruções de uso.',
        createdBy: 'system',
      },
    ],
  },
]

/**
 * Sample redemptions for other users (distributed over time)
 */
export const COMPANY_REDEMPTIONS = [
  {
    // Ana Costa - company prize (15 days ago - delivered)
    userAuth0Id: 'auth0|demo-employee-valorize-1',
    prizeName: 'Moletom Valorize',
    variantValue: 'M',
    coinsSpent: 600,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'MERCH-2025-001',
    daysAgo: 15,
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
    // Pedro Lima - global prize (7 days ago - shipped)
    userAuth0Id: 'auth0|demo-employee-valorize-2',
    prizeName: 'Kindle Paperwhite',
    variantValue: '8GB',
    coinsSpent: 1200,
    status: REDEMPTION_STATUS.SHIPPED,
    trackingCode: 'AMZN-KINDLE-456',
    daysAgo: 7,
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
  {
    // João Santos (Admin) - old redemption (30 days ago - delivered)
    userAuth0Id: 'auth0|demo-company-admin-valorize',
    prizeName: 'Cartão Presente Amazon R$ 50',
    variantValue: 'R$ 50',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'AMZ-DIGITAL-789',
    daysAgo: 30,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Processando código de presente digital.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Código digital enviado por email.',
        createdBy: 'system',
      },
    ],
  },
  {
    // Maria Silva (HR) - recent redemption (3 days ago - processing)
    userAuth0Id: 'auth0|demo-hr-manager-valorize',
    prizeName: 'Garrafa Térmica Personalizada',
    variantValue: 'Rosa',
    coinsSpent: 400,
    status: REDEMPTION_STATUS.PROCESSING,
    trackingCode: null,
    daysAgo: 3,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Pedido em produção. Previsão de envio em 2-3 dias.',
        createdBy: 'admin',
      },
    ],
  },
  {
    // Carlos Souza (Team Lead) - old redemption (42 days ago - delivered)
    userAuth0Id: 'auth0|demo-team-lead-valorize',
    prizeName: 'Spotify Premium - 3 Meses',
    variantValue: '3 meses',
    coinsSpent: 300,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'SPOT-VLZ-2025-02',
    daysAgo: 42,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Solicitação de resgate recebida.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Gerando código de assinatura.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Código de assinatura ativado com sucesso.',
        createdBy: 'system',
      },
    ],
  },
]

/**
 * Sample address data for Gabriel
 * Used to create addresses for redemptions
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
 * Sample addresses for other users
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
 * Helper function to calculate dates in the past
 */
export function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}
