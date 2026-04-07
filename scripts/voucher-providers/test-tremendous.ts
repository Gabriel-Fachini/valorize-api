/**
 * Script de teste para validar integração com Tremendous
 *
 * Uso:
 * 1. Configure o TREMENDOUS_API_KEY no .env
 * 2. Execute: npx tsx scripts/voucher-providers/test-tremendous.ts
 */

import 'dotenv/config'

import { VoucherProviderFactory } from '../../src/lib/voucher-providers/factory/VoucherProviderFactory'

async function testTremendous() {
  console.log('\n🧪 Testing Tremendous Integration\n')
  console.log('='.repeat(60))

  console.log('\n🔑 Environment variables:')
  console.log(`   TREMENDOUS_API_KEY: ${process.env.TREMENDOUS_API_KEY ? '✅ Configured' : '❌ Missing'}`)
  console.log(`   TREMENDOUS_BASE_URL: ${process.env.TREMENDOUS_BASE_URL ?? 'Using default'}`)
  console.log(`   TREMENDOUS_FUNDING_SOURCE_ID: ${process.env.TREMENDOUS_FUNDING_SOURCE_ID ?? 'Using default'}`)

  try {
    console.log('\n📦 Step 1: Creating Tremendous adapter...')
    const tremendous = VoucherProviderFactory.create('tremendous')
    console.log(`✅ Adapter created: ${tremendous.getName()}`)

    console.log('\n📋 Step 2: Listing available products...')
    const products = await tremendous.listProducts({
      country: 'BR',
      currency: 'BRL',
    })

    console.log(`✅ Found ${products.length} products for Brazil (BRL)`)

    if (products.length > 0) {
      console.log('\n📦 Sample products:')
      products.slice(0, 5).forEach((product, index) => {
        console.log(`\n  ${index + 1}. ${product.name}`)
        console.log(`     ID: ${product.id}`)
        console.log(`     Category: ${product.category}`)
        console.log(`     Brand: ${product.brand || 'N/A'}`)
        console.log(`     Value range: ${product.currency} ${product.minValue} - ${product.maxValue}`)
      })
    }

    if (products.length > 0) {
      const firstProduct = products[0]
      console.log(`\n🔍 Step 3: Getting product details for: ${firstProduct.id}`)
      const product = await tremendous.getProduct(firstProduct.id)

      if (product) {
        console.log('✅ Product found:')
        console.log(`   Name: ${product.name}`)
        console.log(`   Description: ${product.description || 'N/A'}`)
        console.log(`   Countries: ${product.countries.join(', ')}`)
      }
    }

    console.log('\n💳 Step 4: Creating test voucher...')
    const voucherResult = await tremendous.createVoucher({
      externalId: `test-${Date.now()}`,
      productId: products[0].id,
      amount: 60.0,
      currency: 'BRL',
      recipient: {
        name: 'Test User',
        email: 'test@example.com',
      },
    })

    console.log('✅ Voucher created successfully!')
    console.log(`   Order ID: ${voucherResult.orderId}`)
    console.log(`   Reward ID: ${voucherResult.rewardId}`)
    console.log(`   Link: ${voucherResult.link}`)
    console.log(`   Code: ${voucherResult.code || 'N/A'}`)

    console.log('\n' + '='.repeat(60))
    console.log('✅ All tests passed!')
    console.log('='.repeat(60) + '\n')
  } catch (error: any) {
    console.error('\n❌ Test failed:')
    console.error(`   Error: ${error.message}`)
    if (error.tremendousErrors) {
      console.error('   Tremendous errors:', JSON.stringify(error.tremendousErrors, null, 2))
    }
    console.error('\n' + '='.repeat(60) + '\n')
    process.exit(1)
  }
}

testTremendous()
  .then(() => {
    console.log('✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
