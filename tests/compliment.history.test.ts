import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database and dependencies
vi.mock('../src/lib/database', () => ({
  prisma: {
    compliment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('../src/features/users/user.model', () => ({
  User: {
    findById: vi.fn(),
  },
}))

import { complimentService } from '../src/features/compliments/compliment.service'
import { prisma } from '../src/lib/database'
import { User } from '../src/features/users/user.model'

describe('complimentService.getComplimentHistory', () => {
  const mockUserId = 'user-123'
  const mockUser = {
    id: mockUserId,
    companyId: 'company-123',
    name: 'Test User',
    email: 'test@example.com',
  }

  const mockCompliments = [
    {
      id: 'compliment-1',
      senderId: 'sender-1',
      receiverId: 'receiver-1',
      message: 'Great job!',
      coins: 10,
      createdAt: new Date('2024-01-01'),
      sender: {
        id: 'sender-1',
        name: 'Sender User',
        email: 'sender@example.com',
        avatar: null,
      },
      receiver: {
        id: 'receiver-1',
        name: 'Receiver User',
        email: 'receiver@example.com',
        avatar: null,
      },
      companyValue: {
        id: 1,
        title: 'Teamwork',
        description: 'Working well with others',
        icon: 'team-icon',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return sent compliments history with pagination', async () => {
    ;(User.findById as any).mockResolvedValueOnce(mockUser)
    ;(prisma.compliment.findMany as any).mockResolvedValueOnce(mockCompliments)
    ;(prisma.compliment.count as any).mockResolvedValueOnce(25)

    const result = await complimentService.getComplimentHistory(
      mockUserId,
      'sent',
      1,
      20
    )

    expect(User.findById).toHaveBeenCalledWith(mockUserId)
    expect(prisma.compliment.findMany).toHaveBeenCalledWith({
      where: { senderId: mockUserId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        companyValue: {
          select: {
            id: true,
            title: true,
            description: true,
            icon: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: 0,
      take: 20,
    })
    expect(prisma.compliment.count).toHaveBeenCalledWith({
      where: { senderId: mockUserId },
    })

    expect(result).toEqual({
      compliments: mockCompliments,
      metainfo: {
        currentPage: 1,
        totalPages: 2,
        totalCount: 25,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    })
  })

  it('should return received compliments history with pagination', async () => {
    ;(User.findById as any).mockResolvedValueOnce(mockUser)
    ;(prisma.compliment.findMany as any).mockResolvedValueOnce(mockCompliments)
    ;(prisma.compliment.count as any).mockResolvedValueOnce(10)

    const result = await complimentService.getComplimentHistory(
      mockUserId,
      'received',
      2,
      5
    )

    expect(prisma.compliment.findMany).toHaveBeenCalledWith({
      where: { receiverId: mockUserId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        companyValue: {
          select: {
            id: true,
            title: true,
            description: true,
            icon: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: 5,
      take: 5,
    })
    expect(prisma.compliment.count).toHaveBeenCalledWith({
      where: { receiverId: mockUserId },
    })

    expect(result).toEqual({
      compliments: mockCompliments,
      metainfo: {
        currentPage: 2,
        totalPages: 2,
        totalCount: 10,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    })
  })

  it('should throw error when user is not found', async () => {
    ;(User.findById as any).mockResolvedValueOnce(null)

    await expect(
      complimentService.getComplimentHistory(mockUserId, 'sent', 1, 20)
    ).rejects.toThrow('Current user not found.')
  })

  it('should handle default pagination values', async () => {
    ;(User.findById as any).mockResolvedValueOnce(mockUser)
    ;(prisma.compliment.findMany as any).mockResolvedValueOnce([])
    ;(prisma.compliment.count as any).mockResolvedValueOnce(0)

    await complimentService.getComplimentHistory(mockUserId, 'sent')

    expect(prisma.compliment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
      })
    )
  })
})