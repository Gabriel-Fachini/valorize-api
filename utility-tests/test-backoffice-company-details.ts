/**
 * Test script for backoffice company details endpoint
 *
 * Usage:
 * 1. Set AUTH0_TOKEN in .env or pass as environment variable
 * 2. Set COMPANY_ID in .env or pass as environment variable
 * 3. Run: npx tsx utility-tests/test-backoffice-company-details.ts
 *
 * Or pass inline:
 * AUTH0_TOKEN=your_token COMPANY_ID=company_id npx tsx utility-tests/test-backoffice-company-details.ts
 */

import 'dotenv/config'

const API_URL = process.env.API_URL || 'http://localhost:8080'
const AUTH0_TOKEN = process.env.AUTH0_TOKEN
const COMPANY_ID = process.env.COMPANY_ID

async function testCompanyDetails() {
  console.log('\n🧪 Testing Backoffice Company Details Endpoint\n')
  console.log('=' .repeat(60))

  // Validate environment variables
  console.log('\n🔑 Configuration:')
  console.log(`   API_URL: ${API_URL}`)
  console.log(`   AUTH0_TOKEN: ${AUTH0_TOKEN ? '✅ Configured' : '❌ Missing'}`)
  console.log(`   COMPANY_ID: ${COMPANY_ID || '❌ Missing'}`)

  if (!AUTH0_TOKEN) {
    console.error('\n❌ Error: AUTH0_TOKEN is required')
    console.log('\nPlease set it in .env or pass as environment variable:')
    console.log('   AUTH0_TOKEN=your_token npx tsx utility-tests/test-backoffice-company-details.ts')
    process.exit(1)
  }

  if (!COMPANY_ID) {
    console.error('\n❌ Error: COMPANY_ID is required')
    console.log('\nPlease set it in .env or pass as environment variable:')
    console.log('   COMPANY_ID=company_id npx tsx utility-tests/test-backoffice-company-details.ts')
    process.exit(1)
  }

  try {
    const endpoint = `${API_URL}/backoffice/companies/${COMPANY_ID}`
    console.log(`\n📡 Making request to: ${endpoint}`)

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH0_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`\n📊 Response status: ${response.status} ${response.statusText}`)

    const data = await response.json()

    if (!response.ok) {
      console.error('\n❌ Request failed:')
      console.error(JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log('\n✅ Response received successfully!')
    console.log('\n📦 Response structure:')
    console.log(JSON.stringify(data, null, 2))

    // Validate response structure
    console.log('\n🔍 Validating response structure...')

    if (!data.success) {
      console.error('❌ Response missing "success" property or it is false')
    } else {
      console.log('✅ success: true')
    }

    if (!data.data) {
      console.error('❌ Response missing "data" property')
    } else if (Object.keys(data.data).length === 0) {
      console.error('❌ "data" property is empty!')
    } else {
      console.log(`✅ "data" property contains ${Object.keys(data.data).length} properties`)
      console.log('\n📋 Data properties:')
      Object.keys(data.data).forEach(key => {
        const value = data.data[key]
        const type = Array.isArray(value) ? 'array' : typeof value
        const info = Array.isArray(value) ? `(${value.length} items)` : ''
        console.log(`   - ${key}: ${type} ${info}`)
      })
    }

    console.log('\n' + '=' .repeat(60))
    console.log('✅ Test completed!')

  } catch (error) {
    console.error('\n❌ Error during test:')
    console.error(error)
    process.exit(1)
  }
}

// Run test
testCompanyDetails()
