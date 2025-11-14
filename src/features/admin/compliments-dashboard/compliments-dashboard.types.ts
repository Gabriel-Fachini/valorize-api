// Period definitions
export interface DashboardPeriod {
  startDate: Date
  endDate: Date
  previousPeriod: {
    startDate: Date
    endDate: Date
  }
}

// Overview metrics
export interface OverviewMetrics {
  totalCompliments: number
  totalCoinsDistributed: number
  activeUsers: {
    count: number
    percentage: number
    total: number
  }
  avgCoinsPerCompliment: number
  engagementRate: number
  comparison: {
    complimentsChange: number
    complimentsChangeLabel: string
    coinsChange: number
    coinsChangeLabel: string
    usersChange: number
    usersChangeLabel: string
  }
}

// Value distribution
export interface ValueDistribution {
  valueId: number
  valueName: string
  description: string | null
  iconName: string | null
  iconColor: string | null
  count: number
  percentage: number
  totalCoins: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

// User metrics
export interface TopSender {
  userId: string
  name: string
  email: string
  avatar: string | null
  department: string | null
  jobTitle: string | null
  sentCount: number
  totalCoinsSent: number
  avgCoinsPerCompliment: number
}

export interface TopReceiver {
  userId: string
  name: string
  email: string
  avatar: string | null
  department: string | null
  jobTitle: string | null
  receivedCount: number
  totalCoinsReceived: number
  avgCoinsPerCompliment: number
}

export interface BalancedUser {
  userId: string
  name: string
  email: string
  avatar: string | null
  department: string | null
  sentCount: number
  receivedCount: number
  balanceScore: number
}

export interface TopUsersMetrics {
  senders: TopSender[]
  receivers: TopReceiver[]
  balanced: BalancedUser[]
}

// Department analytics
export interface DepartmentStat {
  departmentId: string
  departmentName: string
  totalUsers: number
  activeUsers: number
  totalCompliments: number
  avgPerUser: number
  engagementRate: number
  topValue: {
    valueName: string
    count: number
  } | null
}

export interface CrossDepartmentFlow {
  fromDepartmentId: string | null
  fromDepartmentName: string | null
  toDepartmentId: string | null
  toDepartmentName: string | null
  complimentCount: number
  coinAmount: number
}

export interface DepartmentAnalytics {
  departments: DepartmentStat[]
  crossDepartmentFlow: CrossDepartmentFlow[]
}

// Temporal patterns
export interface WeeklyTrend {
  weekStart: string
  weekEnd: string
  count: number
  coins: number
}

export interface DayOfWeekDistribution {
  dayOfWeek: number
  dayName: string
  count: number
  percentage: number
}

export interface HourlyDistribution {
  hour: number
  count: number
  percentage: number
}

export interface MonthlyGrowth {
  currentMonth: {
    month: string
    count: number
    coins: number
  }
  previousMonth: {
    month: string
    count: number
    coins: number
  }
  growthRate: number
}

export interface TemporalPatterns {
  weeklyTrend: WeeklyTrend[]
  dayOfWeekDistribution: DayOfWeekDistribution[]
  hourlyDistribution: HourlyDistribution[]
  monthlyGrowth: MonthlyGrowth
}

// Insights
export type InsightType = 'warning' | 'success' | 'info'
export type InsightCategory = 'engagement' | 'values' | 'departments' | 'users'
export type InsightPriority = 'high' | 'medium' | 'low'

export interface Insight {
  type: InsightType
  category: InsightCategory
  title: string
  description: string
  metric: number | null
  actionable: boolean
  priority: InsightPriority
}

// Recent activity
export interface RecentCompliment {
  id: string
  sender: {
    id: string
    name: string
    avatar: string | null
    department: string | null
  }
  receiver: {
    id: string
    name: string
    avatar: string | null
    department: string | null
  }
  companyValue: {
    id: number
    title: string
    iconName: string | null
    iconColor: string | null
  }
  coins: number
  message: string
  createdAt: string
  timeAgo: string
}

// Engagement metrics
export interface InactiveUser {
  userId: string
  name: string
  department: string | null
  lastActivity: string | null
}

export interface EngagementMetrics {
  participationRate: number
  averageComplimentsPerUser: number
  medianCoinsPerCompliment: number
  inactiveUsers: {
    count: number
    percentage: number
    list: InactiveUser[]
  }
}

// Metadata
export interface DashboardMetadata {
  generatedAt: string
  executionTime: number
  filters: {
    departmentId: string | null
    jobTitleId: string | null
  }
  companyInfo: {
    totalEmployees: number
    activeEmployees: number
    totalValues: number
    activeValues: number
  }
}

// Main dashboard response
export interface ComplimentsDashboard {
  period: DashboardPeriod
  overview: OverviewMetrics
  valuesDistribution: ValueDistribution[]
  topUsers: TopUsersMetrics
  departmentAnalytics: DepartmentAnalytics
  temporalPatterns: TemporalPatterns
  insights: Insight[]
  recentActivity: RecentCompliment[]
  engagementMetrics: EngagementMetrics
  metadata: DashboardMetadata
}

// Request filters
export interface DashboardFilters {
  startDate?: Date
  endDate?: Date
  departmentId?: string
  jobTitleId?: string
}

// Service method signatures
export interface ComplimentsDashboardServiceInterface {
  getCompleteDashboard(
    companyId: string,
    startDate: Date,
    endDate: Date,
    filters?: Omit<DashboardFilters, 'startDate' | 'endDate'>
  ): Promise<ComplimentsDashboard>
}

// Network Graph Types
export interface NetworkNode {
  id: string // userId (CUID)
  name: string
  avatar: string | null
  role: string
  department: string
  complimentsGiven: number
  complimentsReceived: number
}

export interface NetworkLink {
  source: string // userId (CUID)
  target: string // userId (CUID)
  value: number
  compliments: string[]
}

export interface NetworkGraphData {
  nodes: NetworkNode[]
  links: NetworkLink[]
}

export interface NetworkGraphFilters {
  startDate?: Date
  endDate?: Date
  department?: string
  minConnections?: number
  limit?: number
  userIds?: string[] // Filter by specific user IDs
}