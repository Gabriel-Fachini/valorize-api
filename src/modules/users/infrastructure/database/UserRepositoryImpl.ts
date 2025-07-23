import { User } from '../../domain/entities/User'
import { UserRepository } from '../../domain/repositories/UserRepository'
import { BaseRepository } from '@shared/infrastructure/database/BaseRepository'

// This is an example implementation - you'll need to create the User model in your Prisma schema first
// Example Prisma model:
// model User {
//   id        String   @id @default(cuid())
//   auth0Id   String   @unique @map("auth0_id")
//   email     String   @unique
//   name      String
//   isActive  Boolean  @default(true) @map("is_active")
//   createdAt DateTime @default(now()) @map("created_at")
//   updatedAt DateTime @updatedAt @map("updated_at")
//
//   @@map("users")
// }

export class UserRepositoryImpl extends BaseRepository implements UserRepository {
  
  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      })
      
      return user ? this.toDomainEntity(user) : null
    } catch (error) {
      throw new Error(`Failed to find user by id: ${error}`)
    }
  }

  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { auth0Id }
      })
      
      return user ? this.toDomainEntity(user) : null
    } catch (error) {
      throw new Error(`Failed to find user by auth0Id: ${error}`)
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })
      
      return user ? this.toDomainEntity(user) : null
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error}`)
    }
  }

  async save(user: User): Promise<User> {
    try {
      const userData = {
        auth0Id: user.auth0Id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        updatedAt: new Date()
      }

      const savedUser = await this.prisma.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          ...userData,
          createdAt: user.createdAt
        },
        update: userData
      })

      return this.toDomainEntity(savedUser)
    } catch (error) {
      throw new Error(`Failed to save user: ${error}`)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id }
      })
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`)
    }
  }

  async findAll(limit = 50, offset = 0): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      })

      return users.map(user => this.toDomainEntity(user))
    } catch (error) {
      throw new Error(`Failed to find all users: ${error}`)
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { email: email.toLowerCase() }
      })
      return count > 0
    } catch (error) {
      throw new Error(`Failed to check if user exists by email: ${error}`)
    }
  }

  async existsByAuth0Id(auth0Id: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { auth0Id }
      })
      return count > 0
    } catch (error) {
      throw new Error(`Failed to check if user exists by auth0Id: ${error}`)
    }
  }

  private toDomainEntity(prismaUser: any): User {
    return User.create({
      id: prismaUser.id,
      auth0Id: prismaUser.auth0Id,
      email: prismaUser.email,
      name: prismaUser.name,
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt
    })
  }
} 