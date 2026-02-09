/**
 * Redemption seed data
 * Sample prize redemptions with various statuses
 * ~280 redemptions totaling ~80,000 coins for realistic 3-month scenario
 * Redemption rate: ~40% of distributed coins (80k / 200k)
 */

import { PRODUCT_STATUS } from '@/features/app/prizes/redemptions/redemption.constants'

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
    PRODUCT_STATUS.PENDING,
    PRODUCT_STATUS.PROCESSING,
    PRODUCT_STATUS.SHIPPED,
    PRODUCT_STATUS.DELIVERED,
    PRODUCT_STATUS.DELIVERED,
    PRODUCT_STATUS.DELIVERED,
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
      const trackingCode = status === PRODUCT_STATUS.PENDING ? null : `TRK-${day.toString().padStart(3, '0')}-${redemptionIndex}`

      // Build tracking history based on status
      const tracking = []
      tracking.push({ status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' })

      if (status === PRODUCT_STATUS.PROCESSING || status === PRODUCT_STATUS.SHIPPED || status === PRODUCT_STATUS.DELIVERED) {
        tracking.push({ status: PRODUCT_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' })
      }

      if (status === PRODUCT_STATUS.SHIPPED || status === PRODUCT_STATUS.DELIVERED) {
        tracking.push({ status: PRODUCT_STATUS.SHIPPED, notes: 'Enviado.', createdBy: 'system' })
      }

      if (status === PRODUCT_STATUS.DELIVERED) {
        tracking.push({ status: PRODUCT_STATUS.DELIVERED, notes: 'Entregue ao usuário.', createdBy: 'system' })
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
 * Generate January 2026 redemptions
 * ~2-3 redemptions per day for 19 days (Jan 1-19, 2026)
 * Total: ~38-57 redemptions, ~9,000-14,000 coins
 */
function generateJanuaryRedemptions() {
  const redemptions = []
  const statuses = [
    PRODUCT_STATUS.PENDING,
    PRODUCT_STATUS.PROCESSING,
    PRODUCT_STATUS.SHIPPED,
    PRODUCT_STATUS.DELIVERED,
    PRODUCT_STATUS.DELIVERED,
    PRODUCT_STATUS.DELIVERED,
  ]

  for (let day = 0; day < 19; day++) {
    // 2-3 redemptions per day (more recent dates have fewer deliveries)
    const redemptionsPerDay = day < 10 ? 3 : 2
    
    for (let redemptionIndex = 0; redemptionIndex < redemptionsPerDay; redemptionIndex++) {
      const prizeType = PRIZE_TYPES[(day + redemptionIndex) % PRIZE_TYPES.length]
      const variantValue = prizeType.values[(day + redemptionIndex) % prizeType.values.length]
      const prizeName = `${prizeType.name} - ${variantValue}`
      const coinsSpent = COIN_COSTS[prizeName as keyof typeof COIN_COSTS] || 300

      // Newer redemptions are more likely to be pending or processing
      let status: typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS]
      if (day <= 2) {
        // Older January dates (Jan 1-3) - more likely delivered
        status = [
          PRODUCT_STATUS.DELIVERED,
          PRODUCT_STATUS.DELIVERED,
          PRODUCT_STATUS.SHIPPED,
        ][redemptionIndex % 3]
      } else if (day <= 10) {
        // Mid-January (Jan 4-10) - mix of shipped and processing
        status = [
          PRODUCT_STATUS.PROCESSING,
          PRODUCT_STATUS.SHIPPED,
          PRODUCT_STATUS.DELIVERED,
        ][redemptionIndex % 3]
      } else {
        // Recent January (Jan 11-19) - mostly pending or processing
        status = [
          PRODUCT_STATUS.PENDING,
          PRODUCT_STATUS.PROCESSING,
          PRODUCT_STATUS.SHIPPED,
        ][redemptionIndex % 3]
      }

      // Generate tracking code based on status
      const trackingCode = status === PRODUCT_STATUS.PENDING ? null : `JAN-${day.toString().padStart(2, '0')}-${redemptionIndex}`

      // Build tracking history based on status
      const tracking = []
      tracking.push({ status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' })

      if (status === PRODUCT_STATUS.PROCESSING || status === PRODUCT_STATUS.SHIPPED || status === PRODUCT_STATUS.DELIVERED) {
        tracking.push({ status: PRODUCT_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' })
      }

      if (status === PRODUCT_STATUS.SHIPPED || status === PRODUCT_STATUS.DELIVERED) {
        tracking.push({ status: PRODUCT_STATUS.SHIPPED, notes: 'Enviado.', createdBy: 'system' })
      }

      if (status === PRODUCT_STATUS.DELIVERED) {
        tracking.push({ status: PRODUCT_STATUS.DELIVERED, notes: 'Entregue ao usuário.', createdBy: 'system' })
      }

      redemptions.push({
        prizeName,
        variantValue,
        coinsSpent,
        status,
        trackingCode,
        daysAgo: 18 - day, // January data: 18 days ago to 0 days ago
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
    status: PRODUCT_STATUS.PENDING,
    trackingCode: null,
    daysAgo: 1,
    tracking: [{ status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' }],
  },
  {
    prizeName: 'Spotify Premium - 3 Meses',
    variantValue: '3 meses',
    coinsSpent: 600,
    status: PRODUCT_STATUS.DELIVERED,
    trackingCode: 'SPOT-001',
    daysAgo: 5,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.DELIVERED, notes: 'Código entregue.', createdBy: 'system' },
    ],
  },
  {
    prizeName: 'Cartão Presente Starbucks R$ 50',
    variantValue: 'Digital',
    coinsSpent: 250,
    status: PRODUCT_STATUS.DELIVERED,
    trackingCode: 'STAR-001',
    daysAgo: 10,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.DELIVERED, notes: 'Cartão entregue.', createdBy: 'system' },
    ],
  },
  {
    prizeName: 'Fones Bluetooth Sem Fio',
    variantValue: 'Preto',
    coinsSpent: 800,
    status: PRODUCT_STATUS.SHIPPED,
    trackingCode: 'FONE-001',
    daysAgo: 15,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' },
      { status: PRODUCT_STATUS.SHIPPED, notes: 'Enviado.', createdBy: 'system' },
    ],
  },
  {
    prizeName: 'Curso de Culinária Online',
    variantValue: 'Italiana',
    coinsSpent: 350,
    status: PRODUCT_STATUS.DELIVERED,
    trackingCode: 'CULI-001',
    daysAgo: 20,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' },
      { status: PRODUCT_STATUS.DELIVERED, notes: 'Acesso entregue.', createdBy: 'system' },
    ],
  },
]

/**
 * Expanded employee redemptions - dynamically generated
 * Combines 90-day historical data with January 2026 data
 */
export const EXPANDED_EMPLOYEE_REDEMPTIONS = [
  ...generateRedemptions(),
  ...generateJanuaryRedemptions(),
]

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
    userAuthUserId: '33333333-3333-3333-3333-333333333333',
    prizeName: 'Cartão Presente Amazon R$ 50',
    variantValue: 'R$ 50',
    coinsSpent: 250,
    status: PRODUCT_STATUS.DELIVERED,
    trackingCode: 'AMZ-COM-001',
    daysAgo: 10,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.DELIVERED, notes: 'Cartão entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuthUserId: '44444444-4444-4444-4444-444444444444',
    prizeName: 'Spotify Premium - 3 Meses',
    variantValue: '3 meses',
    coinsSpent: 600,
    status: PRODUCT_STATUS.DELIVERED,
    trackingCode: 'SPOT-COM-001',
    daysAgo: 20,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.DELIVERED, notes: 'Código entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuthUserId: '55555555-5555-5555-5555-555555555555',
    prizeName: 'Cartão Presente Starbucks R$ 50',
    variantValue: 'Cartão Físico',
    coinsSpent: 250,
    status: PRODUCT_STATUS.DELIVERED,
    trackingCode: 'STAR-COM-001',
    daysAgo: 30,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.DELIVERED, notes: 'Cartão entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuthUserId: 'a0000001-0001-0001-0001-000000000001',
    prizeName: 'Fones Bluetooth Sem Fio',
    variantValue: 'Prata',
    coinsSpent: 800,
    status: PRODUCT_STATUS.DELIVERED,
    trackingCode: 'FONE-COM-001',
    daysAgo: 40,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.DELIVERED, notes: 'Fone entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuthUserId: 'a0000001-0001-0001-0001-000000000002',
    prizeName: 'Kindle Paperwhite',
    variantValue: '8GB',
    coinsSpent: 1200,
    status: PRODUCT_STATUS.DELIVERED,
    trackingCode: 'KIN-COM-001',
    daysAgo: 50,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.DELIVERED, notes: 'Kindle entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuthUserId: 'a0000001-0001-0001-0001-000000000003',
    prizeName: 'Cartão Presente iFood R$ 50',
    variantValue: 'R$ 50',
    coinsSpent: 250,
    status: PRODUCT_STATUS.DELIVERED,
    trackingCode: 'IFD-COM-002',
    daysAgo: 35,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.DELIVERED, notes: 'Cartão entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuthUserId: 'a0000001-0001-0001-0001-000000000004',
    prizeName: 'Netflix Premium - 1 Mês',
    variantValue: '1 mês',
    coinsSpent: 200,
    status: PRODUCT_STATUS.DELIVERED,
    trackingCode: 'NET-COM-002',
    daysAgo: 25,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.DELIVERED, notes: 'Código entregue.', createdBy: 'system' },
    ],
  },
  {
    userAuthUserId: 'a0000001-0001-0001-0001-000000000005',
    prizeName: 'Cartão Presente Uber R$ 50',
    variantValue: 'R$ 50',
    coinsSpent: 250,
    status: PRODUCT_STATUS.PROCESSING,
    trackingCode: 'UBR-COM-002',
    daysAgo: 15,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' },
    ],
  },
  {
    userAuthUserId: 'a0000001-0001-0001-0001-000000000006',
    prizeName: 'Cartão Presente Amazon R$ 75',
    variantValue: 'R$ 75',
    coinsSpent: 375,
    status: PRODUCT_STATUS.SHIPPED,
    trackingCode: 'AMZ-COM-002',
    daysAgo: 8,
    tracking: [
      { status: PRODUCT_STATUS.PENDING, notes: 'Solicitação recebida.', createdBy: 'system' },
      { status: PRODUCT_STATUS.PROCESSING, notes: 'Em processamento.', createdBy: 'system' },
      { status: PRODUCT_STATUS.SHIPPED, notes: 'Enviado.', createdBy: 'system' },
    ],
  },
]

/**
 * Sample addresses for users
 */
export const SAMPLE_ADDRESSES = [
  {
    userAuthUserId: '33333333-3333-3333-3333-333333333333',
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
    userAuthUserId: '44444444-4444-4444-4444-444444444444',
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
    userAuthUserId: '55555555-5555-5555-5555-555555555555',
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
    userAuthUserId: 'a0000001-0001-0001-0001-000000000001',
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
    userAuthUserId: 'a0000001-0001-0001-0001-000000000002',
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
    userAuthUserId: 'a0000001-0001-0001-0001-000000000003',
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
    userAuthUserId: 'a0000001-0001-0001-0001-000000000004',
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
    userAuthUserId: 'a0000001-0001-0001-0001-000000000005',
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
    userAuthUserId: 'a0000001-0001-0001-0001-000000000006',
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
