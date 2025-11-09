/**
 * Redemption seed data
 * Sample prize redemptions with various statuses
 * ~280 redemptions totaling ~80,000 coins for realistic 3-month scenario
 * Redemption rate: ~40% of distributed coins (80k / 200k)
 */

/**
 * Redemption status enum
 */
export const REDEMPTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
}

/**
 * Prize types for distribution
 */
const PRIZE_TYPES = [
  { name: 'Cartão Presente Amazon', values: ['R$ 30', 'R$ 50', 'R$ 75', 'R$ 100'] },
  { name: 'Cartão Presente iFood', values: ['R$ 30', 'R$ 50', 'R$ 75', 'R$ 100'] },
  { name: 'Cartão Presente Uber', values: ['R$ 25', 'R$ 50', 'R$ 75'] },
  { name: 'Spotify Premium', values: ['1 mês', '3 meses'] },
  { name: 'Netflix Premium', values: ['1 mês', '3 meses'] },
]

/**
 * Coin costs for each prize (estimated)
 */
const COIN_COSTS = {
  'Cartão Presente Amazon R$ 30': 150,
  'Cartão Presente Amazon R$ 50': 250,
  'Cartão Presente Amazon R$ 75': 375,
  'Cartão Presente Amazon R$ 100': 500,
  'Cartão Presente iFood R$ 30': 150,
  'Cartão Presente iFood R$ 50': 250,
  'Cartão Presente iFood R$ 75': 375,
  'Cartão Presente iFood R$ 100': 500,
  'Cartão Presente Uber R$ 25': 125,
  'Cartão Presente Uber R$ 50': 250,
  'Cartão Presente Uber R$ 75': 375,
  'Spotify Premium 1 mês': 250,
  'Spotify Premium 3 meses': 600,
  'Netflix Premium 1 mês': 200,
  'Netflix Premium 3 meses': 500,
}

/**
 * Generate redemptions dynamically
 * ~280 redemptions over 90 days = ~3 per day
 * Total: ~80,000 coins
 */
function generateRedemptions() {
  const redemptions = []
  const statuses = [
    REDEMPTION_STATUS.PENDING,
    REDEMPTION_STATUS.PROCESSING,
    REDEMPTION_STATUS.SHIPPED,
    REDEMPTION_STATUS.DELIVERED,
    REDEMPTION_STATUS.DELIVERED,
    REDEMPTION_STATUS.DELIVERED,
  ]

  let totalCoins = 0

  for (let day = 0; day < 90; day++) {
    // ~3 redemptions per day
    for (let redemptionIndex = 0; redemptionIndex < 3; redemptionIndex++) {
      const prizeType = PRIZE_TYPES[redemptionIndex % PRIZE_TYPES.length]
      const variantValue = prizeType.values[day % prizeType.values.length]
      const prizeName = `${prizeType.name} - ${variantValue}`
      const coinsSpent = COIN_COSTS[prizeName as keyof typeof COIN_COSTS] || 300

      // Distribute statuses with more delivered at the beginning
      const statusIndex = (day * 2 + redemptionIndex) % statuses.length
      const status = statuses[statusIndex]

      // Generate tracking code
      const trackingCode = status === REDEMPTION_STATUS.PENDING ? null : `TRK-${day.toString().padStart(3, '0')}-${redemptionIndex}`

      // Build tracking history based on status
      const tracking = []
      tracking.push({ status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' })

      if (status === REDEMPTION_STATUS.PROCESSING || status === REDEMPTION_STATUS.SHIPPED || status === REDEMPTION_STATUS.DELIVERED) {
        tracking.push({ status: REDEMPTION_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' })
      }

      if (status === REDEMPTION_STATUS.SHIPPED || status === REDEMPTION_STATUS.DELIVERED) {
        tracking.push({ status: REDEMPTION_STATUS.SHIPPED, notes: 'Enviado.', createdBy: 'system' })
      }

      if (status === REDEMPTION_STATUS.DELIVERED) {
        tracking.push({ status: REDEMPTION_STATUS.DELIVERED, notes: 'Entregue ao usuário.', createdBy: 'system' })
      }

      totalCoins += coinsSpent

      redemptions.push({
        prizeName,
        variantValue,
        coinsSpent,
        status,
        trackingCode,
        daysAgo: 90 - day,
        tracking,
      })
    }
  }

  return redemptions
}

/**
 * Gabriel's specific redemptions (smaller set for narrative)
 */
export const GABRIEL_REDEMPTIONS = [
  {
    prizeName: 'Cartão Presente Amazon R$ 100',
    variantValue: 'R$ 100',
    coinsSpent: 500,
    status: REDEMPTION_STATUS.PENDING,
    trackingCode: null,
    daysAgo: 1,
    tracking: [{ status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' }],
  },
  {
    prizeName: 'Spotify Premium - 3 Meses',
    variantValue: '3 meses',
    coinsSpent: 600,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'SPOT-001',
    daysAgo: 5,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.DELIVERED, notes: 'Código entregue.', createdBy: 'system' },
    ],
  },
  {
    prizeName: 'Cartão Presente Starbucks R$ 50',
    variantValue: 'Digital',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'STAR-001',
    daysAgo: 10,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.DELIVERED, notes: 'Cartão entregue.', createdBy: 'system' },
    ],
  },
  {
    prizeName: 'Fones Bluetooth Sem Fio',
    variantValue: 'Preto',
    coinsSpent: 800,
    status: REDEMPTION_STATUS.SHIPPED,
    trackingCode: 'FONE-001',
    daysAgo: 15,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.SHIPPED, notes: 'Enviado.', createdBy: 'system' },
    ],
  },
  {
    prizeName: 'Curso de Culinária Online',
    variantValue: 'Italiana',
    coinsSpent: 350,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'CULI-001',
    daysAgo: 20,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.DELIVERED, notes: 'Acesso entregue.', createdBy: 'system' },
    ],
  },
]

