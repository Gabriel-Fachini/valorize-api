/**
 * User Factory - Generates realistic Brazilian users
 */

import { faker } from '@faker-js/faker/locale/pt_BR'

export interface GeneratedUser {
  name: string
  email: string
  authUserId: string
  avatarUrl?: string
  departmentId?: string
  jobTitleId?: string
  isActive: boolean
}

export interface BulkUserGenerationConfig {
  // Total users to generate
  count: number
  // Email domain for company
  emailDomain: string
  // Company ID
  companyId: string
  // Departments to assign to (randomly)
  departmentIds: string[]
  // Job titles to assign to (randomly)
  jobTitleIds: string[]
  // Whether to generate avatars
  generateAvatars?: boolean
  // Activity distribution: 'uniform' | 'realistic' (Pareto)
  distribution?: 'uniform' | 'pareto'
}

export class UserFactory {
  /**
   * Generate a single realistic Brazilian user
   */
  static generateBrazilianUser(overrides?: Partial<GeneratedUser>): GeneratedUser {
    const name = faker.person.fullName()
    const email = faker.internet.email().toLowerCase()
    const avatarIndex = faker.number.int({ min: 1, max: 70 })

    return {
      name,
      email,
      authUserId: faker.string.uuid(),
      avatarUrl: `https://i.pravatar.cc/150?img=${avatarIndex}&u=${email}`,
      isActive: true,
      ...overrides,
    }
  }

  /**
   * Generate bulk users with realistic Brazilian names and distribution
   */
  static generateBulkUsers(config: BulkUserGenerationConfig): GeneratedUser[] {
    const users: GeneratedUser[] = []

    // Determine activity distribution
    const isPareto = config.distribution === 'pareto'
    const departmentCount = config.departmentIds.length
    const jobTitleCount = config.jobTitleIds.length

    for (let i = 0; i < config.count; i++) {
      const name = faker.person.fullName()
      // Use index in email to ensure uniqueness
      const baseEmail = name.toLowerCase().replace(/\s+/g, '.').replace(/[àáäâãèéëêìíïîòóöôõùúüûçñ]/g, c => {
        const chars: { [key: string]: string } = {
          à: 'a', á: 'a', ä: 'a', â: 'a', ã: 'a',
          è: 'e', é: 'e', ë: 'e', ê: 'e',
          ì: 'i', í: 'i', ï: 'i', î: 'i',
          ò: 'o', ó: 'o', ö: 'o', ô: 'o', õ: 'o',
          ù: 'u', ú: 'u', ü: 'u', û: 'u',
          ç: 'c', ñ: 'n',
        }
        return chars[c] || c
      })

      const email = `${baseEmail}.${i + 1}@${config.emailDomain}`.toLowerCase()

      // Generate authUserId in UUID format (Supabase Auth compatible)
      const authUserId = faker.string.uuid()

      // Random department and job title
      const departmentId = config.departmentIds[i % departmentCount]
      const jobTitleId = config.jobTitleIds[i % jobTitleCount]

      // Generate avatar URL using pravatar.cc with variety (70 images available)
      const avatarUrl = config.generateAvatars
        ? `https://i.pravatar.cc/150?img=${(i % 70) + 1}&u=${email}`
        : undefined

      users.push({
        name,
        email,
        authUserId,
        departmentId,
        jobTitleId,
        avatarUrl,
        isActive: true,
      })
    }

    return users
  }

  /**
   * Assign activity levels to users based on distribution
   * Returns map of userId -> activity multiplier
   */
  static generateActivityDistribution(users: GeneratedUser[]): Map<string, number> {
    const activityMap = new Map<string, number>()

    const powerUsersCount = Math.floor(users.length * 0.2)
    const inactiveUsersCount = Math.floor(users.length * 0.2)

    // Shuffle array for random distribution
    const shuffled = [...users].sort(() => Math.random() - 0.5)

    // Power users (20%): 4x activity
    for (let i = 0; i < powerUsersCount; i++) {
      activityMap.set(shuffled[i].authUserId, 4)
    }

    // Inactive users (20%): 0.2x activity
    for (let i = users.length - inactiveUsersCount; i < users.length; i++) {
      activityMap.set(shuffled[i].authUserId, 0.2)
    }

    // Normal users (60%): 1x activity (default)
    for (let i = powerUsersCount; i < users.length - inactiveUsersCount; i++) {
      activityMap.set(shuffled[i].authUserId, 1)
    }

    return activityMap
  }

  /**
   * Generate realistic email addresses for existing users
   */
  static generateEmailsForUsers(
    users: Array<{ name: string; id: string }>,
    domain: string
  ): Map<string, string> {
    const emailMap = new Map<string, string>()

    for (const user of users) {
      // Remove accents and special characters from name
      const baseEmail = user.name
        .toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[àáäâãèéëêìíïîòóöôõùúüûçñ]/g, c => {
          const chars: { [key: string]: string } = {
            à: 'a', á: 'a', ä: 'a', â: 'a', ã: 'a',
            è: 'e', é: 'e', ë: 'e', ê: 'e',
            ì: 'i', í: 'i', ï: 'i', î: 'i',
            ò: 'o', ó: 'o', ö: 'o', ô: 'o', õ: 'o',
            ù: 'u', ú: 'u', ü: 'u', û: 'u',
            ç: 'c', ñ: 'n',
          }
          return chars[c] || c
        })

      const email = `${baseEmail}@${domain}`
      emailMap.set(user.id, email)
    }

    return emailMap
  }
}
