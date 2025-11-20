/**
 * Compliment seed data - Expanded for realistic economy dashboard metrics
 * Generated to support ~3,200 compliments over 90 days (~200k coins total)
 */

export interface ComplimentData {
  senderAuthUserId: string
  receiverAuthUserId: string
  companyId: string
  valueIndex: number // Index in the company's values array
  message: string
  coins: number
  isPublic: boolean
  daysAgo?: number // Optional: create compliment X days in the past
}

// Helper function to create dates in the past
export function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

// All Valorize Corp user authUserIds (17 real + 33 temp)
const VALORIZE_USERS = [
  '28a805cd-218f-49e0-a4ec-4acd5996f543',              // Gabriel
  '22222222-2222-2222-2222-222222222222',              // Super Admin
  '33333333-3333-3333-3333-333333333333',              // João
  '44444444-4444-4444-4444-444444444444',              // Maria
  '55555555-5555-5555-5555-555555555555',              // Carlos
  'a0000001-0001-0001-0001-000000000001',              // Ana
  'a0000001-0001-0001-0001-000000000002',              // Pedro
  'a0000001-0001-0001-0001-000000000003',              // Beatriz
  'a0000001-0001-0001-0001-000000000004',              // Lucas
  'a0000001-0001-0001-0001-000000000005',              // Camila
  'a0000001-0001-0001-0001-000000000006',              // Rafael
  'a0000001-0001-0001-0001-000000000007',              // Juliana
  'a0000001-0001-0001-0001-000000000008',              // Felipe
  'a0000001-0001-0001-0001-000000000009',              // Larissa
  'a0000001-0001-0001-0001-000000000010',              // Rodrigo
  'a0000001-0001-0001-0001-000000000011',              // Patricia
  'a0000001-0001-0001-0001-000000000012',              // Thiago
  't0000001-0001-0001-0001-000000000001',
  't0000001-0001-0001-0001-000000000002',
  't0000001-0001-0001-0001-000000000003',
  't0000001-0001-0001-0001-000000000004',
  't0000001-0001-0001-0001-000000000005',
  't0000001-0001-0001-0001-000000000006',
  't0000001-0001-0001-0001-000000000007',
  't0000001-0001-0001-0001-000000000008',
  't0000001-0001-0001-0001-000000000009',
  't0000001-0001-0001-0001-000000000010',
  't0000001-0001-0001-0001-000000000011',
  't0000001-0001-0001-0001-000000000012',
  't0000001-0001-0001-0001-000000000013',
  't0000001-0001-0001-0001-000000000014',
  't0000001-0001-0001-0001-000000000015',
  't0000001-0001-0001-0001-000000000016',
  't0000001-0001-0001-0001-000000000017',
  't0000001-0001-0001-0001-000000000018',
  't0000001-0001-0001-0001-000000000019',
  't0000001-0001-0001-0001-000000000020',
  't0000001-0001-0001-0001-000000000021',
  't0000001-0001-0001-0001-000000000022',
  't0000001-0001-0001-0001-000000000023',
  't0000001-0001-0001-0001-000000000024',
  't0000001-0001-0001-0001-000000000025',
  't0000001-0001-0001-0001-000000000026',
  't0000001-0001-0001-0001-000000000027',
  't0000001-0001-0001-0001-000000000028',
  't0000001-0001-0001-0001-000000000029',
  't0000001-0001-0001-0001-000000000030',
  't0000001-0001-0001-0001-000000000031',
  't0000001-0001-0001-0001-000000000032',
  't0000001-0001-0001-0001-000000000033',
]

const COMPLIMENT_MESSAGES = [
  'Excelente trabalho no projeto!',
  'Sua colaboração foi fundamental!',
  'Muito bom o seu desempenho!',
  'Trabalho de qualidade impecável!',
  'Sempre com foco no cliente!',
  'Integridade exemplar!',
  'Inovação criativa e efetiva!',
  'Liderança inspiradora!',
  'Transparência total nas ações!',
  'Dedicação constante!',
  'Ajudou muito a equipe!',
  'Ideias geniais!',
  'Execução perfeita!',
  'Muito profissional!',
  'Você foi essencial!',
  'Trabalho extraordinário!',
  'Apoio incondicional!',
  'Resultado excepcional!',
  'Muito bem representado!',
  'Excelência em tudo!',
]

