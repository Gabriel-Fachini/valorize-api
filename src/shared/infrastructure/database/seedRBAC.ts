import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SeedPermission {
  name: string
  resource: string
  action: string
  description: string
}

interface SeedRole {
  name: string
  description: string
  permissions: string[] // Permission names
}

// Define default permissions
const defaultPermissions: SeedPermission[] = [
  // User management permissions
  {
    name: 'users:read',
    resource: 'users',
    action: 'read',
    description: 'View user information and list users'
  },
  {
    name: 'users:write',
    resource: 'users',
    action: 'write',
    description: 'Create and update user information'
  },
  {
    name: 'users:delete',
    resource: 'users',
    action: 'delete',
    description: 'Delete users from the system'
  },
  {
    name: 'users:manage_roles',
    resource: 'users',
    action: 'manage_roles',
    description: 'Assign and remove roles from users'
  },

  // Role management permissions
  {
    name: 'roles:read',
    resource: 'roles',
    action: 'read',
    description: 'View roles and their permissions'
  },
  {
    name: 'roles:write',
    resource: 'roles',
    action: 'write',
    description: 'Create and update roles'
  },
  {
    name: 'roles:delete',
    resource: 'roles',
    action: 'delete',
    description: 'Delete roles from the system'
  },

  // Permission management permissions
  {
    name: 'permissions:read',
    resource: 'permissions',
    action: 'read',
    description: 'View available permissions'
  },
  {
    name: 'permissions:write',
    resource: 'permissions',
    action: 'write',
    description: 'Create and update permissions'
  },
  {
    name: 'permissions:delete',
    resource: 'permissions',
    action: 'delete',
    description: 'Delete permissions from the system'
  },

  // Admin panel permissions
  {
    name: 'admin:access',
    resource: 'admin',
    action: 'access',
    description: 'Access to admin panel'
  },
  {
    name: 'admin:dashboard',
    resource: 'admin',
    action: 'dashboard',
    description: 'View admin dashboard'
  },
  {
    name: 'admin:system_settings',
    resource: 'admin',
    action: 'system_settings',
    description: 'Manage system settings'
  },

  // Reports and analytics permissions
  {
    name: 'reports:read',
    resource: 'reports',
    action: 'read',
    description: 'View reports and analytics'
  },
  {
    name: 'reports:write',
    resource: 'reports',
    action: 'write',
    description: 'Create and update reports'
  },

  // General permissions
  {
    name: 'profile:read',
    resource: 'profile',
    action: 'read',
    description: 'View own profile information'
  },
  {
    name: 'profile:write',
    resource: 'profile',
    action: 'write',
    description: 'Update own profile information'
  }
]

// Define default roles
const defaultRoles: SeedRole[] = [
  {
    name: 'user',
    description: 'Regular user with basic access to the platform',
    permissions: [
      'profile:read',
      'profile:write'
    ]
  },
  {
    name: 'admin',
    description: 'System administrator with full access',
    permissions: [
      'users:read',
      'users:write',
      'users:delete',
      'users:manage_roles',
      'roles:read',
      'roles:write',
      'roles:delete',
      'permissions:read',
      'permissions:write',
      'permissions:delete',
      'admin:access',
      'admin:dashboard',
      'admin:system_settings',
      'reports:read',
      'reports:write',
      'profile:read',
      'profile:write'
    ]
  },
  {
    name: 'user_manager',
    description: 'Admin user who can manage users but not system settings',
    permissions: [
      'users:read',
      'users:write',
      'users:manage_roles',
      'admin:access',
      'admin:dashboard',
      'profile:read',
      'profile:write'
    ]
  },
  {
    name: 'viewer',
    description: 'Admin user with read-only access to admin panel',
    permissions: [
      'users:read',
      'roles:read',
      'permissions:read',
      'admin:access',
      'admin:dashboard',
      'reports:read',
      'profile:read',
      'profile:write'
    ]
  },
  {
    name: 'analyst',
    description: 'User focused on reports and analytics',
    permissions: [
      'reports:read',
      'reports:write',
      'admin:access',
      'admin:dashboard',
      'profile:read',
      'profile:write'
    ]
  }
]

async function seedRBACData() {
  console.log('🌱 Starting RBAC seed...')

  try {
    // Clear existing RBAC data
    console.log('🧹 Cleaning existing RBAC data...')
    await prisma.rolePermission.deleteMany({})
    await prisma.userRole.deleteMany({})
    await prisma.permission.deleteMany({})
    await prisma.role.deleteMany({})

    // Seed permissions
    console.log('📝 Creating permissions...')
    const createdPermissions = new Map<string, string>() // name -> id

    for (const permission of defaultPermissions) {
      const created = await prisma.permission.create({
        data: {
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description
        }
      })
      createdPermissions.set(permission.name, created.id)
      console.log(`   ✅ Created permission: ${permission.name}`)
    }

    // Seed roles
    console.log('👥 Creating roles...')
    const createdRoles = new Map<string, string>() // name -> id

    for (const role of defaultRoles) {
      const created = await prisma.role.create({
        data: {
          name: role.name,
          description: role.description
        }
      })
      createdRoles.set(role.name, created.id)
      console.log(`   ✅ Created role: ${role.name}`)

      // Assign permissions to role
      for (const permissionName of role.permissions) {
        const permissionId = createdPermissions.get(permissionName)
        if (permissionId) {
          await prisma.rolePermission.create({
            data: {
              roleId: created.id,
              permissionId
            }
          })
          console.log(`      🔗 Assigned permission ${permissionName} to role ${role.name}`)
        } else {
          console.warn(`      ⚠️  Permission ${permissionName} not found for role ${role.name}`)
        }
      }
    }

    console.log('✨ RBAC seed completed successfully!')
    
    // Print summary
    console.log('\n📊 RBAC Summary:')
    console.log(`   • ${defaultPermissions.length} permissions created`)
    console.log(`   • ${defaultRoles.length} roles created`)
    console.log('\n🔐 Available Roles:')
    for (const role of defaultRoles) {
      console.log(`   • ${role.name}: ${role.description}`)
      console.log(`     Permissions: ${role.permissions.length}`)
    }

  } catch (error) {
    console.error('❌ Error seeding RBAC data:', error)
    throw error
  }
}

async function main() {
  await seedRBACData()
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { seedRBACData }