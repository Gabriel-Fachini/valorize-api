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
