import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const prisma = new PrismaClient()

// Seed data definitions
const PERMISSIONS = [
  // User management permissions
  { name: 'users:read', description: 'View user information' },
  { name: 'users:create', description: 'Create new users' },
  { name: 'users:update', description: 'Update user information' },
  { name: 'users:delete', description: 'Delete users' },
  { name: 'users:manage_roles', description: 'Assign and remove user roles' },
  
  // Role management permissions
  { name: 'roles:read', description: 'View roles and permissions' },
  { name: 'roles:create', description: 'Create new roles' },
  { name: 'roles:update', description: 'Update existing roles' },
  { name: 'roles:delete', description: 'Delete roles' },
  { name: 'roles:manage_permissions', description: 'Assign permissions to roles' },
  
  // Admin panel permissions
  { name: 'admin:access_panel', description: 'Access administrative panel' },
  { name: 'admin:view_analytics', description: 'View system analytics and reports' },
  { name: 'admin:manage_company', description: 'Manage company settings' },
  { name: 'admin:manage_system', description: 'Manage system-wide settings and operations' },
  { name: 'company:manage_settings', description: 'Manage company-specific settings like values and compliments configuration' },

  // Future features - Praise system
  { name: 'praise:send', description: 'Send praise to colleagues' },
  { name: 'praise:view_all', description: 'View all praise in company' },
  { name: 'praise:moderate', description: 'Moderate and manage praise' },
  
  // Future features - Coins system
  { name: 'coins:view_balance', description: 'View coin balance' },
  { name: 'coins:transfer', description: 'Transfer coins to others' },
  { name: 'coins:manage_system', description: 'Manage coin system settings' },
  
  // Future features - Store system
  { name: 'store:view_catalog', description: 'View prize catalog' },
  { name: 'store:redeem_prizes', description: 'Redeem prizes with coins' },
  { name: 'store:manage_catalog', description: 'Manage prize catalog' },
  
  // Future features - Library system
  { name: 'library:view_books', description: 'View book library' },
  { name: 'library:rate_books', description: 'Rate and review books' },
  { name: 'library:manage_catalog', description: 'Manage book catalog' },
]

// Demo companies data
const DEMO_COMPANIES = [
  {
    id: 'demo-company-001',
    name: 'Valorize Corp',
    domain: 'valorize.com',
    country: 'BR',
    timezone: 'America/Sao_Paulo',
    brazilData: {
      cnpj: '11222333000181',
      razaoSocial: 'Valorize Tecnologia Ltda',
      inscricaoEstadual: '123456789',
      inscricaoMunicipal: '987654321',
      nire: '35300123456',
      cnaePrincipal: '6201-5/00',
      cnaeSecundario: '6202-3/00, 6203-1/00',
      naturezaJuridica: 'Sociedade Empresária Limitada',
      porteEmpresa: 'Empresa de Pequeno Porte',
      situacaoCadastral: 'Ativa',
    },
  },
  {
    id: 'demo-company-002',
    name: 'TechStart Brasil',
    domain: 'techstart.com.br',
    country: 'BR',
    timezone: 'America/Sao_Paulo',
    brazilData: {
      cnpj: '22333444000195',
      razaoSocial: 'TechStart Inovação e Tecnologia Ltda',
      inscricaoEstadual: '234567890',
      inscricaoMunicipal: '876543210',
      nire: '35300234567',
      cnaePrincipal: '6204-0/00',
      cnaeSecundario: '6311-9/00, 7319-0/02',
      naturezaJuridica: 'Sociedade Empresária Limitada',
      porteEmpresa: 'Microempresa',
      situacaoCadastral: 'Ativa',
    },
  },
  {
    id: 'demo-company-003',
    name: 'Global Solutions Inc',
    domain: 'globalsolutions.com',
    country: 'US',
    timezone: 'America/New_York',
    // No data for international company
  },
]

const ROLES_CONFIG = [
  {
    name: 'super_admin',
    description: 'Super administrator with full system access',
    permissions: PERMISSIONS.map(p => p.name), // All permissions
  },
  {
    name: 'company_admin',
    description: 'Company administrator with full company access',
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:manage_roles',
      'roles:read', 'roles:create', 'roles:update', 'roles:manage_permissions',
      'admin:access_panel', 'admin:view_analytics', 'admin:manage_company', 'company:manage_settings',
      'praise:view_all', 'praise:moderate',
      'coins:manage_system',
      'store:manage_catalog',
      'library:manage_catalog',
    ],
  },
  {
    name: 'hr_manager',
    description: 'HR manager with user and analytics access',
    permissions: [
      'users:read', 'users:update', 'users:manage_roles',
      'roles:read',
      'admin:access_panel', 'admin:view_analytics',
      'praise:view_all', 'praise:moderate',
      'coins:view_balance',
      'store:view_catalog',
      'library:view_books',
    ],
  },
  {
    name: 'team_lead',
    description: 'Team leader with limited administrative access',
    permissions: [
      'users:read',
      'roles:read',
      'praise:send', 'praise:view_all',
      'coins:view_balance', 'coins:transfer',
      'store:view_catalog', 'store:redeem_prizes',
      'library:view_books', 'library:rate_books',
    ],
  },
  {
    name: 'employee',
    description: 'Standard employee with basic access',
    permissions: [
      'praise:send',
      'coins:view_balance', 'coins:transfer',
      'store:view_catalog', 'store:redeem_prizes',
      'library:view_books', 'library:rate_books',
    ],
  },
]

