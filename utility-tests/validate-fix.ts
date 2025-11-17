/**
 * Validation script to verify the fix for empty data issue
 *
 * This script tests both:
 * 1. Service layer (direct) - should always work
 * 2. HTTP endpoint (with auth) - fixed by adding additionalProperties: true to schema
 *
 * Usage:
 * npx tsx utility-tests/validate-fix.ts
 *
 * Optional with HTTP test:
 * AUTH0_TOKEN=your_token npx tsx utility-tests/validate-fix.ts
 */

import 'dotenv/config'
import { backofficeCompanyService } from '@/features/backoffice/companies/companies.service'
import prisma from '@/lib/database'

const API_URL = process.env.API_URL || 'http://localhost:8080'
const AUTH0_TOKEN = process.env.AUTH0_TOKEN

async function validateFix() {
  console.log('\n✅ VALIDATION: Backoffice Company Details Fix\n')
  console.log('=' .repeat(60))

  let allTestsPassed = true

  try {
    // TEST 1: Service Layer (Direct)
    console.log('\n📋 TEST 1: Service Layer (Direct - No Auth)\n')
    console.log('-'.repeat(60))

    const company = await prisma.company.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!company) {
      console.error('❌ No companies found in database')
      process.exit(1)
    }

    console.log(`Testing with: ${company.name} (${company.id})`)

    const serviceResult = await backofficeCompanyService.getCompanyDetails(company.id)

    if (!serviceResult) {
      console.error('❌ TEST 1 FAILED: Service returned null')
      allTestsPassed = false
    } else if (Object.keys(serviceResult).length === 0) {
      console.error('❌ TEST 1 FAILED: Service returned empty object')
      allTestsPassed = false
    } else {
      console.log(`✅ TEST 1 PASSED: Service returned ${Object.keys(serviceResult).length} properties`)

      // Validate critical properties
      const criticalProps = ['wallet', 'plan', 'metrics', 'billing']
      const missing = criticalProps.filter(prop => !serviceResult[prop as keyof typeof serviceResult])

      if (missing.length > 0) {
        console.error(`❌ Missing critical properties: ${missing.join(', ')}`)
        allTestsPassed = false
      } else {
        console.log(`✅ All critical properties present: ${criticalProps.join(', ')}`)
      }
    }

    // TEST 2: HTTP Endpoint (if token provided)
    if (AUTH0_TOKEN) {
      console.log('\n📋 TEST 2: HTTP Endpoint (With Auth)\n')
      console.log('-'.repeat(60))

      const endpoint = `${API_URL}/backoffice/companies/${company.id}`
      console.log(`Making request to: ${endpoint}`)

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH0_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      console.log(`Response status: ${response.status} ${response.statusText}`)

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ TEST 2 FAILED: HTTP request failed')
        console.error(JSON.stringify(data, null, 2))
        allTestsPassed = false
      } else if (!data.success) {
        console.error('❌ TEST 2 FAILED: Response success is false')
        allTestsPassed = false
      } else if (!data.data) {
        console.error('❌ TEST 2 FAILED: Response missing data property')
        allTestsPassed = false
      } else if (Object.keys(data.data).length === 0) {
        console.error('❌ TEST 2 FAILED: Response data is empty!')
        allTestsPassed = false
      } else {
        console.log(`✅ TEST 2 PASSED: HTTP endpoint returned ${Object.keys(data.data).length} properties`)

        // Validate critical properties
        const criticalProps = ['wallet', 'plan', 'metrics', 'billing']
        const missing = criticalProps.filter(prop => !data.data[prop])

        if (missing.length > 0) {
          console.error(`❌ Missing critical properties: ${missing.join(', ')}`)
          allTestsPassed = false
        } else {
          console.log(`✅ All critical properties present: ${criticalProps.join(', ')}`)
        }

        // Show summary
        console.log('\n📊 Response summary:')
        Object.keys(data.data).forEach(key => {
          const value = data.data[key]
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
      }
    } else {
      console.log('\n⏭️  TEST 2: SKIPPED (No AUTH0_TOKEN provided)\n')
      console.log('-'.repeat(60))
      console.log('To test HTTP endpoint, provide a valid Auth0 token:')
      console.log('   AUTH0_TOKEN=your_token npx tsx utility-tests/validate-fix.ts')
    }

    // FINAL RESULT
    console.log('\n' + '=' .repeat(60))
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!')
      console.log('\nThe fix is working correctly.')
      console.log('The endpoint now returns complete company details.')
    } else {
      console.log('❌ SOME TESTS FAILED!')
      console.log('\nPlease review the errors above.')
    }
    console.log('=' .repeat(60) + '\n')

    await prisma.$disconnect()
    process.exit(allTestsPassed ? 0 : 1)
  } catch (error) {
    console.error('\n❌ ERROR during validation:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

validateFix()