/**
 * Expanded employee redemptions - dynamically generated
 */
export const EXPANDED_EMPLOYEE_REDEMPTIONS = generateRedemptions()

/**
 * Helper function to create dates in the past
 */
export function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

/**
 * Gabriel's address for redemptions
 */
export const GABRIEL_ADDRESS = {
  name: 'Meu Endereço',
  street: 'Rua das Flores',
  number: '123',
  complement: 'Apt 45',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-100',
  country: 'Brazil',
  phone: '(11) 98765-4321',
  isDefault: true,
}

/**
 * Company redemptions for other users
 * Using 50 users (17 real + 33 temp) with diverse redemptions
 */
export const COMPANY_REDEMPTIONS = [
  {
    userAuth0Id: 'auth0|demo-company-admin-valorize',
    prizeName: 'Cartão Presente Amazon R$ 50',
    variantValue: 'R$ 50',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'AMZ-COM-001',
    daysAgo: 10,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.DELIVERED, notes: 'Cartão entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuth0Id: 'auth0|demo-hr-manager-valorize',
    prizeName: 'Spotify Premium - 3 Meses',
    variantValue: '3 meses',
    coinsSpent: 600,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'SPOT-COM-001',
    daysAgo: 20,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.DELIVERED, notes: 'Código entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuth0Id: 'auth0|demo-team-lead-valorize',
    prizeName: 'Cartão Presente Starbucks R$ 50',
    variantValue: 'Cartão Físico',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'STAR-COM-001',
    daysAgo: 30,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.DELIVERED, notes: 'Cartão entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-1',
    prizeName: 'Fones Bluetooth Sem Fio',
    variantValue: 'Prata',
    coinsSpent: 800,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'FONE-COM-001',
    daysAgo: 40,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.DELIVERED, notes: 'Fone entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-2',
    prizeName: 'Kindle Paperwhite',
    variantValue: '8GB',
    coinsSpent: 1200,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'KIN-COM-001',
    daysAgo: 50,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.DELIVERED, notes: 'Kindle entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-3',
    prizeName: 'Cartão Presente iFood R$ 50',
    variantValue: 'R$ 50',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'IFD-COM-002',
    daysAgo: 35,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.DELIVERED, notes: 'Cartão entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-4',
    prizeName: 'Netflix Premium - 1 Mês',
    variantValue: '1 mês',
    coinsSpent: 200,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'NET-COM-002',
    daysAgo: 25,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.DELIVERED, notes: 'Código entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-5',
    prizeName: 'Cartão Presente Uber R$ 50',
    variantValue: 'R$ 50',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.PROCESSING,
    trackingCode: 'UBR-COM-002',
    daysAgo: 15,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' },
    ],
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-6',
    prizeName: 'Cartão Presente Amazon R$ 75',
    variantValue: 'R$ 75',
    coinsSpent: 375,
    status: REDEMPTION_STATUS.SHIPPED,
    trackingCode: 'AMZ-COM-002',
    daysAgo: 8,
    tracking: [
      { status: REDEMPTION_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' },
      { status: REDEMPTION_STATUS.SHIPPED, notes: 'Enviado.', createdBy: 'system' },
    ],
  },
]

