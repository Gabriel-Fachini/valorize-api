/**
 * Company contact seed data
 */

export interface CompanyContactData {
  companyId: string
  userAuth0Id: string
  role: string
  isPrimary: boolean
}

export const DEMO_COMPANY_CONTACTS: CompanyContactData[] = [
  // Valorize Corp contacts
  {
    companyId: 'demo-company-001',
    userAuth0Id: 'auth0|688aa3e7f3f1dbd119c3b600',
    role: 'CEO & Founder',
    isPrimary: true,
  },
  {
    companyId: 'demo-company-001',
    userAuth0Id: 'auth0|demo-company-admin-valorize',
    role: 'CTO',
    isPrimary: false,
  },
  {
    companyId: 'demo-company-001',
    userAuth0Id: 'auth0|demo-hr-manager-valorize',
    role: 'HR Manager',
    isPrimary: false,
  },

  // TechStart Brasil contacts
  {
    companyId: 'demo-company-002',
    userAuth0Id: 'auth0|demo-company-admin-techstart',
    role: 'CEO',
    isPrimary: true,
  },
  {
    companyId: 'demo-company-002',
    userAuth0Id: 'auth0|demo-hr-manager-techstart',
    role: 'Head of People',
    isPrimary: false,
  },
  {
    companyId: 'demo-company-002',
    userAuth0Id: 'auth0|demo-team-lead-techstart',
    role: 'Tech Lead',
    isPrimary: false,
  },

  // Global Solutions Inc contacts
  {
    companyId: 'demo-company-003',
    userAuth0Id: 'auth0|demo-company-admin-global',
    role: 'President',
    isPrimary: true,
  },
  {
    companyId: 'demo-company-003',
    userAuth0Id: 'auth0|demo-hr-manager-global',
    role: 'VP of Human Resources',
    isPrimary: false,
  },
]
