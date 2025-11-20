import { prisma } from './src/lib/database'
import jwt from 'jsonwebtoken'

async function debugAuth() {
  const email = process.argv[2]

  if (!email) {
    console.log('❌ Usage: npx tsx debug-auth.ts <email>')
    process.exit(1)
  }

  console.log(`\n🔍 Debugging auth for email: ${email}\n`)

  // 1. Check if user exists in database
  const dbUser = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      authUserId: true,
      email: true,
      name: true,
      companyId: true,
      isActive: true,
    },
  })

  if (!dbUser) {
    console.log('❌ User NOT found in database')
    process.exit(1)
  }

  console.log('✅ User found in database:')
  console.log('   Database ID:', dbUser.id)
  console.log('   Auth User ID:', dbUser.authUserId)
  console.log('   Email:', dbUser.email)
  console.log('   Name:', dbUser.name)
  console.log('   Company ID:', dbUser.companyId)
  console.log('   Is Active:', dbUser.isActive)

  // 2. Check roles and permissions
  const userRoles = await prisma.userRole.findMany({
    where: { userId: dbUser.id },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  })

  console.log('\n📋 Roles:')
  userRoles.forEach(ur => {
    console.log(`   - ${ur.role.name}`)
  })

  const permissions = userRoles.flatMap(ur =>
    ur.role.permissions.map(rp => rp.permission.name),
  )

  console.log('\n🔐 Permissions:')
  const uniquePermissions = [...new Set(permissions)]
  uniquePermissions.forEach(p => {
    console.log(`   - ${p}`)
  })

  const hasAdminAccess = permissions.includes('admin:access_panel')
  console.log('\n✓ Has admin:access_panel?', hasAdminAccess ? '✅ YES' : '❌ NO')

  // 3. Instructions for getting JWT
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📝 NEXT STEPS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n1. Login in the APP (not admin) using Postman or curl:')
  console.log(`
   curl -X POST http://localhost:3000/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email": "${email}", "password": "YOUR_PASSWORD"}'
  `)
  console.log('\n2. Copy the "access_token" from the response')
  console.log('\n3. Run this script again with the token as second argument:')
  console.log(`   npx tsx debug-auth.ts ${email} YOUR_ACCESS_TOKEN`)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 4. If token provided, decode and compare
  const token = process.argv[3]

  if (token) {
    console.log('\n🔓 Decoding JWT token...\n')

    try {
      // Decode without verification (just to see the payload)
      const decoded = jwt.decode(token) as any

      if (!decoded) {
        console.log('❌ Failed to decode token')
        process.exit(1)
      }

      console.log('JWT Payload:')
      console.log('   sub (authUserId):', decoded.sub)
      console.log('   email:', decoded.email)
      console.log('   exp:', new Date(decoded.exp * 1000).toISOString())

      console.log('\n🔄 Comparing with database:')

      if (decoded.sub === dbUser.authUserId) {
        console.log('   ✅ authUserId MATCHES!')
      } else {
        console.log('   ❌ authUserId DOES NOT MATCH!')
        console.log('      JWT sub:', decoded.sub)
        console.log('      DB authUserId:', dbUser.authUserId)
      }

      if (decoded.email === dbUser.email) {
        console.log('   ✅ email MATCHES!')
      } else {
        console.log('   ❌ email DOES NOT MATCH!')
        console.log('      JWT email:', decoded.email)
        console.log('      DB email:', dbUser.email)
      }

    } catch (error) {
      console.log('❌ Error decoding token:', error)
    }
  }
}

debugAuth()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
