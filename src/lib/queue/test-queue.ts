/**
 * Script de teste do sistema de filas
 *
 * Como executar:
 * 1. Certifique-se que o Redis está rodando: docker compose up -d redis
 * 2. Execute: npx tsx src/lib/queue/test-queue.ts
 *
 * O que esse script faz:
 * 1. Inicia o worker
 * 2. Adiciona um job dummy na fila
 * 3. O worker processa o job
 * 4. Mostra logs de sucesso ou retry (se falhar)
 */

import { logger } from '@/lib/logger'
import { startVoucherRedemptionWorker } from './workers/voucher-redemption.worker'
import { addVoucherRedemptionJob } from './queues/voucher-redemption.queue'
import { QueueManager } from './QueueManager'

async function testQueue() {
  logger.info('='.repeat(60))
  logger.info('🧪 Starting queue test...')
  logger.info('='.repeat(60))

  try {
    // 1. Iniciar o worker
    logger.info('Step 1: Starting worker...')
    const worker = startVoucherRedemptionWorker()

    // 2. Aguardar um pouco para o worker estar pronto
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 3. Adicionar um job dummy na fila
    logger.info('Step 2: Adding dummy job to queue...')
    const job = await addVoucherRedemptionJob({
      voucherRedemptionId: `test-${Date.now()}`,
      redemptionId: 'redemption-123',
      userId: 'user-456',
      amount: 50.0,
      provider: 'tremendous',
      productId: 'PROD-ABC123',
      recipientEmail: 'test@example.com',
      recipientName: 'Test User',
    })

    logger.info('Job added to queue!', {
      jobId: job.id,
      queueName: job.queueName,
    })

    // 4. Aguardar o processamento (job dummy demora 2 segundos)
    logger.info('Step 3: Waiting for job to be processed...')
    await job.waitUntilFinished(
      QueueManager.getInstance()['queueEvents'].get('voucher-redemption')!
    )

    logger.info('✅ Job processed successfully!')

    // 5. Mostrar estatísticas da fila
    logger.info('Step 4: Queue statistics...')
    const stats = await QueueManager.getInstance().getQueueStats(
      'voucher-redemption'
    )
    logger.info('Queue stats:', stats)

    logger.info('='.repeat(60))
    logger.info('✅ Test completed successfully!')
    logger.info('='.repeat(60))
  } catch (error: any) {
    logger.error('❌ Test failed', {
      error: error.message,
      stack: error.stack,
    })
  } finally {
    // 6. Fechar tudo
    logger.info('Closing connections...')
    await QueueManager.getInstance().close()
    logger.info('Connections closed. Exiting.')
    process.exit(0)
  }
}

// Executar teste
testQueue().catch((error) => {
  logger.error('Unhandled error in test', { error })
  process.exit(1)
})
