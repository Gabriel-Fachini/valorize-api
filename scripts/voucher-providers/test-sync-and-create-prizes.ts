/**
 * Script de teste para sincronizar vouchers e criar Prizes
 * Testa a lógica idempotente de criação de Prizes
 *
 * Uso: npx tsx scripts/voucher-providers/test-sync-and-create-prizes.ts
 */

import axios from 'axios'

const API_BASE_URL = 'http://localhost:4000'
const TEST_EMAIL = 'gabriel.fachini@usevalorize.com.br'
const TEST_PASSWORD = 'V@alorize'

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

async function syncCatalog(token: string): Promise<any> {
  try {
    console.log('\n📤 Iniciando sincronização de catálogo...')

    const startTime = Date.now()

    const response = await axios.post(`${API_BASE_URL}/admin/voucher-products/sync`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const endTime = Date.now()
    const totalTimeMs = endTime - startTime

    console.log(`✅ Sincronização concluída em ${(totalTimeMs / 1000).toFixed(2)}s`)

    return {
      data: response.data,
      totalTimeMs,
    }
  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error.response?.data?.message || error.message)
    throw error
  }
}

function displayResult(response: any, totalTimeMs: number) {
  const result = response.data.result

  console.log('\n' + '='.repeat(70))
  console.log('📊 RESULTADO DA SINCRONIZAÇÃO')
  console.log('='.repeat(70))

  console.log('\n✅ Produtos VoucherProduct:')
  console.log(`   Sincronizados: ${result.syncedProducts}`)
  console.log(`   Desativados: ${result.deactivatedProducts}`)
  console.log(`   Total Ativos: ${result.totalActiveProducts}`)

  console.log('\n✨ Prizes Criados/Gerenciados:')
  console.log(`   Desativados (removidos do catálogo): ${result.deactivatedPrizes}`)

  console.log('\n⏱️  Tempo:')
  console.log(`   Tempo total: ${(totalTimeMs / 1000).toFixed(2)}s`)

  console.log('\n' + '='.repeat(70))
  console.log('🎉 Sincronização concluída com sucesso!')
  console.log('='.repeat(70) + '\n')
}

async function main() {
  try {
    console.log('🚀 Iniciando teste de sincronização de catálogo e criação de Prizes\n')

    const token = await login()
    const result = await syncCatalog(token)

    displayResult(result, result.totalTimeMs)

    console.log('💡 Dica: Execute este script novamente para verificar que:')
    console.log('   - Nenhum Prize duplicado é criado (idempotente)')
    console.log('   - Próximas execuções apenas reativam Prizes se necessário')
    console.log('')
  } catch (error: any) {
    console.error('\n🔴 Erro fatal:', error.message)
    process.exit(1)
  }
}

main()
