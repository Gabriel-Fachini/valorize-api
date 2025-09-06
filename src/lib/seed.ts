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

const DEMO_COMPANY_ID = 'demo-company-001'

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
      'admin:access_panel', 'admin:view_analytics', 'admin:manage_company',
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
  {
    auth0Id: 'auth0|688aa3e7f3f1dbd119c3b600',
    email: 'gabriel@valorize.com',
    name: 'Gabriel',
    companyId: DEMO_COMPANY_ID,
    roles: ['super_admin'],
  },
  {
    auth0Id: 'auth0|demo-super-admin',
    email: 'admin@valorize.com',
    name: 'Super Admin',
    companyId: DEMO_COMPANY_ID,
    roles: ['super_admin'],
  },
  {
    auth0Id: 'auth0|demo-company-admin',
    email: 'admin@democorp.com',
    name: 'João Silva',
    companyId: DEMO_COMPANY_ID,
    roles: ['company_admin'],
  },
  {
    auth0Id: 'auth0|demo-hr-manager',
    email: 'hr@democorp.com',
    name: 'Maria Santos',
    companyId: DEMO_COMPANY_ID,
    roles: ['hr_manager'],
  },
  {
    auth0Id: 'auth0|demo-team-lead',
    email: 'lead@democorp.com',
    name: 'Carlos Oliveira',
    companyId: DEMO_COMPANY_ID,
    roles: ['team_lead'],
  },
  {
    auth0Id: 'auth0|demo-employee-1',
    email: 'ana@democorp.com',
    name: 'Ana Costa',
    companyId: DEMO_COMPANY_ID,
    roles: ['employee'],
  },
  {
    auth0Id: 'auth0|demo-employee-2',
    email: 'pedro@democorp.com',
    name: 'Pedro Lima',
    companyId: DEMO_COMPANY_ID,
    roles: ['employee'],
  },
]

async function clearDatabase() {
  logger.info('🧹 Clearing existing data...')
  
  // Delete in correct order to respect foreign key constraints
  await prisma.userRole.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.permission.deleteMany()
  
  logger.info('✅ Database cleared')
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
  
  for (const roleConfig of ROLES_CONFIG) {
    // Create role
    const role = await prisma.role.upsert({
      where: { 
        name_companyId: { 
          name: roleConfig.name, 
          companyId: DEMO_COMPANY_ID 
        } 
      },
      update: { description: roleConfig.description },
      create: {
        name: roleConfig.name,
        description: roleConfig.description,
        companyId: DEMO_COMPANY_ID,
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
    
    logger.info(`✅ Created role '${roleConfig.name}' with ${permissions.length} permissions`)
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
    
    // Get roles for this user
    const roles = await prisma.role.findMany({
      where: { 
        name: { in: userData.roles },
        companyId: DEMO_COMPANY_ID,
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

async function verifySeeding() {
  logger.info('🔍 Verifying seeded data...')
  
  const counts = {
    permissions: await prisma.permission.count(),
    roles: await prisma.role.count(),
    users: await prisma.user.count(),
    userRoles: await prisma.userRole.count(),
    rolePermissions: await prisma.rolePermission.count(),
  }
  
  logger.info('📊 Database summary:', counts)
  
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
    await seedPermissions()
    await seedRoles()
    await seedUsers()
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
