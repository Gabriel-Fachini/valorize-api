/**
 * Direct test of company details service logic (bypasses HTTP/auth)
 *
 * Usage:
 * npx tsx utility-tests/test-company-details-service.ts
 */

import 'dotenv/config'
import { backofficeCompanyService } from '@/features/backoffice/companies/companies.service'
import prisma from '@/lib/database'

async function testService() {
  console.log('\n🧪 Testing Backoffice Company Service (Direct)\n')
  console.log('=' .repeat(60))

  try {
    // Get a company ID
    console.log('\n📋 Step 1: Fetching a company from database...')
    const company = await prisma.company.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!company) {
      console.error('❌ No companies found in database')
      process.exit(1)
    }

    console.log(`✅ Found company: ${company.name} (${company.id})`)

    // Test the service
    console.log('\n📡 Step 2: Calling backofficeCompanyService.getCompanyDetails()...')
    const result = await backofficeCompanyService.getCompanyDetails(company.id)

    if (!result) {
      console.error('❌ Service returned null!')
      process.exit(1)
    }

    console.log('\n✅ Service returned data!')
    console.log('\n📦 Result structure:')
    console.log(`   Total properties: ${Object.keys(result).length}`)

    console.log('\n📋 Properties breakdown:')
    Object.keys(result).forEach(key => {
      const value = result[key as keyof typeof result]
      let type = typeof value
      let extra = ''

      if (value === null) {
        type = 'null'
      } else if (Array.isArray(value)) {
        type = 'array'
        extra = `(${value.length} items)`
      } else if (type === 'object' && value) {
        extra = `(${Object.keys(value).length} props)`
      }

      console.log(`   - ${key}: ${type} ${extra}`)
    })

    // Check for empty data
    console.log('\n🔍 Checking for data issues...')

    const issues: string[] = []

    if (!result.wallet) {
      issues.push('❌ wallet is null/undefined')
    } else if (Object.keys(result.wallet).length === 0) {
      issues.push('❌ wallet is empty object')
    } else {
      console.log(`✅ wallet has ${Object.keys(result.wallet).length} properties`)
    }

    if (!result.plan) {
      issues.push('❌ plan is null/undefined')
    } else {
      console.log(`✅ plan exists`)
    }

    if (!result.metrics) {
      issues.push('❌ metrics is null/undefined')
    } else if (Object.keys(result.metrics).length === 0) {
      issues.push('❌ metrics is empty object')
    } else {
      console.log(`✅ metrics has ${Object.keys(result.metrics).length} properties`)
    }

    if (!result.billing) {
      issues.push('❌ billing is null/undefined')
    } else if (Object.keys(result.billing).length === 0) {
      issues.push('❌ billing is empty object')
    } else {
      console.log(`✅ billing has ${Object.keys(result.billing).length} properties`)
    }

    if (issues.length > 0) {
      console.log('\n⚠️  Issues found:')
      issues.forEach(issue => console.log(`   ${issue}`))
    } else {
      console.log('\n✅ All data properties look good!')
    }

    // Show full result
    console.log('\n📄 Full result (JSON):')
    console.log(JSON.stringify(result, null, 2))

    console.log('\n' + '=' .repeat(60))
    console.log('✅ Test completed!')

    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ Error during test:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

testService()
