/**
 * Helper script to get a company ID from database
 *
 * Usage:
 * npx tsx utility-tests/get-company-id.ts
 */

import 'dotenv/config'
import prisma from '@/lib/database'

async function getCompanyId() {
  console.log('\n🔍 Fetching companies from database...\n')

  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (companies.length === 0) {
      console.log('❌ No companies found in database')
      process.exit(1)
    }

    console.log(`✅ Found ${companies.length} companies:\n`)

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`)
      console.log(`   ID: ${company.id}`)
      console.log(`   Domain: ${company.domain}`)
      console.log(`   Active: ${company.isActive ? '✅' : '❌'}`)
      console.log('')
    })

    console.log('\n💡 Use one of these IDs to test the endpoint:')
    console.log(`   COMPANY_ID=${companies[0].id} AUTH0_TOKEN=your_token npx tsx utility-tests/test-backoffice-company-details.ts`)

    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Error fetching companies:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

getCompanyId()
