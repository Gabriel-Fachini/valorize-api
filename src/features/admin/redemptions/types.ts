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
  status?: string
  userId?: string
  prizeId?: string
  type?: 'voucher' | 'experience' | 'physical'
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