// Coin values available for compliments (multiples of 5)
const COIN_VALUES = [40, 45, 50, 55, 60, 65, 70, 75, 80]

// Generate expanded compliments for realistic economy dashboard
function generateCompliments(): Omit<ComplimentData, 'companyId'>[] {
  const compliments: Omit<ComplimentData, 'companyId'>[] = []

  // Generate ~3,200 compliments over 90 days
  // Strategy: ~35 compliments per day distributed across all users
  // Each user sends compliments to different users throughout the day

  for (let day = 0; day < 90; day++) {
    // For each day, create ~35-36 compliments from different senders
    for (let complimentIndex = 0; complimentIndex < 36; complimentIndex++) {
      // Rotate sender (ensures diverse senders over time)
      const senderIdx = (day + complimentIndex) % VALORIZE_USERS.length
      const sender = VALORIZE_USERS[senderIdx]

      // Random receiver (but different from sender)
      let receiverIdx = (day + complimentIndex + 5) % VALORIZE_USERS.length
      if (receiverIdx === senderIdx) {
        receiverIdx = (receiverIdx + 1) % VALORIZE_USERS.length
      }
      const receiver = VALORIZE_USERS[receiverIdx]

      // Select random message, coins, and value index
      const message = COMPLIMENT_MESSAGES[complimentIndex % COMPLIMENT_MESSAGES.length]
      const coins = COIN_VALUES[complimentIndex % COIN_VALUES.length]
      const valueIndex = complimentIndex % 5

      compliments.push({
        senderAuthUserId: sender,
        receiverAuthUserId: receiver,
        valueIndex,
        message,
        coins,
        isPublic: complimentIndex % 3 !== 0, // ~67% public
        daysAgo: 90 - day, // Distribute over last 90 days
      })
    }
  }

  return compliments
}

// Keep original Gabriel compliments (smaller set for specific narrative)
export const COMPLIMENTS_FROM_GABRIEL: Omit<ComplimentData, 'senderAuthUserId' | 'companyId'>[] = [
  { receiverAuthUserId: '33333333-3333-3333-3333-333333333333', valueIndex: 0, message: 'João, excelente apresentação para o cliente hoje!', coins: 60, isPublic: true, daysAgo: 2 },
  { receiverAuthUserId: '44444444-4444-4444-4444-444444444444', valueIndex: 1, message: 'Maria, sua colaboração no projeto foi incrível!', coins: 50, isPublic: true, daysAgo: 3 },
  { receiverAuthUserId: '55555555-5555-5555-5555-555555555555', valueIndex: 2, message: 'Carlos, revisão de código impecável!', coins: 75, isPublic: true, daysAgo: 4 },
]

export const COMPLIMENTS_TO_GABRIEL: Omit<ComplimentData, 'receiverAuthUserId' | 'companyId'>[] = [
  { senderAuthUserId: '33333333-3333-3333-3333-333333333333', valueIndex: 1, message: 'Gabriel, sua liderança técnica é inspiradora!', coins: 70, isPublic: true, daysAgo: 5 },
  { senderAuthUserId: '44444444-4444-4444-4444-444444444444', valueIndex: 2, message: 'Gabriel, muito obrigada pelo suporte na última sprint!', coins: 60, isPublic: true, daysAgo: 6 },
]

// Expanded employee compliments - using generated data
export const EXPANDED_EMPLOYEE_COMPLIMENTS = generateCompliments()

