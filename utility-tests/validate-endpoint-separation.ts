/**
 * Validation script to verify endpoint separation
 *
 * Tests that specialized endpoints (wallet, billing, metrics) are properly
 * separated from the full company details endpoint
 *
 * Usage:
 * AUTH0_TOKEN=your_token npx tsx utility-tests/validate-endpoint-separation.ts
 */

import 'dotenv/config'
import prisma from '@/lib/database'

const API_URL = process.env.API_URL || 'http://localhost:8080'
const AUTH0_TOKEN = process.env.AUTH0_TOKEN

if (!AUTH0_TOKEN) {
  console.error('❌ ERROR: AUTH0_TOKEN environment variable is required')
  console.error('\nUsage:')
  console.error('  AUTH0_TOKEN=your_token npx tsx utility-tests/validate-endpoint-separation.ts')
  process.exit(1)
}

async function validateEndpointSeparation() {
  console.log('\n✅ VALIDATION: Backoffice Endpoint Separation\n')
  console.log('='.repeat(60))

  let allTestsPassed = true

  try {
    // Get a company ID
    const company = await prisma.company.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!company) {
      console.error('❌ No companies found in database')
      process.exit(1)
    }

    console.log(`\nTesting with: ${company.name} (${company.id})\n`)

    // TEST 1: Full Company Details Endpoint
    console.log('📋 TEST 1: Full Company Details Endpoint\n')
    console.log('-'.repeat(60))

    const detailsEndpoint = `${API_URL}/backoffice/companies/${company.id}`
    console.log(`GET ${detailsEndpoint}`)

    const detailsResponse = await fetch(detailsEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH0_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`Status: ${detailsResponse.status} ${detailsResponse.statusText}`)

    const detailsData = await detailsResponse.json()

    if (!detailsResponse.ok) {
      console.error('❌ TEST 1 FAILED: Request failed')
      console.error(JSON.stringify(detailsData, null, 2))
      allTestsPassed = false
    } else if (!detailsData.success || !detailsData.data) {
      console.error('❌ TEST 1 FAILED: Invalid response structure')
      allTestsPassed = false
    } else {
      console.log(`✅ TEST 1 PASSED: Returned ${Object.keys(detailsData.data).length} properties`)

      // Check for expected properties
      const expectedProps = ['id', 'name', 'wallet', 'plan', 'metrics', 'billing']
      const missing = expectedProps.filter(prop => !detailsData.data[prop])

      if (missing.length > 0) {
        console.error(`❌ Missing expected properties: ${missing.join(', ')}`)
        allTestsPassed = false
      } else {
        console.log(`✅ All expected properties present`)
      }
    }

    // TEST 2: Wallet Endpoint (Specialized)
    console.log('\n📋 TEST 2: Wallet Endpoint (Specialized)\n')
    console.log('-'.repeat(60))

    const walletEndpoint = `${API_URL}/backoffice/companies/${company.id}/wallet`
    console.log(`GET ${walletEndpoint}`)

    const walletResponse = await fetch(walletEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH0_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`Status: ${walletResponse.status} ${walletResponse.statusText}`)

    const walletData = await walletResponse.json()

    if (!walletResponse.ok) {
      console.error('❌ TEST 2 FAILED: Request failed')
      console.error(JSON.stringify(walletData, null, 2))
      allTestsPassed = false
    } else if (!walletData.success || !walletData.data) {
      console.error('❌ TEST 2 FAILED: Invalid response structure')
      allTestsPassed = false
    } else {
      console.log(`✅ TEST 2 PASSED: Returned wallet data`)

      // Validate it's wallet-specific (should NOT have company info)
      if (walletData.data.name || walletData.data.domain) {
        console.error('❌ WARNING: Wallet endpoint returning company properties (not properly separated)')
        allTestsPassed = false
      }

      // Should have wallet-specific properties
      const walletProps = ['balance', 'totalDeposited', 'burnRate']
      const missingWallet = walletProps.filter(prop => walletData.data[prop] === undefined)

      if (missingWallet.length > 0) {
        console.error(`❌ Missing wallet properties: ${missingWallet.join(', ')}`)
        allTestsPassed = false
      } else {
        console.log(`✅ Wallet properties present: ${walletProps.join(', ')}`)
      }
    }

    // TEST 3: Billing Endpoint (Specialized)
    console.log('\n📋 TEST 3: Billing Endpoint (Specialized)\n')
    console.log('-'.repeat(60))

    const billingEndpoint = `${API_URL}/backoffice/companies/${company.id}/billing`
    console.log(`GET ${billingEndpoint}`)

    const billingResponse = await fetch(billingEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH0_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`Status: ${billingResponse.status} ${billingResponse.statusText}`)

    const billingData = await billingResponse.json()

    if (!billingResponse.ok) {
      console.error('❌ TEST 3 FAILED: Request failed')
      console.error(JSON.stringify(billingData, null, 2))
      allTestsPassed = false
    } else if (!billingData.success || !billingData.data) {
      console.error('❌ TEST 3 FAILED: Invalid response structure')
      allTestsPassed = false
    } else {
      console.log(`✅ TEST 3 PASSED: Returned billing data`)

      // Validate it's billing-specific
      if (billingData.data.name || billingData.data.domain) {
        console.error('❌ WARNING: Billing endpoint returning company properties (not properly separated)')
        allTestsPassed = false
      }

      // Should have billing-specific properties
      const billingProps = ['currentMRR', 'activeUsers']
      const missingBilling = billingProps.filter(prop => billingData.data[prop] === undefined)

      if (missingBilling.length > 0) {
        console.error(`❌ Missing billing properties: ${missingBilling.join(', ')}`)
        allTestsPassed = false
      } else {
        console.log(`✅ Billing properties present: ${billingProps.join(', ')}`)
      }
    }

    // TEST 4: Metrics Endpoint (Specialized)
    console.log('\n📋 TEST 4: Metrics Endpoint (Specialized)\n')
    console.log('-'.repeat(60))

    const metricsEndpoint = `${API_URL}/backoffice/companies/${company.id}/metrics`
    console.log(`GET ${metricsEndpoint}`)

    const metricsResponse = await fetch(metricsEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH0_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`Status: ${metricsResponse.status} ${metricsResponse.statusText}`)

    const metricsData = await metricsResponse.json()

    if (!metricsResponse.ok) {
      console.error('❌ TEST 4 FAILED: Request failed')
      console.error(JSON.stringify(metricsData, null, 2))
      allTestsPassed = false
    } else if (!metricsData.success || !metricsData.data) {
      console.error('❌ TEST 4 FAILED: Invalid response structure')
      allTestsPassed = false
    } else {
      console.log(`✅ TEST 4 PASSED: Returned metrics data`)

      // Validate it's metrics-specific
      if (metricsData.data.name || metricsData.data.domain) {
        console.error('❌ WARNING: Metrics endpoint returning company properties (not properly separated)')
        allTestsPassed = false
      }

      // Should have metrics-specific properties
      const metricsProps = ['users', 'compliments', 'engagement']
      const missingMetrics = metricsProps.filter(prop => !metricsData.data[prop])

      if (missingMetrics.length > 0) {
        console.error(`❌ Missing metrics properties: ${missingMetrics.join(', ')}`)
        allTestsPassed = false
      } else {
        console.log(`✅ Metrics properties present: ${metricsProps.join(', ')}`)
      }
    }

    // TEST 5: Data Consistency Comparison
    console.log('\n📋 TEST 5: Data Consistency Between Endpoints\n')
    console.log('-'.repeat(60))

    if (detailsData.success && walletData.success && billingData.success && metricsData.success) {
      // Compare wallet data
      if (JSON.stringify(detailsData.data.wallet) === JSON.stringify(walletData.data)) {
        console.log('✅ Wallet data is consistent between endpoints')
      } else {
        console.error('❌ Wallet data mismatch between full details and wallet endpoint')
        console.error('\nFull details wallet:')
        console.error(JSON.stringify(detailsData.data.wallet, null, 2))
        console.error('\nWallet endpoint:')
        console.error(JSON.stringify(walletData.data, null, 2))
        allTestsPassed = false
      }

      // Compare billing data
      if (JSON.stringify(detailsData.data.billing) === JSON.stringify(billingData.data)) {
        console.log('✅ Billing data is consistent between endpoints')
      } else {
        console.error('❌ Billing data mismatch between full details and billing endpoint')
        console.error('\nFull details billing:')
        console.error(JSON.stringify(detailsData.data.billing, null, 2))
        console.error('\nBilling endpoint:')
        console.error(JSON.stringify(billingData.data, null, 2))
        allTestsPassed = false
      }

      // Compare metrics data
      if (JSON.stringify(detailsData.data.metrics) === JSON.stringify(metricsData.data)) {
        console.log('✅ Metrics data is consistent between endpoints')
      } else {
        console.error('❌ Metrics data mismatch between full details and metrics endpoint')
        console.error('\nFull details metrics:')
        console.error(JSON.stringify(detailsData.data.metrics, null, 2))
        console.error('\nMetrics endpoint:')
        console.error(JSON.stringify(metricsData.data, null, 2))
        allTestsPassed = false
      }
    } else {
      console.log('⏭️  Skipping consistency check (some endpoints failed)')
    }

    // FINAL RESULT
    console.log('\n' + '='.repeat(60))
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!')
      console.log('\nEndpoint separation is working correctly:')
      console.log('  • Full details endpoint includes all data (wallet, billing, metrics)')
      console.log('  • Specialized endpoints return ONLY their specific data')
      console.log('  • Data is consistent across endpoints')
    } else {
      console.log('❌ SOME TESTS FAILED!')
      console.log('\nPlease review the errors above.')
    }
    console.log('='.repeat(60) + '\n')

    await prisma.$disconnect()
    process.exit(allTestsPassed ? 0 : 1)
  } catch (error) {
    console.error('\n❌ ERROR during validation:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

validateEndpointSeparation()
