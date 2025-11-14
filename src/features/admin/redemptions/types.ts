export interface SendVoucherToUserRequest {
  userId: string
  email: string
  prizeId: string
  customAmount: number
}

export interface BulkRedeemVouchersRequest {
  prizeId: string
  customAmount: number
  campaignId?: string
  allUsersSelected?: boolean
  users?: Array<{
    userId: string
    email: string
  }>
}

export interface RedemptionResult {
  userId: string
  email: string
  prizeId: string
  success: boolean
  redemptionId?: string
  voucherLink?: string
  voucherCode?: string
  error?: string
}

export interface BulkRedemptionResponse {
  message: string
  summary: {
    total: number
    successful: number
    failed: number
  }
  results: RedemptionResult[]
}

// Admin Redemption Management Types
export interface RedemptionListFilters {
  search?: string
  status?: string // Status filter as string, will be validated as RedemptionStatus
  type?: 'voucher' | 'product'
  limit?: number
  offset?: number
}

export interface RedemptionListItem {
  id: string
  userId: string
  userName: string
  userEmail: string
  prizeId: string
  prizeName: string
  prizeType: string
  prizeImage?: string | null
  status: string
  coinsSpent: number
  redeemedAt: Date
  trackingCode?: string | null
}

export interface RedemptionDetailsResponse {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  prizeId: string
  prize: {
    id: string
    name: string
    type: string
    description?: string
  }
  variantId?: string | null
  variant?: {
    id: string
    name: string
  } | null
  status: string
  coinsSpent: number
  redeemedAt: Date
  addressId?: string | null
  trackingCode?: string | null
  trackingCarrier?: string | null
  notes?: string | null
  voucherRedemption?: {
    provider: string
    voucherCode?: string
    voucherLink?: string
    status: string
    completedAt?: Date
  } | null
  tracking: Array<{
    id: string
    status: string
    notes?: string | null
    createdBy?: string | null
    createdAt: Date
  }>
}

export interface UpdateStatusPayload {
  status: string
  notes?: string
}

export interface AddTrackingPayload {
  trackingCode: string
  carrier?: string
  notes?: string
}

export interface AddNotePayload {
  note: string
}

export interface CancelRedemptionPayload {
  reason?: string
}

export interface CancelRedemptionResult {
  redemptionId: string
  coinsRefunded: number
  budgetRefunded: number
  message: string
}

// Metrics Interfaces
export interface RedemptionMetricsFilters {
  startDate?: Date
  endDate?: Date
}

export interface VolumeMetrics {
  totalRedemptions: number
  totalCoinsSpent: number
  totalValueBRL: number
  avgCoinsPerRedemption: number
  periodComparison: {
    redemptionsChange: string
    valueChange: string
  }
}

export interface StatusMetrics {
  status: string
  count: number
  percentage: number
}

export interface TypeMetrics {
  type: 'voucher' | 'product'
  count: number
  percentage: number
  totalValueBRL: number
  statusBreakdown: Record<string, number>
}

export interface PrizeMetrics {
  prizeId: string
  prizeName: string
  prizeType: 'voucher' | 'product'
  redemptionCount: number
  totalCoinsSpent: number
  totalValueBRL: number
}

export interface EngagementMetrics {
  uniqueRedeemers: number
  totalActiveUsers: number
  percentageOfActive: number
  repeatRedeemers: number
  repeatRate: number
  avgRedemptionsPerUser: number
}

export interface FinancialMetrics {
  totalCost: number
  voucherCost: number
  productCost: number
  avgCostPerRedemption: number
  projectedMonthlyCost: number
}

export interface RedemptionMetrics {
  period: {
    startDate: Date
    endDate: Date
  }
  volume: VolumeMetrics
  statusBreakdown: StatusMetrics[]
  typeBreakdown: TypeMetrics[]
  topPrizes: PrizeMetrics[]
  userEngagement: EngagementMetrics
  financialImpact: FinancialMetrics
}