const DEMO_USERS = [
  // Valorize Corp users
  {
    auth0Id: 'auth0|688aa3e7f3f1dbd119c3b600',
    email: 'gabriel@valorize.com',
    name: 'Gabriel Fachini',
    companyId: DEMO_COMPANIES[0].id,
    roles: ['super_admin'],
  },
  {
    auth0Id: 'auth0|demo-super-admin',
    email: 'superadmin@valorize.com',
    name: 'Super Admin',
    companyId: DEMO_COMPANIES[0].id,
    roles: ['super_admin'],
  },
  {
    auth0Id: 'auth0|demo-company-admin-valorize',
    email: 'joao@valorize.com',
    name: 'João Silva',
    companyId: DEMO_COMPANIES[0].id,
    roles: ['company_admin'],
  },
  {
    auth0Id: 'auth0|demo-hr-manager-valorize',
    email: 'hr@valorize.com',
    name: 'Maria Santos',
    companyId: DEMO_COMPANIES[0].id,
    roles: ['hr_manager'],
  },
  {
    auth0Id: 'auth0|demo-team-lead-valorize',
    email: 'lead@valorize.com',
    name: 'Carlos Oliveira',
    companyId: DEMO_COMPANIES[0].id,
    roles: ['team_lead'],
  },
  {
    auth0Id: 'auth0|demo-employee-valorize-1',
    email: 'ana@valorize.com',
    name: 'Ana Costa',
    companyId: DEMO_COMPANIES[0].id,
    roles: ['employee'],
  },
  {
    auth0Id: 'auth0|demo-employee-valorize-2',
    email: 'pedro@valorize.com',
    name: 'Pedro Lima',
    companyId: DEMO_COMPANIES[0].id,
    roles: ['employee'],
  },

  // TechStart Brasil users
  {
    auth0Id: 'auth0|demo-company-admin-techstart',
    email: 'admin@techstart.com.br',
    name: 'Fernanda Rodrigues',
    companyId: DEMO_COMPANIES[1].id,
    roles: ['company_admin'],
  },
  {
    auth0Id: 'auth0|demo-hr-manager-techstart',
    email: 'rh@techstart.com.br',
    name: 'Roberto Alves',
    companyId: DEMO_COMPANIES[1].id,
    roles: ['hr_manager'],
  },
  {
    auth0Id: 'auth0|demo-team-lead-techstart',
    email: 'tech@techstart.com.br',
    name: 'Juliana Pereira',
    companyId: DEMO_COMPANIES[1].id,
    roles: ['team_lead'],
  },
  {
    auth0Id: 'auth0|demo-employee-techstart-1',
    email: 'dev1@techstart.com.br',
    name: 'Lucas Martins',
    companyId: DEMO_COMPANIES[1].id,
    roles: ['employee'],
  },
  {
    auth0Id: 'auth0|demo-employee-techstart-2',
    email: 'dev2@techstart.com.br',
    name: 'Camila Souza',
    companyId: DEMO_COMPANIES[1].id,
    roles: ['employee'],
  },

  // Global Solutions Inc users
  {
    auth0Id: 'auth0|demo-company-admin-global',
    email: 'admin@globalsolutions.com',
    name: 'John Smith',
    companyId: DEMO_COMPANIES[2].id,
    roles: ['company_admin'],
  },
  {
    auth0Id: 'auth0|demo-hr-manager-global',
    email: 'hr@globalsolutions.com',
    name: 'Sarah Johnson',
    companyId: DEMO_COMPANIES[2].id,
    roles: ['hr_manager'],
  },
  {
    auth0Id: 'auth0|demo-employee-global-1',
    email: 'mike@globalsolutions.com',
    name: 'Mike Wilson',
    companyId: DEMO_COMPANIES[2].id,
    roles: ['employee'],
  },
]

