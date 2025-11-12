/**
 * Redemption Status Constants
 *
 * Vouchers (Digital):
 * - SENT: Email delivered successfully (via Tremendous webhook)
 * - FAILED: Creation or delivery failed
 *
 * Physical Products:
 * - PENDING: Order received
 * - PROCESSING: Being prepared
 * - SHIPPED: Sent to customer
 * - DELIVERED: Received by customer
 * - CANCELLED: Cancelled
 * - REFUNDED: Refunded
 */

export const VOUCHER_STATUS = {
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const

export const PHYSICAL_PRODUCT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const

export const REDEMPTION_STATUS = {
  ...VOUCHER_STATUS,
  ...PHYSICAL_PRODUCT_STATUS,
} as const

// TypeScript types
export type VoucherStatus = (typeof VOUCHER_STATUS)[keyof typeof VOUCHER_STATUS]
export type PhysicalProductStatus = (typeof PHYSICAL_PRODUCT_STATUS)[keyof typeof PHYSICAL_PRODUCT_STATUS]
export type RedemptionStatus = (typeof REDEMPTION_STATUS)[keyof typeof REDEMPTION_STATUS]

// Helper sets
export const NON_CANCELABLE_STATUSES = new Set<RedemptionStatus>([
  PHYSICAL_PRODUCT_STATUS.SHIPPED,
  PHYSICAL_PRODUCT_STATUS.DELIVERED,
  PHYSICAL_PRODUCT_STATUS.CANCELLED,
  PHYSICAL_PRODUCT_STATUS.REFUNDED,
])

export const FINAL_STATUSES = new Set<RedemptionStatus>([
  VOUCHER_STATUS.SENT,
  VOUCHER_STATUS.FAILED,
  PHYSICAL_PRODUCT_STATUS.DELIVERED,
  PHYSICAL_PRODUCT_STATUS.CANCELLED,
  PHYSICAL_PRODUCT_STATUS.REFUNDED,
])

// Tremendous webhook event types
export const TREMENDOUS_WEBHOOK_EVENTS = {
  DELIVERY_SUCCEEDED: 'REWARDS.DELIVERY.SUCCEEDED',
  DELIVERY_FAILED: 'REWARDS.DELIVERY.FAILED',
  CANCELED: 'REWARDS.CANCELED',
  FLAGGED: 'REWARDS.FLAGGED',
} as const

export type TremendousWebhookEvent = (typeof TREMENDOUS_WEBHOOK_EVENTS)[keyof typeof TREMENDOUS_WEBHOOK_EVENTS]
