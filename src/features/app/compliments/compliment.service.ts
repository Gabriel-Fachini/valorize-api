import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { User } from '../users/user.model'
import { WalletModel } from '../wallets/wallet.model'
import { ComplimentModel } from './compliment.model'
import { SendComplimentInput } from './compliment.schemas'
import { FeedCompliment } from './compliment.types'

/**
 * Helper function to format a date into a human-readable "time ago" string
 */
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`
  if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`
  if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`
  return 'agora mesmo'
}

export const complimentService = {
  async sendCompliment(senderId: string, data: SendComplimentInput) {
    const { receiverId, valueId, message, coins } = data

    if (senderId === receiverId) {
      throw new Error('You cannot send a compliment to yourself.')
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ])

    if (!sender || !receiver) {
      throw new Error('Sender or receiver not found.')
    }

    if (sender.companyId !== receiver.companyId) {
      throw new Error('Sender and receiver must belong to the same company.')
    }

    // Verify if sender has enough coins
    const senderWallet = await WalletModel.getOrCreateByUserId(sender.id)
    if (senderWallet.complimentBalance < coins) {
      throw new Error('Insufficient compliment balance.')
    }

    return prisma.$transaction(async tx => {
      const companyValue = await tx.companyValue.findFirst({
        where: { id: valueId, companyId: sender.companyId, isActive: true },
      })

      if (!companyValue) {
        throw new Error('Company value not found or is not active.')
      }

      await WalletModel.debitComplimentBalance(
        sender.id, 
        coins, 
        tx,
        `Compliment sent to ${receiver.name}`,
        { 
          receiverId: receiver.id, 
          receiverName: receiver.name,
          valueId,
          message: message.substring(0, 100), // First 100 chars of message
        },
      )
      
      await WalletModel.creditRedeemableBalance(
        receiver.id, 
        coins, 
        tx,
        `Compliment received from ${sender.name}`,
        { 
          senderId: sender.id,
          senderName: sender.name,
          valueId,
          message: message.substring(0, 100), // First 100 chars of message
        },
      )

      const compliment = await ComplimentModel.create(
        {
          senderId: sender.id,
          receiverId: receiver.id,
          companyId: sender.companyId,
          valueId,
          message,
          coins,
        },
        tx,
      )

      logger.info(
        `Compliment sent from ${sender.id} to ${receiver.id} for ${coins} coins.`,
      )

      return compliment
    })
  },

  async listReceivableUsers(currentUserId: string) {
    const currentUser = await User.findById(currentUserId)
    if (!currentUser) {
      throw new Error('Current user not found.')
    }

    const users = await prisma.user.findMany({
      where: {
        companyId: currentUser.companyId,
        id: {
          not: currentUserId,
        },
        isActive: true,
      },
      select: {
        id: true,
        avatar: true,
        name: true,
        email: true,
      },
    })

    return users
  },

  async getComplimentHistory(
    currentUserId: string,
    type: 'sent' | 'received',
    page: number = 1,
    limit: number = 20,
  ) {
    const currentUser = await User.findById(currentUserId)
    if (!currentUser) {
      throw new Error('Current user not found.')
    }

    const skip = (page - 1) * limit

    const whereClause = type === 'sent' 
      ? { senderId: currentUserId }
      : { receiverId: currentUserId }

    const [compliments, totalCount] = await Promise.all([
      prisma.compliment.findMany({
        where: whereClause,
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
              iconName: true,
              iconColor: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.compliment.count({
        where: whereClause,
      }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      compliments,
      metainfo: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }
  },

  async getFeed(companyId: string): Promise<FeedCompliment[]> {
    const compliments = await prisma.compliment.findMany({
      where: {
        companyId,
        isPublic: true,
      },
      include: {
        sender: {
          include: {
            department: true,
          },
        },
        receiver: {
          include: {
            department: true,
          },
        },
        companyValue: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    return compliments.map(c => ({
      id: c.id,
      sender: {
        id: c.sender.id,
        name: c.sender.name,
        avatar: c.sender.avatar,
        department: c.sender.department?.name || null,
      },
      receiver: {
        id: c.receiver.id,
        name: c.receiver.name,
        avatar: c.receiver.avatar,
        department: c.receiver.department?.name || null,
      },
      companyValue: {
        id: c.companyValue.id,
        title: c.companyValue.title,
        iconName: c.companyValue.iconName,
        iconColor: c.companyValue.iconColor,
      },
      coins: c.coins,
      message: c.message,
      createdAt: c.createdAt.toISOString(),
      timeAgo: getTimeAgo(c.createdAt),
    }))
  },
}
