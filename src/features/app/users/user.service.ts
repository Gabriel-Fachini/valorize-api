import { User } from './user.model'
import { AuthenticatedUser } from '@/middleware/auth'
import { logger } from '@/lib/logger'

export interface SignUpResult {
  user: User
  isNewUser: boolean
}

export interface LoginResult {
  user: User
  lastLoginAt: Date
}

export const userService = {
  async signUp(auth0User: AuthenticatedUser): Promise<SignUpResult> {
    try {
      // Check if user already exists
      const existingUser = await User.findByAuthUserId(auth0User.sub)
      
      if (existingUser) {
        logger.info('User already exists, returning existing user', {
          userId: existingUser.id,
          authUserId: auth0User.sub,
        })

        return {
          user: existingUser,
          isNewUser: false,
        }
      }

      // Validate required Auth0 user data
      if (!auth0User.email) {
        throw new Error('Email is required from Supabase Auth user data')
      }

      if (!auth0User.name && !auth0User.email) {
        throw new Error('Name or email is required from Supabase Auth user data')
      }

      // Create new user
      const newUser = User.create({
        authUserId: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name ?? auth0User.email.split('@')[0], // Fallback to email prefix if name not provided
        companyId: 'default_company',
        isActive: true,
      })

      const savedUser = await newUser.save()

      logger.info('New user created successfully', {
        userId: savedUser.id,
        authUserId: savedUser.authUserId,
        email: savedUser.email,
      })

      return {
        user: savedUser,
        isNewUser: true,
      }

    } catch (error) {
      logger.error('Error during user signup', {
        authUserId: auth0User.sub,
        email: auth0User.email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  async login(auth0User: AuthenticatedUser): Promise<LoginResult> {
    try {
      // Find user by Supabase Auth ID
      const user = await User.findByAuthUserId(auth0User.sub)

      if (!user) {
        logger.warn('User not found during login, this might indicate they need to sign up first', {
          authUserId: auth0User.sub,
          email: auth0User.email,
        })
        throw new Error('User not found. Please sign up first.')
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn('Inactive user attempted to login', {
          userId: user.id,
          authUserId: auth0User.sub,
        })
        throw new Error('User account is deactivated. Please contact support.')
      }

      // Update user profile if Auth0 data has changed
      let hasChanges = false
      
      if (auth0User.email && user.email !== auth0User.email.toLowerCase()) {
        logger.info('User email updated from Supabase Auth', {
          userId: user.id,
          oldEmail: user.email,
          newEmail: auth0User.email,
        })
        // Note: For email changes, we might want to create a separate method
        // For now, we'll just log it as this requires more complex business logic
      }

      if (auth0User.name && user.name !== auth0User.name) {
        logger.info('User name updated from Supabase Auth', {
          userId: user.id,
          oldName: user.name,
          newName: auth0User.name,
        })
        user.updateName(auth0User.name)
        hasChanges = true
      }

      // Save changes if any
      let updatedUser = user
      if (hasChanges) {
        updatedUser = await user.save()
      }

      logger.info('User login successful', {
        userId: updatedUser.id,
        authUserId: auth0User.sub,
        email: updatedUser.email,
      })

      return {
        user: updatedUser,
        lastLoginAt: new Date(),
      }

    } catch (error) {
      logger.error('Error during user login', {
        authUserId: auth0User.sub,
        email: auth0User.email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  async getUserProfile(authUserId: string): Promise<User | null> {
    try {
      const user = await User.findByAuthUserId(authUserId)
      
      if (user && !user.isActive) {
        logger.warn('Inactive user profile requested', {
          userId: user.id,
          authUserId,
        })
        return null
      }

      return user
    } catch (error) {
      logger.error('Error fetching user profile', {
        authUserId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  async updateUserProfile(authUserId: string, updates: { name?: string; avatar?: string }): Promise<User> {
    try {
      const user = await User.findByAuthUserId(authUserId)
      
      if (!user) {
        throw new Error('User not found')
      }

      if (!user.isActive) {
        throw new Error('Cannot update inactive user profile')
      }

      if (updates.name) {
        user.updateName(updates.name)
      }

      if (updates.avatar !== undefined) {
        user.updateAvatar(updates.avatar)
      }

      const updatedUser = await user.save()

      logger.info('User profile updated successfully', {
        userId: updatedUser.id,
        authUserId,
        updates,
      })

      return updatedUser
    } catch (error) {
      logger.error('Error updating user profile', {
        authUserId,
        updates,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },

  async deactivateUser(authUserId: string): Promise<void> {
    try {
      const user = await User.findByAuthUserId(authUserId)
      
      if (!user) {
        throw new Error('User not found')
      }

      user.deactivate()
      await user.save()

      logger.info('User deactivated successfully', {
        userId: user.id,
        authUserId,
      })
    } catch (error) {
      logger.error('Error deactivating user', {
        authUserId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },
}