// Company contacts data
const DEMO_COMPANY_CONTACTS = [
  // Valorize Corp contacts
  {
    companyId: DEMO_COMPANIES[0].id,
    userAuth0Id: 'auth0|688aa3e7f3f1dbd119c3b600',
    role: 'CEO & Founder',
    isPrimary: true,
  },
  {
    companyId: DEMO_COMPANIES[0].id,
    userAuth0Id: 'auth0|demo-company-admin-valorize',
    role: 'CTO',
    isPrimary: false,
  },
  {
    companyId: DEMO_COMPANIES[0].id,
    userAuth0Id: 'auth0|demo-hr-manager-valorize',
    role: 'HR Manager',
    isPrimary: false,
  },

  // TechStart Brasil contacts
  {
    companyId: DEMO_COMPANIES[1].id,
    userAuth0Id: 'auth0|demo-company-admin-techstart',
    role: 'CEO',
    isPrimary: true,
  },
  {
    companyId: DEMO_COMPANIES[1].id,
    userAuth0Id: 'auth0|demo-hr-manager-techstart',
    role: 'Head of People',
    isPrimary: false,
  },
  {
    companyId: DEMO_COMPANIES[1].id,
    userAuth0Id: 'auth0|demo-team-lead-techstart',
    role: 'Tech Lead',
    isPrimary: false,
  },

  // Global Solutions Inc contacts
  {
    companyId: DEMO_COMPANIES[2].id,
    userAuth0Id: 'auth0|demo-company-admin-global',
    role: 'President',
    isPrimary: true,
  },
  {
    companyId: DEMO_COMPANIES[2].id,
    userAuth0Id: 'auth0|demo-hr-manager-global',
    role: 'VP of Human Resources',
    isPrimary: false,
  },
]

async function clearDatabase() {
  logger.info('🧹 Clearing existing data...')
  
  // Delete in correct order to respect foreign key constraints
  await prisma.companyContact.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.compliment.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.companyValue.deleteMany()
  await prisma.companySettings.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.companyBrazil.deleteMany()
  await prisma.company.deleteMany()
  
  logger.info('✅ Database cleared')
}

async function seedCompanies() {
  logger.info('🏢 Seeding companies...')
  
  for (const companyData of DEMO_COMPANIES) {
    // Create company
    const company = await prisma.company.upsert({
      where: { id: companyData.id },
      update: {
        name: companyData.name,
        domain: companyData.domain,
        country: companyData.country,
        timezone: companyData.timezone,
      },
      create: {
        id: companyData.id,
        name: companyData.name,
        domain: companyData.domain,
        country: companyData.country,
        timezone: companyData.timezone,
      },
    })
    
    // Create Brazil-specific data if exists
    if (companyData.brazilData) {
      await prisma.companyBrazil.upsert({
        where: { companyId: company.id },
        update: {
          cnpj: companyData.brazilData.cnpj,
          razaoSocial: companyData.brazilData.razaoSocial,
          inscricaoEstadual: companyData.brazilData.inscricaoEstadual,
          inscricaoMunicipal: companyData.brazilData.inscricaoMunicipal,
          nire: companyData.brazilData.nire,
          cnaePrincipal: companyData.brazilData.cnaePrincipal,
          cnaeSecundario: companyData.brazilData.cnaeSecundario,
          naturezaJuridica: companyData.brazilData.naturezaJuridica,
          porteEmpresa: companyData.brazilData.porteEmpresa,
          situacaoCadastral: companyData.brazilData.situacaoCadastral,
        },
        create: {
          companyId: company.id,
          cnpj: companyData.brazilData.cnpj,
          razaoSocial: companyData.brazilData.razaoSocial,
          inscricaoEstadual: companyData.brazilData.inscricaoEstadual,
          inscricaoMunicipal: companyData.brazilData.inscricaoMunicipal,
          nire: companyData.brazilData.nire,
          cnaePrincipal: companyData.brazilData.cnaePrincipal,
          cnaeSecundario: companyData.brazilData.cnaeSecundario,
          naturezaJuridica: companyData.brazilData.naturezaJuridica,
          porteEmpresa: companyData.brazilData.porteEmpresa,
          situacaoCadastral: companyData.brazilData.situacaoCadastral,
        },
      })
      
      logger.info(`✅ Created company '${companyData.name}' with Brazil data`)
    } else {
      logger.info(`✅ Created company '${companyData.name}'`)
    }
  }
}

async function seedPermissions() {
  logger.info('🔐 Seeding permissions...')
  
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: { description: permission.description },
      create: permission,
    })
  }
  
  logger.info(`✅ Created ${PERMISSIONS.length} permissions`)
}