/**
 * Sample addresses for users
 */
export const SAMPLE_ADDRESSES = [
  {
    userAuth0Id: 'auth0|demo-company-admin-valorize',
    address: {
      name: 'Meu Endereço',
      street: 'Av. Paulista',
      number: '1000',
      complement: '',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01311-100',
      country: 'Brazil',
      phone: '(11) 91234-5678',
      isDefault: true,
    },
  },
  {
    userAuth0Id: 'auth0|demo-hr-manager-valorize',
    address: {
      name: 'Meu Endereço',
      street: 'Rua Oscar Freire',
      number: '500',
      complement: 'Suite 200',
      neighborhood: 'Cerqueira César',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01426-100',
      country: 'Brazil',
      phone: '(11) 92345-6789',
      isDefault: true,
    },
  },
  {
    userAuth0Id: 'auth0|demo-team-lead-valorize',
    address: {
      name: 'Meu Endereço',
      street: 'Rua Augusta',
      number: '2500',
      complement: '',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-100',
      country: 'Brazil',
      phone: '(11) 93456-7890',
      isDefault: true,
    },
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-1',
    address: {
      name: 'Meu Endereço',
      street: 'Rua Haddock Lobo',
      number: '350',
      complement: 'Apt 1001',
      neighborhood: 'Higienópolis',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01414-002',
      country: 'Brazil',
      phone: '(11) 94567-8901',
      isDefault: true,
    },
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-2',
    address: {
      name: 'Meu Endereço',
      street: 'Alameda Franca',
      number: '1200',
      complement: '',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01422-002',
      country: 'Brazil',
      phone: '(11) 95678-9012',
      isDefault: true,
    },
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-3',
    address: {
      name: 'Meu Endereço',
      street: 'Rua Vergueiro',
      number: '2000',
      complement: 'Bloco B',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04101-000',
      country: 'Brazil',
      phone: '(11) 96789-0123',
      isDefault: true,
    },
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-4',
    address: {
      name: 'Meu Endereço',
      street: 'Av. Rebouças',
      number: '3000',
      complement: '',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05402-600',
      country: 'Brazil',
      phone: '(11) 97890-1234',
      isDefault: true,
    },
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-5',
    address: {
      name: 'Meu Endereço',
      street: 'Rua dos Três Irmãos',
      number: '500',
      complement: 'Casa 3',
      neighborhood: 'Vila Progredior',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05615-190',
      country: 'Brazil',
      phone: '(11) 98901-2345',
      isDefault: true,
    },
  },
  {
    userAuth0Id: 'auth0|demo-employee-valorize-6',
    address: {
      name: 'Meu Endereço',
      street: 'Rua Fidalga',
      number: '700',
      complement: 'Apt 501',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05432-070',
      country: 'Brazil',
      phone: '(11) 99012-3456',
      isDefault: true,
    },
  },
]
