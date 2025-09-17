import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { User } from '../users/user.model'
import { WalletModel } from '../wallets/wallet.model'
import { ComplimentModel } from './compliment.model'
import { SendComplimentInput } from './compliment.schemas'

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

    // Check if company has at least 2 active values configured
    const activeValuesCount = await prisma.companyValue.count({
      where: { companyId: sender.companyId, isActive: true },
    })

    if (activeValuesCount < 2) {
      throw new Error('Company must have at least 2 active values configured to enable compliments.')
    }

    return prisma.$transaction(async tx => {
      const senderWallet = await WalletModel.getOrCreateByUserId(sender.id, tx)

      if (senderWallet.complimentBalance < coins) {
        throw new Error('Insufficient compliment balance.')
      }

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
        name: true,
        email: true,
      },
    })

    return users
  },
}