async function seedRoles() {
  logger.info('👥 Seeding roles...')
  
  // Create roles for each company
  for (const company of DEMO_COMPANIES) {
    for (const roleConfig of ROLES_CONFIG) {
      // Create role
      const role = await prisma.role.upsert({
        where: { 
          name_companyId: { 
            name: roleConfig.name, 
            companyId: company.id, 
          }, 
        },
        update: { description: roleConfig.description },
        create: {
          name: roleConfig.name,
          description: roleConfig.description,
          companyId: company.id,
        },
      })
      
      // Get permissions for this role
      const permissions = await prisma.permission.findMany({
        where: { name: { in: roleConfig.permissions } },
      })
      
      // Create role-permission relationships
      for (const permission of permissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        })
      }
      
      logger.info(`✅ Created role '${roleConfig.name}' for '${company.name}' with ${permissions.length} permissions`)
    }
  }
}

async function seedUsers() {
  logger.info('👤 Seeding users...')
  
  for (const userData of DEMO_USERS) {
    // Create user
    const user = await prisma.user.upsert({
      where: { auth0Id: userData.auth0Id },
      update: {
        email: userData.email,
        name: userData.name,
        companyId: userData.companyId,
      },
      create: {
        auth0Id: userData.auth0Id,
        email: userData.email,
        name: userData.name,
        companyId: userData.companyId,
      },
    })
    
    // Get roles for this user (from the same company)
    const roles = await prisma.role.findMany({
      where: { 
        name: { in: userData.roles },
        companyId: userData.companyId,
      },
    })
    
    // Create user-role relationships
    for (const role of roles) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
        },
      })
    }
    
    logger.info(`✅ Created user '${userData.name}' with roles: ${userData.roles.join(', ')}`)
  }
}

async function seedCompanyContacts() {
  logger.info('📞 Seeding company contacts...')
  
  for (const contactData of DEMO_COMPANY_CONTACTS) {
    // Find user by auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: contactData.userAuth0Id },
    })
    
    if (!user) {
      logger.warn(`User not found for auth0Id: ${contactData.userAuth0Id}`)
      continue
    }
    
    // Create company contact
    await prisma.companyContact.upsert({
      where: {
        companyId_userId: {
          companyId: contactData.companyId,
          userId: user.id,
        },
      },
      update: {
        role: contactData.role,
        isPrimary: contactData.isPrimary,
      },
      create: {
        companyId: contactData.companyId,
        userId: user.id,
        role: contactData.role,
        isPrimary: contactData.isPrimary,
      },
    })
    
    logger.info(`✅ Created contact '${user.name}' as '${contactData.role}' for company`)
  }
}

async function verifySeeding() {
  logger.info('🔍 Verifying seeded data...')
  
  const counts = {
    companies: await prisma.company.count(),
    companiesBrazil: await prisma.companyBrazil.count(),
    companyContacts: await prisma.companyContact.count(),
    permissions: await prisma.permission.count(),
    roles: await prisma.role.count(),
    users: await prisma.user.count(),
    userRoles: await prisma.userRole.count(),
    rolePermissions: await prisma.rolePermission.count(),
    wallets: await prisma.wallet.count(),
    compliments: await prisma.compliment.count(),
    companyValues: await prisma.companyValue.count(),
    companySettings: await prisma.companySettings.count(),
  }
  
  logger.info('📊 Database summary:', counts)
  
  // Show companies summary
  const companies = await prisma.company.findMany({
    include: {
      companyBrazil: true,
      _count: {
        select: {
          users: true,
          roles: true,
          contacts: true,
        },
      },
    },
  })
  
  logger.info('🏢 Companies summary:')
  for (const company of companies) {
    const brazilInfo = company.companyBrazil ? ` (CNPJ: ${company.companyBrazil.cnpj})` : ''
    logger.info(`  ${company.name} (${company.country})${brazilInfo}: ${company._count.users} users, ${company._count.roles} roles, ${company._count.contacts} contacts`)
  }
  
  // Show role-permission mapping
  const rolesWithPermissions = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })
  
  logger.info('🔗 Role-Permission mapping:')
  for (const role of rolesWithPermissions) {
    logger.info(`  ${role.name}: ${role.permissions.length} permissions`)
  }
  
  // Show user-role mapping
  const usersWithRoles = await prisma.user.findMany({
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })
  
  logger.info('👥 User-Role mapping:')
  for (const user of usersWithRoles) {
    const roleNames = user.roles.map(ur => ur.role.name).join(', ')
    logger.info(`  ${user.name} (${user.email}): ${roleNames}`)
  }
}

async function main() {
  try {
    logger.info('🌱 Starting database seeding...')
    
    await clearDatabase()
    await seedCompanies()
    await seedPermissions()
    await seedRoles()
    await seedUsers()
    await seedCompanyContacts()
    await verifySeeding()
    
    logger.info('🎉 Database seeding completed successfully!')
  } catch (error) {
    logger.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Fatal error:', error)
      process.exit(1)
    })
}

export { main as seed }
