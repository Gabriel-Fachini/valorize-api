/**
 * Admin Users Service
 * Handles CRUD operations and bulk actions for user management
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { NotFoundError, ConflictError, ValidationError } from '@/middleware/error-handler'
import { authService } from '@/features/app/auth/auth.service'
import { validateEmailDomain } from '@/lib/utils/domain-validation'
import type {
  UserListItem,
  UserDetailResponse,
  UserStatistics,
  PaginatedResponse,
  CreateUserInput,
  UpdateUserInput,
  ListUsersFilters,
} from './types'

// ============================================================================
// USER LISTING & SEARCH
// ============================================================================

type WhereClause = {
  companyId: string
  isActive?: boolean
  departmentId?: string | null
  OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { email: { contains: string; mode: 'insensitive' } }>
}

export async function listUsers(
  companyId: string,
  filters: ListUsersFilters = {},
): Promise<PaginatedResponse<UserListItem>> {
  const {
    page = 1,
    limit = 20,
    search = '',
    status,
    departmentId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters

  if (page < 1 || limit < 1 || limit > 100) {
    throw new ValidationError('Invalid pagination parameters')
  }

  // Build where clause
  const where: WhereClause = {
    companyId,
  }

  if (status === 'active') {
    where.isActive = true
  } else if (status === 'inactive') {
    where.isActive = false
  }

  if (departmentId) {
    where.departmentId = departmentId
  }

  if (search?.trim()) {
    where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }]
  }

  // Calculate skip and take
  const skip = (page - 1) * limit

  // Execute query
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        welcomeEmailSendCount: true,
        lastWelcomeEmailSentAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        jobTitle: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.user.count({ where }),
  ])

  const pageCount = Math.ceil(totalCount / limit)

  const data: UserListItem[] = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department ? { id: user.department.id, name: user.department.name } : undefined,
    position: user.jobTitle ? { id: user.jobTitle.id, name: user.jobTitle.name } : undefined,
    avatar: user.avatar ?? undefined,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: undefined, // TODO: add lastLogin field to User model if needed
    welcomeEmailSendCount: user.welcomeEmailSendCount,
    lastWelcomeEmailSentAt: user.lastWelcomeEmailSentAt ?? undefined,
  }))

  return {
    data,
    totalCount,
    pageCount,
    currentPage: page,
  }
}

// ============================================================================
// USER DETAILS WITH STATISTICS
// ============================================================================

export async function getUserById(companyId: string, userId: string): Promise<UserDetailResponse> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
    },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      jobTitle: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  const statistics = await getUserStatistics(userId)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department ? { id: user.department.id, name: user.department.name } : undefined,
    position: user.jobTitle ? { id: user.jobTitle.id, name: user.jobTitle.name } : undefined,
    avatar: user.avatar ?? undefined,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: undefined, // TODO: add lastLogin field to User model if needed
    welcomeEmailSendCount: user.welcomeEmailSendCount,
    lastWelcomeEmailSentAt: user.lastWelcomeEmailSentAt ?? undefined,
    statistics,
  }
}

// ============================================================================
// USER STATISTICS
// ============================================================================

export async function getUserStatistics(userId: string): Promise<UserStatistics> {
  const [complimentsSent, complimentsReceived, redeemptions] = await Promise.all([
    // Count compliments sent
    prisma.compliment.count({
      where: {
        senderId: userId,
      },
    }),
    // Count compliments received
    prisma.compliment.count({
      where: {
        receiverId: userId,
      },
    }),
    // Count redeemptions (if model exists)
    prisma.redemption
      .count({
        where: {
          userId,
        },
      })
      .catch(() => 0), // Handle if model doesn't exist
  ])

  // Get wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: {
      userId,
    },
    select: {
      redeemableBalance: true,
    },
  })

  return {
    complimentsSent,
    complimentsReceived,
    totalCoins: wallet?.redeemableBalance ?? 0,
    redeemptions,
  }
}

// ============================================================================
// CREATE USER
// ============================================================================

export async function createUser(
  companyId: string,
  input: CreateUserInput,
  authUserId?: string,
): Promise<{
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: Date
  temporaryPasswordUrl?: string
}> {
  const { name, email, departmentId, jobTitleId } = input

  // Validate inputs
  if (!name || name.trim().length < 2) {
    throw new ValidationError('Name must be at least 2 characters long')
  }

  if (!email || !isValidEmail(email)) {
    throw new ValidationError('Invalid email format')
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Validate email domain
  await validateEmailDomain(companyId, normalizedEmail)

  // Check if email already exists in company
  const existingUser = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      companyId,
    },
  })

  if (existingUser) {
    throw new ConflictError('Email already exists in this company')
  }

  // Validate department if provided
  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId,
      },
    })
    if (!dept) {
      throw new ValidationError('Invalid department')
    }
  }

  // Validate job title if provided
  if (jobTitleId) {
    const jobTitle = await prisma.jobTitle.findFirst({
      where: {
        id: jobTitleId,
        companyId,
      },
    })
    if (!jobTitle) {
      throw new ValidationError('Invalid job title')
    }
  }

  // Do NOT create user in Supabase Auth during user creation
  // User will be created in Supabase when welcome email is sent
  // This allows users to be created without immediately inviting them
  const finalAuthUserId = authUserId ?? null

  logger.info('Creating user in database only (Supabase Auth will be created on email send)', {
    email: normalizedEmail,
    hasAuthUserId: !!authUserId,
  })

  // Create user in local database with welcome email tracking
  const user = await prisma.user.create({
    data: {
      authUserId: finalAuthUserId,
      email: normalizedEmail,
      name: name.trim(),
      companyId,
      departmentId: departmentId ?? null,
      jobTitleId: jobTitleId ?? null,
      isActive: true,
      // Welcome email tracking fields - email will be sent later
      welcomeEmailSentAt: null,
      lastWelcomeEmailSentAt: null,
      welcomeEmailSendCount: 0,
    },
  })

  logger.info(`User created in admin panel: ${user.id} (${user.email})`, {
    authUserId: finalAuthUserId,
    note: 'User created in DB only, email will be sent separately',
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    createdAt: user.createdAt,
  }
}

export async function updateUser(
  companyId: string,
  userId: string,
  input: UpdateUserInput,
): Promise<{
  id: string
  name: string
  email: string
  isActive: boolean
  updatedAt: Date
}> {
  // Check if user exists
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
    },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  const { name, email, departmentId, jobTitleId, isActive } = input

  // Prepare update data
  type UpdateData = {
    name?: string
    email?: string
    departmentId?: string | null
    jobTitleId?: string | null
    isActive?: boolean
  }
  const updateData: UpdateData = {}

  if (name !== undefined) {
    if (name.trim().length < 2) {
      throw new ValidationError('Name must be at least 2 characters long')
    }
    updateData.name = name.trim()
  }

  if (email !== undefined) {
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format')
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if new email already exists (excluding current user)
    if (normalizedEmail !== user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          companyId,
          id: {
            not: userId,
          },
        },
      })

      if (existingUser) {
        throw new ConflictError('Email already exists in this company')
      }
    }

    updateData.email = normalizedEmail
  }

  if (departmentId !== undefined) {
    if (departmentId !== null) {
      const dept = await prisma.department.findFirst({
        where: {
          id: departmentId,
          companyId,
        },
      })
      if (!dept) {
        throw new ValidationError('Invalid department')
      }
    }
    updateData.departmentId = departmentId
  }

  if (jobTitleId !== undefined) {
    if (jobTitleId !== null) {
      const jobTitle = await prisma.jobTitle.findFirst({
        where: {
          id: jobTitleId,
          companyId,
        },
      })
      if (!jobTitle) {
        throw new ValidationError('Invalid job title')
      }
    }
    updateData.jobTitleId = jobTitleId
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive
  }

  // Perform update
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: updateData,
  })

  logger.info(`User updated in admin panel: ${userId}`)

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    isActive: updatedUser.isActive,
    updatedAt: updatedUser.updatedAt,
  }
}

// ============================================================================
// DEACTIVATE USER (SOFT DELETE)
// ============================================================================

export async function deactivateUser(companyId: string, userId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
    },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isActive: false,
    },
  })

  logger.info(`User deactivated in admin panel: ${userId}`)
}

// ============================================================================
// RESET PASSWORD
// ============================================================================

export async function resetUserPassword(
  companyId: string,
  userId: string,
): Promise<{
  message: string
  ticketUrl: string
  expiresIn: string
}> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
    },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  if (!user.authUserId) {
    logger.error('User has no authUserId', {
      userId,
      email: user.email,
    })
    throw new ValidationError('User does not have a valid Supabase Auth ID. Cannot reset password.')
  }

  try {
    logger.info('Attempting to reset password for user', {
      userId,
      email: user.email,
      authUserId: user.authUserId,
    })

    const result = await authService.resetUserPassword(user.authUserId)

    logger.info('Password reset ticket generated for user', {
      userId,
      email: user.email,
      ticketUrl: result.ticket_url ? result.ticket_url.substring(0, 50) + '...' : 'NO URL',
    })

    return {
      message: 'Password reset link has been sent. User will have 24 hours to reset their password.',
      ticketUrl: result.ticket_url,
      expiresIn: '24 hours',
    }
  } catch (error) {
    logger.error('Failed to reset user password', {
      userId,
      email: user.email,
      authUserId: user.authUserId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

export async function bulkActivate(companyId: string, userIds: string[]): Promise<{ updated: number }> {
  if (!userIds || userIds.length === 0) {
    throw new ValidationError('No user IDs provided')
  }

  if (userIds.length > 100) {
    throw new ValidationError('Maximum 100 users per operation')
  }

  const result = await prisma.user.updateMany({
    where: {
      id: {
        in: userIds,
      },
      companyId,
    },
    data: {
      isActive: true,
    },
  })

  logger.info(`Bulk activated ${result.count} users`)

  return { updated: result.count }
}

export async function bulkDeactivate(companyId: string, userIds: string[]): Promise<{ updated: number }> {
  if (!userIds || userIds.length === 0) {
    throw new ValidationError('No user IDs provided')
  }

  if (userIds.length > 100) {
    throw new ValidationError('Maximum 100 users per operation')
  }

  const result = await prisma.user.updateMany({
    where: {
      id: {
        in: userIds,
      },
      companyId,
    },
    data: {
      isActive: false,
    },
  })

  logger.info(`Bulk deactivated ${result.count} users`)

  return { updated: result.count }
}

// ============================================================================
// EXPORT USERS
// ============================================================================

export async function getUsersForExport(companyId: string, userIds: string[]): Promise<UserListItem[]> {
  if (!userIds || userIds.length === 0) {
    throw new ValidationError('No user IDs provided')
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
      companyId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      welcomeEmailSendCount: true,
      lastWelcomeEmailSentAt: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      jobTitle: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department ? { id: user.department.id, name: user.department.name } : undefined,
    position: user.jobTitle ? { id: user.jobTitle.id, name: user.jobTitle.name } : undefined,
    avatar: user.avatar ?? undefined,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: undefined,
    welcomeEmailSendCount: user.welcomeEmailSendCount,
    lastWelcomeEmailSentAt: user.lastWelcomeEmailSentAt ?? undefined,
  }))
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// TODO: Implement domain validation if needed
// export async function validateDomainAllowed(email: string, companyId: string): Promise<boolean> {
//   const domain = email.split('@')[1]
//   // Check against allowed domains for company
//   // return !!allowedDomain
// }

// Export as service object
export const usersService = {
  listUsers,
  getUserById,
  getUserStatistics,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword,
  bulkActivate,
  bulkDeactivate,
  getUsersForExport,
  isValidEmail,
}
