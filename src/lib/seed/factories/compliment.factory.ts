/**
 * Compliment Factory - Generates realistic compliments with Pareto distribution
 * Creates compliments that follow realistic patterns:
 * - 80/20 rule: 20% of users send 80% of compliments
 * - Weekly patterns: More on Fridays, less on Mondays
 * - Temporal spread: More recent activity
 */

import { faker } from '@faker-js/faker/locale/pt_BR'

export interface GeneratedCompliment {
  senderAuthUserId: string
  receiverAuthUserId: string
  message: string
  coins: number
  valueIndex: number
  isPublic: boolean
  daysAgo?: number
}

// Compliment message templates that feel natural and professional
const COMPLIMENT_TEMPLATES = [
  'Parabéns pela entrega excelente de {action}! Você realmente se destacou.',
  'Muito obrigado por {action}! Sua dedicação é inspiradora.',
  'Adorei como você {action}. Isso mostra grande profissionalismo.',
  'Sua {attribute} ao {action} fez toda a diferença para o time.',
  'Que profissional incrível! Obrigado por {action} com tanta qualidade.',
  'Muito impressionado com sua {attribute} ao lidar com {situation}.',
  'Você é um exemplo de {value} na nossa empresa. Obrigado por {action}!',
  'Excelente trabalho em {action}. Você merece todos os parabéns!',
  'Sua atitude {positive_trait} durante {action} foi exemplar.',
  'Obrigado por sempre trazer {quality} para o time.',
  'Que privilégio trabalhar com alguém tão {positive_trait} como você!',
  'Ficou evidente sua {attribute} quando {action}. Muito bom!',
  'Seu {positive_trait} é contagiante! Obrigado por {action}.',
  'Você tem um {attribute} impressionante para {action}.',
  'Agradeço profundamente sua {attribute} em {action}.',
]

const ACTIONS = [
  'resolver esse problema',
  'ajudar o cliente',
  'entregar no prazo',
  'colaborar com o time',
  'tomar a iniciativa',
  'mentorar colegas',
  'apresentar a ideia',
  'coordenar a reunião',
  'revisar o código',
  'documentar tudo',
  'lidar com a crise',
  'simplificar o processo',
  'inovar a solução',
  'acolher o novo membro',
]

const ATTRIBUTES = [
  'comprometimento',
  'criatividade',
  'organização',
  'liderança',
  'empatia',
  'profissionalismo',
  'atenção aos detalhes',
  'comunicação clara',
  'flexibilidade',
  'resiliência',
  'proatividade',
  'humildade',
]

const POSITIVE_TRAITS = [
  'atitude positiva',
  'disposição',
  'energia',
  'inteligência',
  'generosidade',
  'confiabilidade',
  'autenticidade',
  'sinceridade',
]

const QUALITIES = [
  'excelência',
  'inovação',
  'colaboração',
  'transparência',
  'qualidade',
  'dedicação',
  'criatividade',
  'integridade',
]

const SITUATIONS = [
  'decisões difíceis',
  'feedback crítico',
  'prazos apertados',
  'mudanças rápidas',
  'conflitos',
  'desafios técnicos',
]

const VALUES = [
  'inovação',
  'colaboração',
  'excelência',
  'integridade',
  'respeito',
  'sustentabilidade',
]

export class ComplimentFactory {
  /**
   * Generate a single realistic compliment message
   */
  static generateComplimentMessage(): string {
    const template = faker.helpers.arrayElement(COMPLIMENT_TEMPLATES)
    let message = template

    // Replace placeholders with random values
    message = message.replace('{action}', faker.helpers.arrayElement(ACTIONS))
    message = message.replace('{attribute}', faker.helpers.arrayElement(ATTRIBUTES))
    message = message.replace('{positive_trait}', faker.helpers.arrayElement(POSITIVE_TRAITS))
    message = message.replace('{quality}', faker.helpers.arrayElement(QUALITIES))
    message = message.replace('{situation}', faker.helpers.arrayElement(SITUATIONS))
    message = message.replace('{value}', faker.helpers.arrayElement(VALUES))

    return message
  }

  /**
   * Generate random coin amount (multiples of 5, between 5 and 35)
   * Adjusted for realistic economy: allows Pareto distribution without excessive skipping
   * Average: ~20 coins per compliment (vs 50-75 in hardcoded data)
   */
  static generateCoinAmount(): number {
    const multiples = [5, 10, 15, 20, 25, 30, 35]
    // Weight heavily towards lower-mid amounts
    if (Math.random() < 0.7) {
      return faker.helpers.arrayElement(multiples.slice(0, 4)) // 5, 10, 15, 20
    }
    return faker.helpers.arrayElement(multiples) // 5-35
  }

