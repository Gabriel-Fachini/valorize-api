/**
 * Script de teste para validar envio de voucher via EMAIL
 *
 * Uso:
 * 1. Configure o TREMENDOUS_API_KEY no .env
 * 2. Execute: npx tsx scripts/voucher-providers/test-tremendous-email.ts
 */

import 'dotenv/config'

import { TremendousAdapter } from '../../src/lib/voucher-providers/adapters/tremendous/TremendousAdapter'

async function testTremendousEmail() {
  console.log('\n📧 Testing Tremendous Email Delivery\n')
  console.log('='.repeat(60))

  console.log('\n🔑 Environment variables:')
  console.log(`   TREMENDOUS_API_KEY: ${process.env.TREMENDOUS_API_KEY ? '✅ Configured' : '❌ Missing'}`)
  console.log(`   TREMENDOUS_BASE_URL: ${process.env.TREMENDOUS_BASE_URL ?? 'Using default'}`)
  console.log(`   TREMENDOUS_FUNDING_SOURCE_ID: ${process.env.TREMENDOUS_FUNDING_SOURCE_ID ?? 'Using default'}`)

  try {
    console.log('\n📦 Step 1: Creating Tremendous adapter...')
    const tremendous = new TremendousAdapter()
    console.log(`✅ Adapter created: ${tremendous.getName()}`)

    console.log('\n📋 Step 2: Listing available products for Brazil...')
    const products = await tremendous.listProducts({
      country: 'BR',
      currency: 'BRL',
    })

    console.log(`✅ Found ${products.length} products for Brazil (BRL)`)

    if (products.length === 0) {
      throw new Error('No products found for Brazil')
    }

    const product = products[1]
    console.log('\n📦 Selected product:')
    console.log(`   Name: ${product.name}`)
    console.log(`   ID: ${product.id}`)
    console.log(`   Category: ${product.category}`)
    console.log(`   Value range: ${product.currency} ${product.minValue} - ${product.maxValue}`)

    const CAMPAIGN_ID = '8IJ7H3VPC766'

    console.log('\n📧 Step 3: Creating voucher with EMAIL delivery...')
    console.log('   Recipient: gabriel.fachini@usevalorize.com.br')
    console.log('   Amount: R$ 60.00')
    console.log(`   Campaign ID: ${CAMPAIGN_ID}`)

    const voucherResult = await tremendous.createVoucherViaEmail({
      externalId: `test-email-${Date.now()}`,
      productId: product.id,
      amount: 10.0,
      currency: 'BRL',
      recipient: {
        name: 'Gabriel Fachini',
        email: 'gabriel.fachini@usevalorize.com.br',
      },
      campaignId: CAMPAIGN_ID,
    })

    console.log('✅ Voucher created and email queued!')
    console.log(`   Order ID: ${voucherResult.orderId}`)
    console.log(`   Reward ID: ${voucherResult.rewardId}`)
    console.log('   Status: Email delivery in progress (asynchronous)')
    console.log('   ℹ️  Check your email at gabriel.fachini@usevalorize.com.br')

    console.log('\n' + '='.repeat(60))
    console.log('✅ Test completed!')
    console.log('\n📬 Expected behavior:')
    console.log('   1. Tremendous will send an email to gabriel.fachini@usevalorize.com.br')
    console.log(`   2. Email will use your custom campaign template (ID: ${CAMPAIGN_ID})`)
    console.log('   3. Email contains a link to redeem the voucher')
    console.log('   4. When you click the link, you can claim the code')
    console.log('   5. The actual gift card code is generated when you click "Redeem"')
    console.log('   6. This generation takes 1-2 minutes (normal behavior)')
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

testTremendousEmail()
  .then(() => {
    console.log('✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
