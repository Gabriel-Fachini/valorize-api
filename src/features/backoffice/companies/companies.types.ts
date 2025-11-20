import type { Company, CompanyPlan, CompanyWallet, PlanType } from '@prisma/client'

/**
 * Pagination params for list queries
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Sorting params for list queries
 */
export interface SortingParams {
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'mrr'
  sortOrder: 'asc' | 'desc'
}

/**
 * Filter params for company listing
 */
export interface CompanyFilters {
  search?: string // Search in name, CNPJ, domain
  status?: 'active' | 'inactive'
  planType?: PlanType
  country?: string
  createdAfter?: Date
  createdBefore?: Date
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  aggregations?: Record<string, any>
}

/**
 * Company list item (minimal data for listing)
 */
export interface CompanyListItem {
  id: string
  name: string
  domain: string
  country: string
  logoUrl: string | null
  planType: PlanType | null
  isActive: boolean
  totalUsers: number
  activeUsers: number
  currentMRR: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Company details (full data)
 */
export interface CompanyDetails extends Company {
  companyBrazil?: any
  contacts: any[]
  settings?: any
  wallet: CompanyWalletStatus | null
  plan: CompanyPlan | null
  allowedDomains: any[]
  metrics: CompanyMetrics
  billing: BillingInfo
}

/**
 * Company wallet status
 */
export interface CompanyWalletStatus {
  id: string
  balance: number
  totalDeposited: number
  totalSpent: number
  isFrozen: boolean
  burnRate: number | null // Monthly burn rate
  coverageIndex: number | null // Months of coverage
  totalRedemptions: {
    vouchers: number
    products: number
  }
  projectedDepletion: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Company metrics
 */
export interface CompanyMetrics {
  users: {
    total: number
    active: number
    inactive: number
  }
  compliments: {
    sent: number
    received: number
    period?: {
      startDate: Date
      endDate: Date
      sent: number
      received: number
    }
  }
  engagement: {
    WAU: number // Weekly Active Users
    complimentUsageRate: number // Percentage
  }
  redemptions: {
    total: number
    vouchers: number
    products: number
    averageTicket: number
  }
  values: {
    total: number
    active: number
  }
}

/**
 * Billing information
 */
export interface BillingInfo {
  currentMRR: number
  activeUsers: number
  planType: PlanType | null
  pricePerUser: number
  estimatedMonthlyAmount: number
  nextBillingDate: Date | null
  billingEmail: string | null
}

/**
 * Company creation input (wizard)
 */
export interface CreateCompanyInput {
  // Basic data
  name: string
  domain: string
  country: string
  timezone: string
  logoUrl?: string
  billingEmail?: string

  // Brazil-specific (if country = 'BR')
  companyBrazil?: {
    cnpj: string
    razaoSocial: string
    inscricaoEstadual?: string
    inscricaoMunicipal?: string
    nire?: string
    cnaePrincipal: string
    cnaeSecundario?: string
    naturezaJuridica: string
    porteEmpresa: string
    situacaoCadastral: string
  }

  // First admin user (required)
  firstAdmin: {
    name: string
    email: string
  }

  // Contacts are managed separately via dedicated endpoints after company creation

  // Plan
  plan: {
    planType: PlanType
    pricePerUser?: number // Optional override
    startDate: string // ISO date
  }

  // Initial company values (minimum 2)
  initialValues: Array<{
    title: string
    description?: string
    example?: string
    iconName?: string
    iconColor?: string
  }>

  // Initial wallet budget
  initialWalletBudget?: number
}

/**
 * Company update input
 */
export interface UpdateCompanyInput {
  name?: string
  domain?: string
  logoUrl?: string
  country?: string
  timezone?: string
  billingEmail?: string

  // Brazil-specific updates
  companyBrazil?: {
    cnpj?: string
    razaoSocial?: string
    inscricaoEstadual?: string
    inscricaoMunicipal?: string
    nire?: string
    cnaePrincipal?: string
    cnaeSecundario?: string
    naturezaJuridica?: string
    porteEmpresa?: string
    situacaoCadastral?: string
  }
}

/**
 * Add wallet credits input
 */
export interface AddWalletCreditsInput {
  amount: number
  reason: string
}

/**
 * Remove wallet credits input
 */
export interface RemoveWalletCreditsInput {
  amount: number
  reason: string
}

/**
 * Update company plan input
 */
export interface UpdateCompanyPlanInput {
  planType: PlanType
  pricePerUser?: number
  startDate?: string // ISO date
}

/**
 * Add company contact input (link existing user to company)
 */
export interface AddCompanyContactInput {
  userId: string
  role: string
}

/**
 * Update company contact input
 */
export interface UpdateCompanyContactInput {
  role?: string
  isPrimary?: boolean
}

/**
 * Add allowed domain input
 */
export interface AddAllowedDomainInput {
  domain: string
}

/**
 * Metrics query params
 */
export interface MetricsQueryParams {
  startDate?: Date
  endDate?: Date
}