  /**
   * Calculate days ago with recent activity weighted (Pareto pattern)
   * 60% of activity in last 30 days
   */
  static generateCreationDate(totalDaysBack: number = 90): number {
    const now = new Date()
    const recentThreshold = 30 // days

    if (Math.random() < 0.6) {
      // 60% of compliments in last 30 days
      return Math.floor(Math.random() * recentThreshold)
    } else {
      // 40% spread over previous 60 days
      return Math.floor(Math.random() * (totalDaysBack - recentThreshold) + recentThreshold)
    }
  }

  /**
   * Apply day-of-week weighting (more Friday, less Monday)
   * Returns adjusted daysAgo to land on preferred day
   */
  static applyDayOfWeekWeighting(daysAgo: number): number {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - daysAgo)

    // Day weighting: 0=Monday, 1=Tuesday, ..., 6=Sunday
    const dayWeights = [0.8, 0.9, 1.0, 1.1, 1.3, 0.5, 0.4] // Friday(4)=1.3, Monday(0)=0.8
    const currentDay = targetDate.getDay()
    const currentWeight = dayWeights[currentDay] || 1.0

    // If weight is low, find nearest high-weight day
    if (Math.random() > currentWeight) {
      // Find next Friday (day 5)
      let daysToFriday = (5 - currentDay + 7) % 7
      if (daysToFriday === 0) daysToFriday = 7
      return daysAgo + daysToFriday
    }

    return daysAgo
  }

  /**
   * Generate bulk compliments with Pareto distribution
   */
  static generateBulkCompliments(
    users: Array<{ authUserId: string; id: string }>,
    valueIds: string[],
    targetCount: number,
    activityDistribution?: Map<string, number>,
  ): GeneratedCompliment[] {
    const compliments: GeneratedCompliment[] = []

    if (users.length < 2) return compliments

    // Build activity quotas per user based on distribution
    const quotasMap = new Map<string, number>()
    let totalQuota = 0

    for (const user of users) {
      const multiplier = activityDistribution?.get(user.authUserId) ?? 1
      const quota = multiplier
      quotasMap.set(user.authUserId, quota)
      totalQuota += quota
    }

    // Normalize quotas to match target count
    for (const [userId, quota] of quotasMap) {
      const normalizedQuota = Math.round((quota / totalQuota) * targetCount)
      quotasMap.set(userId, normalizedQuota)
    }

    // Generate compliments respecting quotas
    for (const sender of users) {
      const senderQuota = quotasMap.get(sender.authUserId) || 0

      for (let i = 0; i < senderQuota; i++) {
        // Pick random receiver (exclude self)
        let receiver = faker.helpers.arrayElement(users)
        let attempts = 0
        while (receiver.authUserId === sender.authUserId && attempts < 5) {
          receiver = faker.helpers.arrayElement(users)
          attempts++
        }

        if (receiver.authUserId === sender.authUserId) continue

        const daysAgo = this.generateCreationDate()
        const adjustedDaysAgo = this.applyDayOfWeekWeighting(daysAgo)

        compliments.push({
          senderAuthUserId: sender.authUserId,
          receiverAuthUserId: receiver.authUserId,
          message: this.generateComplimentMessage(),
          coins: this.generateCoinAmount(),
          valueIndex: Math.floor(Math.random() * valueIds.length),
          isPublic: Math.random() < 0.85, // 85% public
          daysAgo: adjustedDaysAgo,
        })
      }
    }

    // Shuffle to randomize order
    return compliments.sort(() => Math.random() - 0.5)
  }

  /**
   * Generate compliments between specific users (e.g., to Gabriel)
   */
  static generateComplimentsForTarget(
    senders: Array<{ authUserId: string }>,
    targetAuthUserId: string,
    countPerSender: number,
    valueIds: string[],
  ): GeneratedCompliment[] {
    const compliments: GeneratedCompliment[] = []

    for (const sender of senders) {
      for (let i = 0; i < countPerSender; i++) {
        const daysAgo = this.generateCreationDate()
        const adjustedDaysAgo = this.applyDayOfWeekWeighting(daysAgo)

        compliments.push({
          senderAuthUserId: sender.authUserId,
          receiverAuthUserId: targetAuthUserId,
          message: this.generateComplimentMessage(),
          coins: this.generateCoinAmount(),
          valueIndex: Math.floor(Math.random() * valueIds.length),
          isPublic: Math.random() < 0.85,
          daysAgo: adjustedDaysAgo,
        })
      }
    }

    return compliments
  }
}
