/**
 * Redemption seed data
 * Sample prize redemptions with various statuses
 */

/**
 * Redemption statuses
 */
export const REDEMPTION_STATUS = {
  PENDING: 'pending',           // Just redeemed, awaiting processing
  PROCESSING: 'processing',     // Being prepared/ordered
  SHIPPED: 'shipped',           // In transit
  DELIVERED: 'delivered',       // Successfully delivered
  CANCELLED: 'cancelled',       // User or admin cancelled
  REFUNDED: 'refunded',         // Coins returned to user
}

/**
 * Sample redemptions for Gabriel
 * These will be created with realistic statuses and tracking
 */
export const GABRIEL_REDEMPTIONS = [
  {
    // Recent redemption - still pending
    prizeName: 'Amazon Gift Card $25',
    variantValue: '$25',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.PENDING,
    trackingCode: null,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Redemption request received. Processing will begin shortly.',
        createdBy: 'system',
      },
    ],
  },
  {
    // In progress - being processed
    prizeName: 'Wireless Bluetooth Headphones',
    variantValue: 'Black',
    coinsSpent: 800,
    status: REDEMPTION_STATUS.PROCESSING,
    trackingCode: null,
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Redemption request received.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Order placed with supplier. Waiting for shipment preparation.',
        createdBy: 'admin',
      },
    ],
  },
  {
    // Shipped - on the way
    prizeName: 'Yoga Mat Premium',
    variantValue: 'Purple',
    coinsSpent: 350,
    status: REDEMPTION_STATUS.SHIPPED,
    trackingCode: 'YM2025101234',
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Redemption request received.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Order confirmed and being prepared.',
        createdBy: 'admin',
      },
      {
        status: REDEMPTION_STATUS.SHIPPED,
        notes: 'Package shipped via FedEx. Tracking number: YM2025101234',
        createdBy: 'admin',
      },
    ],
  },
  {
    // Delivered - completed successfully
    prizeName: 'Spotify Premium - 3 Months',
    variantValue: '3 months',
    coinsSpent: 300,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'SPOT-CODE-ABC123',
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Redemption request received.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Generating digital code.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Digital code delivered via email. Code: SPOT-CODE-ABC123',
        createdBy: 'system',
      },
    ],
  },
  {
    // Delivered - another completed order
    prizeName: 'Starbucks Gift Card $25',
    variantValue: 'Digital',
    coinsSpent: 250,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'SB-DIGITAL-XYZ789',
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Redemption request received.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Processing digital gift card.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Digital gift card sent to registered email.',
        createdBy: 'system',
      },
    ],
  },
]

/**
 * Sample redemptions for other users (company-specific prizes)
 */
export const COMPANY_REDEMPTIONS = [
  {
    // Ana Costa - company prize
    userAuth0Id: 'auth0|demo-employee-valorize-1',
    prizeName: 'Valorize Branded Hoodie',
    variantValue: 'M',
    coinsSpent: 600,
    status: REDEMPTION_STATUS.DELIVERED,
    trackingCode: 'MERCH-2025-001',
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Redemption request received.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Preparing merchandise order.',
        createdBy: 'admin',
      },
      {
        status: REDEMPTION_STATUS.SHIPPED,
        notes: 'Shipped via UPS. Tracking: MERCH-2025-001',
        createdBy: 'admin',
      },
      {
        status: REDEMPTION_STATUS.DELIVERED,
        notes: 'Package delivered and confirmed by recipient.',
        createdBy: 'system',
      },
    ],
  },
  {
    // Pedro Lima - global prize
    userAuth0Id: 'auth0|demo-employee-valorize-2',
    prizeName: 'Kindle Paperwhite E-Reader',
    variantValue: '8GB',
    coinsSpent: 1200,
    status: REDEMPTION_STATUS.SHIPPED,
    trackingCode: 'AMZN-KINDLE-456',
    tracking: [
      {
        status: REDEMPTION_STATUS.PENDING,
        notes: 'Redemption request received.',
        createdBy: 'system',
      },
      {
        status: REDEMPTION_STATUS.PROCESSING,
        notes: 'Order placed with Amazon.',
        createdBy: 'admin',
      },
      {
        status: REDEMPTION_STATUS.SHIPPED,
        notes: 'In transit. Expected delivery in 3-5 business days.',
        createdBy: 'admin',
      },
    ],
  },
]

/**
 * Sample address data for Gabriel
 * This will be used to create addresses for redemptions
 */
export const GABRIEL_ADDRESS = {
  name: 'Gabriel Fachini',
  street: '123 Main Street',
  number: '456',
  complement: 'Apt 789',
  neighborhood: 'Downtown',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94102',
  country: 'US',
  phone: '+1-555-0123',
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
      country: 'Brazil',
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
      country: 'Brazil',
      phone: '+55 11 98765-4321',
      isDefault: true,
    },
  },
]

/**
 * Helper to calculate days ago from current date
 */
export function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}