// TechStart Brasil compliments (smaller dataset, just 20 compliments)
export const TECHSTART_COMPLIMENTS: Omit<ComplimentData, 'companyId'>[] = [
  { senderAuthUserId: 'b0000002-0002-0002-0002-000000000001', receiverAuthUserId: 'b0000002-0002-0002-0002-000000000002', valueIndex: 0, message: 'Excelente trabalho no onboarding!', coins: 60, isPublic: true, daysAgo: 10 },
  { senderAuthUserId: 'b0000002-0002-0002-0002-000000000001', receiverAuthUserId: 'b0000002-0002-0002-0002-000000000003', valueIndex: 1, message: 'Liderança muito boa!', coins: 50, isPublic: true, daysAgo: 15 },
  { senderAuthUserId: 'b0000002-0002-0002-0002-000000000002', receiverAuthUserId: 'b0000002-0002-0002-0002-000000000004', valueIndex: 2, message: 'Código de qualidade!', coins: 55, isPublic: true, daysAgo: 20 },
  { senderAuthUserId: 'b0000002-0002-0002-0002-000000000002', receiverAuthUserId: 'b0000002-0002-0002-0002-000000000005', valueIndex: 3, message: 'QA impecável!', coins: 65, isPublic: true, daysAgo: 25 },
  { senderAuthUserId: 'b0000002-0002-0002-0002-000000000003', receiverAuthUserId: 'b0000002-0002-0002-0002-000000000004', valueIndex: 4, message: 'Muito colaborativo!', coins: 50, isPublic: true, daysAgo: 30 },
  { senderAuthUserId: 'b0000002-0002-0002-0002-000000000003', receiverAuthUserId: 'b0000002-0002-0002-0002-000000000001', valueIndex: 0, message: 'Gestão excelente!', coins: 60, isPublic: true, daysAgo: 35 },
  { senderAuthUserId: 'b0000002-0002-0002-0002-000000000004', receiverAuthUserId: 'b0000002-0002-0002-0002-000000000005', valueIndex: 1, message: 'Ótima parceria!', coins: 45, isPublic: true, daysAgo: 40 },
  { senderAuthUserId: 'b0000002-0002-0002-0002-000000000004', receiverAuthUserId: 'b0000002-0002-0002-0002-000000000002', valueIndex: 2, message: 'Suporte ótimo!', coins: 55, isPublic: true, daysAgo: 45 },
  { senderAuthUserId: 'b0000002-0002-0002-0002-000000000005', receiverAuthUserId: 'b0000002-0002-0002-0002-000000000001', valueIndex: 3, message: 'Visão estratégica!', coins: 60, isPublic: true, daysAgo: 50 },
  { senderAuthUserId: 'b0000002-0002-0002-0002-000000000005', receiverAuthUserId: 'b0000002-0002-0002-0002-000000000003', valueIndex: 4, message: 'Muito inspirador!', coins: 70, isPublic: true, daysAgo: 55 },
]

// Global Solutions compliments (smaller dataset, just 15 compliments)
export const GLOBAL_SOLUTIONS_COMPLIMENTS: Omit<ComplimentData, 'companyId'>[] = [
  { senderAuthUserId: 'c0000003-0003-0003-0003-000000000001', receiverAuthUserId: 'c0000003-0003-0003-0003-000000000002', valueIndex: 0, message: 'Gestão de pessoas excelente!', coins: 65, isPublic: true, daysAgo: 10 },
  { senderAuthUserId: 'c0000003-0003-0003-0003-000000000001', receiverAuthUserId: 'c0000003-0003-0003-0003-000000000003', valueIndex: 1, message: 'Soluções inovadoras!', coins: 70, isPublic: true, daysAgo: 20 },
  { senderAuthUserId: 'c0000003-0003-0003-0003-000000000002', receiverAuthUserId: 'c0000003-0003-0003-0003-000000000001', valueIndex: 2, message: 'Liderança visão de futuro!', coins: 60, isPublic: true, daysAgo: 30 },
  { senderAuthUserId: 'c0000003-0003-0003-0003-000000000002', receiverAuthUserId: 'c0000003-0003-0003-0003-000000000003', valueIndex: 3, message: 'Muito transparente!', coins: 50, isPublic: true, daysAgo: 40 },
  { senderAuthUserId: 'c0000003-0003-0003-0003-000000000003', receiverAuthUserId: 'c0000003-0003-0003-0003-000000000001', valueIndex: 4, message: 'Cliente sempre em primeiro!', coins: 55, isPublic: true, daysAgo: 50 },
  { senderAuthUserId: 'c0000003-0003-0003-0003-000000000003', receiverAuthUserId: 'c0000003-0003-0003-0003-000000000002', valueIndex: 0, message: 'Suporte incrível!', coins: 60, isPublic: true, daysAgo: 60 },
]

// Constants for seeder integration
export const GABRIEL_AUTH_USER_ID = '28a805cd-218f-49e0-a4ec-4acd5996f543'
export const VALORIZE_COMPANY_ID = 'demo-company-001'
