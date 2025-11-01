/**
 * Admin Users Service
 * Handles CRUD operations and bulk actions for user management
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { NotFoundError, ConflictError, ValidationError } from '@/middleware/error-handler'
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
  const where: any = {
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

  if (search && search.trim()) {
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
    avatar: user.avatar || undefined,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: undefined, // TODO: add lastLogin field to User model if needed
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
    avatar: user.avatar || undefined,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: undefined, // TODO: add lastLogin field to User model if needed
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
    totalCoins: wallet?.redeemableBalance || 0,
    redeemptions,
  }
}

// ============================================================================
// CREATE USER
// ============================================================================

export async function createUser(
  companyId: string,
  input: CreateUserInput,
  auth0Id?: string,
): Promise<{
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: Date
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

  // Generate Auth0 ID if not provided
  const finalAuth0Id = auth0Id || `admin-created-${Date.now()}`

  // Create user
  const user = await prisma.user.create({
    data: {
      auth0Id: finalAuth0Id,
      email: normalizedEmail,
      name: name.trim(),
      companyId,
      departmentId: departmentId || null,
      jobTitleId: jobTitleId || null,
      isActive: true,
    },
  })

  logger.info(`User created in admin panel: ${user.id} (${user.email})`)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    createdAt: user.createdAt,
  }
}

// ============================================================================
// UPDATE USER
// ============================================================================

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
  const updateData: any = {}

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
    avatar: user.avatar || undefined,
    isActive: user.isActive,
    createdAt: user.createdAt,
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
  bulkActivate,
  bulkDeactivate,
  getUsersForExport,
  isValidEmail,
}
