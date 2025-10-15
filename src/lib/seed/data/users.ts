/**
 * User seed data with role assignments
 */

export interface UserData {
  auth0Id: string
  email: string
  name: string
  companyId: string
  roles: string[]
}

export const DEMO_USERS: UserData[] = [
  // Valorize Corp users
  {
    auth0Id: 'auth0|688aa3e7f3f1dbd119c3b600',
    email: 'gabriel@valorize.com',
    name: 'Gabriel Fachini',
    companyId: 'demo-company-001',
    roles: ['super_admin'],
  },
  {
    auth0Id: 'auth0|demo-super-admin',
    email: 'superadmin@valorize.com',
    name: 'Super Admin',
    companyId: 'demo-company-001',
    roles: ['super_admin'],
  },
  {
    auth0Id: 'auth0|demo-company-admin-valorize',
    email: 'joao@valorize.com',
    name: 'João Silva',
    companyId: 'demo-company-001',
    roles: ['company_admin'],
  },
  {
    auth0Id: 'auth0|demo-hr-manager-valorize',
    email: 'hr@valorize.com',
    name: 'Maria Santos',
    companyId: 'demo-company-001',
    roles: ['hr_manager'],
  },
  {
    auth0Id: 'auth0|demo-team-lead-valorize',
    email: 'lead@valorize.com',
    name: 'Carlos Oliveira',
    companyId: 'demo-company-001',
    roles: ['team_lead'],
  },
  {
    auth0Id: 'auth0|demo-employee-valorize-1',
    email: 'ana@valorize.com',
    name: 'Ana Costa',
    companyId: 'demo-company-001',
    roles: ['employee'],
  },
  {
    auth0Id: 'auth0|demo-employee-valorize-2',
    email: 'pedro@valorize.com',
    name: 'Pedro Lima',
    companyId: 'demo-company-001',
    roles: ['employee'],
  },

  // TechStart Brasil users
  {
    auth0Id: 'auth0|demo-company-admin-techstart',
    email: 'admin@techstart.com.br',
    name: 'Fernanda Rodrigues',
    companyId: 'demo-company-002',
    roles: ['company_admin'],
  },
  {
    auth0Id: 'auth0|demo-hr-manager-techstart',
    email: 'rh@techstart.com.br',
    name: 'Roberto Alves',
    companyId: 'demo-company-002',
    roles: ['hr_manager'],
  },
  {
    auth0Id: 'auth0|demo-team-lead-techstart',
    email: 'tech@techstart.com.br',
    name: 'Juliana Pereira',
    companyId: 'demo-company-002',
    roles: ['team_lead'],
  },
  {
    auth0Id: 'auth0|demo-employee-techstart-1',
    email: 'dev1@techstart.com.br',
    name: 'Lucas Martins',
    companyId: 'demo-company-002',
    roles: ['employee'],
  },
  {
    auth0Id: 'auth0|demo-employee-techstart-2',
    email: 'dev2@techstart.com.br',
    name: 'Camila Souza',
    companyId: 'demo-company-002',
    roles: ['employee'],
  },

  // Global Solutions Inc users
  {
    auth0Id: 'auth0|demo-company-admin-global',
    email: 'admin@globalsolutions.com',
    name: 'John Smith',
    companyId: 'demo-company-003',
    roles: ['company_admin'],
  },
  {
    auth0Id: 'auth0|demo-hr-manager-global',
    email: 'hr@globalsolutions.com',
    name: 'Sarah Johnson',
    companyId: 'demo-company-003',
    roles: ['hr_manager'],
  },
  {
    auth0Id: 'auth0|demo-employee-global-1',
    email: 'mike@globalsolutions.com',
    name: 'Mike Wilson',
    companyId: 'demo-company-003',
    roles: ['employee'],
  },
]
