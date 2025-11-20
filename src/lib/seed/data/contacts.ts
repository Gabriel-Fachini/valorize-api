/**
 * Company contact seed data
 */

export interface CompanyContactData {
  companyId: string
  userAuthUserId: string
  role: string
  isPrimary: boolean
}

export const DEMO_COMPANY_CONTACTS: CompanyContactData[] = [
  // Valorize Corp contacts
  {
    companyId: 'demo-company-001',
    userAuthUserId: '28a805cd-218f-49e0-a4ec-4acd5996f543',
    role: 'CEO & Founder',
    isPrimary: true,
  },
  {
    companyId: 'demo-company-001',
    userAuthUserId: '33333333-3333-3333-3333-333333333333',
    role: 'CTO',
    isPrimary: false,
  },
  {
    companyId: 'demo-company-001',
    userAuthUserId: '44444444-4444-4444-4444-444444444444',
    role: 'HR Manager',
    isPrimary: false,
  },

  // TechStart Brasil contacts
  {
    companyId: 'demo-company-002',
    userAuthUserId: 'b0000002-0002-0002-0002-000000000001',
    role: 'CEO',
    isPrimary: true,
  },
  {
    companyId: 'demo-company-002',
    userAuthUserId: 'b0000002-0002-0002-0002-000000000002',
    role: 'Head of People',
    isPrimary: false,
  },
  {
    companyId: 'demo-company-002',
    userAuthUserId: 'b0000002-0002-0002-0002-000000000003',
    role: 'Tech Lead',
    isPrimary: false,
  },

  // Global Solutions Inc contacts
  {
    companyId: 'demo-company-003',
    userAuthUserId: 'c0000003-0003-0003-0003-000000000001',
    role: 'President',
    isPrimary: true,
  },
  {
    companyId: 'demo-company-003',
    userAuthUserId: 'c0000003-0003-0003-0003-000000000002',
    role: 'VP of Human Resources',
    isPrimary: false,
  },
]
