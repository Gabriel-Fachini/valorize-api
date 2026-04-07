/**
 * Script de teste para Bulk Redemption
 * Testa a funcionalidade de envio de vouchers em lote (100 usuários)
 *
 * Uso: npx tsx scripts/voucher-providers/test-bulk-redemption.ts
 */

import axios from 'axios'

const API_BASE_URL = 'http://localhost:4000'
const TEST_EMAIL = 'gabriel.fachini@usevalorize.com.br'
const TEST_PASSWORD = 'V@alorize'
const TEST_USER_ID = 'cmhnjq22m002rtpnjhr75eeda'

interface TestStats {
  totalItems: number
  successCount: number
  failureCount: number
  successRate: number
  errorRate: number
  totalTimeMs: number
  totalTimeSec: number
  averageTimePerItem: number
  estimatedVsActual: {
    estimatedTimeSec: number
    actualTimeSec: number
    difference: number
  }
}

async function login(): Promise<string> {
  try {
    console.log('🔐 Fazendo login...')
    const response = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })

    const token = response.data.data.access_token
    console.log('✅ Login bem-sucedido!')
    return token
  } catch (error: any) {
    console.error('❌ Erro no login:', error.response?.data?.message || error.message)
    throw error
  }
}

function generateTestItems(count: number = 100) {
  const prizeId = 'cmhnjz99r000ltpz2swb6t1g5'

  const items = []
  for (let i = 1; i <= count; i++) {
    items.push({
      userId: TEST_USER_ID,
      prizeId,
    })
  }

  return items
}

async function bulkRedeem(token: string, items: any[]): Promise<any> {
  try {
    console.log(`\n📤 Enviando ${items.length} itens para bulk redemption...`)

    const startTime = Date.now()

    const response = await axios.post(`${API_BASE_URL}/redemptions/bulk-redeem`, {
      items,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const endTime = Date.now()
    const totalTimeMs = endTime - startTime

    console.log(`✅ Requisição concluída em ${(totalTimeMs / 1000).toFixed(2)}s`)

    return {
      data: response.data,
      totalTimeMs,
    }
  } catch (error: any) {
    console.error('❌ Erro na requisição bulk:', error.response?.data?.message || error.message)
    throw error
  }
}

function displayStats(response: any, totalTimeMs: number): TestStats {
  const summary = response.data.summary
  const results = response.data.results

  const totalItems = summary.total
  const successCount = summary.successful
  const failureCount = summary.failed
  const successRate = ((successCount / totalItems) * 100).toFixed(2)
  const errorRate = ((failureCount / totalItems) * 100).toFixed(2)
  const totalTimeSec = (totalTimeMs / 1000).toFixed(2)
  const averageTimePerItem = (totalTimeMs / totalItems).toFixed(2)

  const estimatedTimeSec = totalItems <= 10 ? 2 : (Math.ceil(totalItems / 10) * 2 + (Math.ceil(totalItems / 10) - 1) * 1)

  const stats: TestStats = {
    totalItems,
    successCount,
    failureCount,
    successRate: parseFloat(successRate),
    errorRate: parseFloat(errorRate),
    totalTimeMs,
    totalTimeSec: parseFloat(totalTimeSec),
    averageTimePerItem: parseFloat(averageTimePerItem),
    estimatedVsActual: {
      estimatedTimeSec,
      actualTimeSec: parseFloat(totalTimeSec),
      difference: parseFloat(totalTimeSec) - estimatedTimeSec,
    },
  }

  console.log('\n' + '='.repeat(70))
  console.log('📊 ESTATÍSTICAS DE BULK REDEMPTION')
  console.log('='.repeat(70))

  console.log('\n📈 Resumo:')
  console.log(`   Total de itens:      ${totalItems}`)
  console.log(`   ✅ Sucessos:         ${successCount} (${successRate}%)`)
  console.log(`   ❌ Falhas:           ${failureCount} (${errorRate}%)`)

  console.log('\n⏱️  Tempo:')
  console.log(`   Tempo total:         ${totalTimeSec}s`)
  console.log(`   Tempo por item:      ${averageTimePerItem}ms`)
  console.log(`   Estimado (teórico):  ${estimatedTimeSec}s`)
  console.log(`   Diferença:           ${stats.estimatedVsActual.difference > 0 ? '+' : ''}${stats.estimatedVsActual.difference.toFixed(2)}s`)

  console.log('\n📋 Detalhes de Falhas:')
  const failedItems = results.filter((r: any) => !r.success)
  if (failedItems.length === 0) {
    console.log('   Nenhuma falha! 🎉')
  } else {
    const errorCounts: { [key: string]: number } = {}
    failedItems.forEach((item: any) => {
      const error = item.error || 'Unknown error'
      errorCounts[error] = (errorCounts[error] || 0) + 1
    })

    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`   - ${error}: ${count}`)
    })
  }

  console.log('\n' + '='.repeat(70))
  console.log('✨ Teste concluído!')
  console.log('='.repeat(70) + '\n')

  return stats
}

async function main() {
  try {
    console.log('🚀 Iniciando teste de Bulk Redemption\n')

    const token = await login()
    const items = generateTestItems(100)
    console.log(`\n📝 Gerados ${items.length} items de teste`)
    console.log(`   Usando userId: ${TEST_USER_ID}`)
    console.log(`   Exemplo: ${JSON.stringify(items[0], null, 2)}`)

    const result = await bulkRedeem(token, items)
    const stats = displayStats(result, result.totalTimeMs)

    const filename = `/tmp/bulk-redemption-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const fs = await import('fs').then(m => m.promises)
    await fs.writeFile(filename, JSON.stringify({ stats, response: result.data }, null, 2))
    console.log(`📁 Resultado salvo em: ${filename}\n`)
  } catch (error: any) {
    console.error('\n🔴 Erro fatal:', error.message)
    process.exit(1)
  }
}

main()
