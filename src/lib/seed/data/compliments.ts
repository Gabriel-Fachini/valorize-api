/**
 * Compliment seed data - Expanded for realistic economy dashboard metrics
 * Generated to support ~3,200 compliments over 90 days (~200k coins total)
 */

export interface ComplimentData {
  senderAuth0Id: string
  receiverAuth0Id: string
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

// All Valorize Corp user auth0Ids (17 real + 33 temp)
const VALORIZE_USERS = [
  'auth0|688aa3e7f3f1dbd119c3b600',                    // Gabriel
  'auth0|demo-super-admin',                            // Super Admin
  'auth0|demo-company-admin-valorize',                 // João
  'auth0|demo-hr-manager-valorize',                    // Maria
  'auth0|demo-team-lead-valorize',                     // Carlos
  'auth0|demo-employee-valorize-1',                    // Ana
  'auth0|demo-employee-valorize-2',                    // Pedro
  'auth0|demo-employee-valorize-3',                    // Beatriz
  'auth0|demo-employee-valorize-4',                    // Lucas
  'auth0|demo-employee-valorize-5',                    // Camila
  'auth0|demo-employee-valorize-6',                    // Rafael
  'auth0|demo-employee-valorize-7',                    // Juliana
  'auth0|demo-employee-valorize-8',                    // Felipe
  'auth0|demo-employee-valorize-9',                    // Larissa
  'auth0|demo-employee-valorize-10',                   // Rodrigo
  'auth0|demo-employee-valorize-11',                   // Patricia
  'auth0|demo-employee-valorize-12',                   // Thiago
  'auth0|temp-employee-valorize-01',
  'auth0|temp-employee-valorize-02',
  'auth0|temp-employee-valorize-03',
  'auth0|temp-employee-valorize-04',
  'auth0|temp-employee-valorize-05',
  'auth0|temp-employee-valorize-06',
  'auth0|temp-employee-valorize-07',
  'auth0|temp-employee-valorize-08',
  'auth0|temp-employee-valorize-09',
  'auth0|temp-employee-valorize-10',
  'auth0|temp-employee-valorize-11',
  'auth0|temp-employee-valorize-12',
  'auth0|temp-employee-valorize-13',
  'auth0|temp-employee-valorize-14',
  'auth0|temp-employee-valorize-15',
  'auth0|temp-employee-valorize-16',
  'auth0|temp-employee-valorize-17',
  'auth0|temp-employee-valorize-18',
  'auth0|temp-employee-valorize-19',
  'auth0|temp-employee-valorize-20',
  'auth0|temp-employee-valorize-21',
  'auth0|temp-employee-valorize-22',
  'auth0|temp-employee-valorize-23',
  'auth0|temp-employee-valorize-24',
  'auth0|temp-employee-valorize-25',
  'auth0|temp-employee-valorize-26',
  'auth0|temp-employee-valorize-27',
  'auth0|temp-employee-valorize-28',
  'auth0|temp-employee-valorize-29',
  'auth0|temp-employee-valorize-30',
  'auth0|temp-employee-valorize-31',
  'auth0|temp-employee-valorize-32',
  'auth0|temp-employee-valorize-33',
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
        senderAuth0Id: sender,
        receiverAuth0Id: receiver,
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
export const COMPLIMENTS_FROM_GABRIEL: Omit<ComplimentData, 'senderAuth0Id' | 'companyId'>[] = [
  { receiverAuth0Id: 'auth0|demo-company-admin-valorize', valueIndex: 0, message: 'João, excelente apresentação para o cliente hoje!', coins: 60, isPublic: true, daysAgo: 2 },
  { receiverAuth0Id: 'auth0|demo-hr-manager-valorize', valueIndex: 1, message: 'Maria, sua colaboração no projeto foi incrível!', coins: 50, isPublic: true, daysAgo: 3 },
  { receiverAuth0Id: 'auth0|demo-team-lead-valorize', valueIndex: 2, message: 'Carlos, revisão de código impecável!', coins: 75, isPublic: true, daysAgo: 4 },
]

export const COMPLIMENTS_TO_GABRIEL: Omit<ComplimentData, 'receiverAuth0Id' | 'companyId'>[] = [
  { senderAuth0Id: 'auth0|demo-company-admin-valorize', valueIndex: 1, message: 'Gabriel, sua liderança técnica é inspiradora!', coins: 70, isPublic: true, daysAgo: 5 },
  { senderAuth0Id: 'auth0|demo-hr-manager-valorize', valueIndex: 2, message: 'Gabriel, muito obrigada pelo suporte na última sprint!', coins: 60, isPublic: true, daysAgo: 6 },
]

// Expanded employee compliments - using generated data
export const EXPANDED_EMPLOYEE_COMPLIMENTS = generateCompliments()

// TechStart Brasil compliments (smaller dataset, just 20 compliments)
export const TECHSTART_COMPLIMENTS: Omit<ComplimentData, 'companyId'>[] = [
  { senderAuth0Id: 'auth0|demo-company-admin-techstart', receiverAuth0Id: 'auth0|demo-hr-manager-techstart', valueIndex: 0, message: 'Excelente trabalho no onboarding!', coins: 60, isPublic: true, daysAgo: 10 },
  { senderAuth0Id: 'auth0|demo-company-admin-techstart', receiverAuth0Id: 'auth0|demo-team-lead-techstart', valueIndex: 1, message: 'Liderança muito boa!', coins: 50, isPublic: true, daysAgo: 15 },
  { senderAuth0Id: 'auth0|demo-hr-manager-techstart', receiverAuth0Id: 'auth0|demo-employee-techstart-1', valueIndex: 2, message: 'Código de qualidade!', coins: 55, isPublic: true, daysAgo: 20 },
  { senderAuth0Id: 'auth0|demo-hr-manager-techstart', receiverAuth0Id: 'auth0|demo-employee-techstart-2', valueIndex: 3, message: 'QA impecável!', coins: 65, isPublic: true, daysAgo: 25 },
  { senderAuth0Id: 'auth0|demo-team-lead-techstart', receiverAuth0Id: 'auth0|demo-employee-techstart-1', valueIndex: 4, message: 'Muito colaborativo!', coins: 50, isPublic: true, daysAgo: 30 },
  { senderAuth0Id: 'auth0|demo-team-lead-techstart', receiverAuth0Id: 'auth0|demo-company-admin-techstart', valueIndex: 0, message: 'Gestão excelente!', coins: 60, isPublic: true, daysAgo: 35 },
  { senderAuth0Id: 'auth0|demo-employee-techstart-1', receiverAuth0Id: 'auth0|demo-employee-techstart-2', valueIndex: 1, message: 'Ótima parceria!', coins: 45, isPublic: true, daysAgo: 40 },
  { senderAuth0Id: 'auth0|demo-employee-techstart-1', receiverAuth0Id: 'auth0|demo-hr-manager-techstart', valueIndex: 2, message: 'Suporte ótimo!', coins: 55, isPublic: true, daysAgo: 45 },
  { senderAuth0Id: 'auth0|demo-employee-techstart-2', receiverAuth0Id: 'auth0|demo-company-admin-techstart', valueIndex: 3, message: 'Visão estratégica!', coins: 60, isPublic: true, daysAgo: 50 },
  { senderAuth0Id: 'auth0|demo-employee-techstart-2', receiverAuth0Id: 'auth0|demo-team-lead-techstart', valueIndex: 4, message: 'Muito inspirador!', coins: 70, isPublic: true, daysAgo: 55 },
]

// Global Solutions compliments (smaller dataset, just 15 compliments)
export const GLOBAL_SOLUTIONS_COMPLIMENTS: Omit<ComplimentData, 'companyId'>[] = [
  { senderAuth0Id: 'auth0|demo-company-admin-global', receiverAuth0Id: 'auth0|demo-hr-manager-global', valueIndex: 0, message: 'Gestão de pessoas excelente!', coins: 65, isPublic: true, daysAgo: 10 },
  { senderAuth0Id: 'auth0|demo-company-admin-global', receiverAuth0Id: 'auth0|demo-employee-global-1', valueIndex: 1, message: 'Soluções inovadoras!', coins: 70, isPublic: true, daysAgo: 20 },
  { senderAuth0Id: 'auth0|demo-hr-manager-global', receiverAuth0Id: 'auth0|demo-company-admin-global', valueIndex: 2, message: 'Liderança visão de futuro!', coins: 60, isPublic: true, daysAgo: 30 },
  { senderAuth0Id: 'auth0|demo-hr-manager-global', receiverAuth0Id: 'auth0|demo-employee-global-1', valueIndex: 3, message: 'Muito transparente!', coins: 50, isPublic: true, daysAgo: 40 },
  { senderAuth0Id: 'auth0|demo-employee-global-1', receiverAuth0Id: 'auth0|demo-company-admin-global', valueIndex: 4, message: 'Cliente sempre em primeiro!', coins: 55, isPublic: true, daysAgo: 50 },
  { senderAuth0Id: 'auth0|demo-employee-global-1', receiverAuth0Id: 'auth0|demo-hr-manager-global', valueIndex: 0, message: 'Suporte incrível!', coins: 60, isPublic: true, daysAgo: 60 },
]

// Constants for seeder integration
export const GABRIEL_AUTH0_ID = 'auth0|688aa3e7f3f1dbd119c3b600'
export const VALORIZE_COMPANY_ID = 'demo-company-001'
