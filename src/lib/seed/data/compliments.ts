/**
 * Compliment seed data
 */

export interface ComplimentData {
  senderAuth0Id: string
  receiverAuth0Id: string
  companyId: string
  valueIndex: number // Index in the company's values array
  message: string
  coins: number
  isPublic: boolean
}

// Compliments from Gabriel to others
export const COMPLIMENTS_FROM_GABRIEL: Omit<ComplimentData, 'senderAuth0Id' | 'companyId'>[] = [
  {
    receiverAuth0Id: 'auth0|demo-company-admin-valorize',
    valueIndex: 0, // Innovation
    message: 'João, your innovative approach to solving that API performance issue was brilliant! The way you optimized our database queries saved us tons of resources. Keep up the amazing work! 🚀',
    coins: 25,
    isPublic: true,
  },
  {
    receiverAuth0Id: 'auth0|demo-hr-manager-valorize',
    valueIndex: 1, // Collaboration
    message: 'Maria, thank you for bringing the team together during the onboarding process. Your collaborative spirit made the new hires feel welcome and productive from day one!',
    coins: 20,
    isPublic: true,
  },
  {
    receiverAuth0Id: 'auth0|demo-team-lead-valorize',
    valueIndex: 2, // Excellence
    message: 'Carlos, the code review you did yesterday was exceptional. Your attention to detail and constructive feedback helped us catch critical bugs before production. Truly excellent work!',
    coins: 30,
    isPublic: true,
  },
  {
    receiverAuth0Id: 'auth0|demo-employee-valorize-1',
    valueIndex: 3, // Integrity
    message: 'Ana, I really appreciate your honesty when you identified that security vulnerability. Your integrity in reporting it immediately protected our users and showed true professionalism.',
    coins: 25,
    isPublic: true,
  },
  {
    receiverAuth0Id: 'auth0|demo-employee-valorize-2',
    valueIndex: 4, // Customer Focus
    message: 'Pedro, the way you handled that difficult customer issue was outstanding. You stayed patient, listened carefully, and found a solution that exceeded their expectations!',
    coins: 20,
    isPublic: true,
  },
]

// Compliments to Gabriel from others
export const COMPLIMENTS_TO_GABRIEL: Omit<ComplimentData, 'receiverAuth0Id' | 'companyId'>[] = [
  {
    senderAuth0Id: 'auth0|demo-company-admin-valorize',
    valueIndex: 0, // Innovation
    message: 'Gabriel, your vision for the Valorize platform is truly innovative! The way you\'re combining recognition with gamification is going to transform how companies appreciate their employees. Excited to build this with you!',
    coins: 30,
    isPublic: true,
  },
  {
    senderAuth0Id: 'auth0|demo-hr-manager-valorize',
    valueIndex: 1, // Collaboration
    message: 'Thanks for always being open to feedback, Gabriel! Your collaborative leadership style makes everyone feel heard and valued. It\'s a pleasure working with you!',
    coins: 25,
    isPublic: true,
  },
  {
    senderAuth0Id: 'auth0|demo-team-lead-valorize',
    valueIndex: 2, // Excellence
    message: 'Gabriel, the architecture decisions you made for this API are excellent. Clean, scalable, and well-documented. This is going to make our lives so much easier as we grow!',
    coins: 30,
    isPublic: true,
  },
  {
    senderAuth0Id: 'auth0|demo-employee-valorize-1',
    valueIndex: 1, // Collaboration
    message: 'Gabriel, thank you for pairing with me on that feature yesterday. Your patience in explaining the complex parts helped me learn so much!',
    coins: 15,
    isPublic: true,
  },
  {
    senderAuth0Id: 'auth0|demo-employee-valorize-2',
    valueIndex: 4, // Customer Focus
    message: 'Your dedication to understanding user needs is inspiring, Gabriel. The features you prioritize always seem to be exactly what our clients need!',
    coins: 20,
    isPublic: true,
  },
]

// Gabriel's auth0Id for reference
export const GABRIEL_AUTH0_ID = 'auth0|688aa3e7f3f1dbd119c3b600'
export const VALORIZE_COMPANY_ID = 'demo-company-001'
