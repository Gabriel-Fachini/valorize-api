import { Worker, Job } from 'bullmq'
import { QueueManager } from '../QueueManager'
import {
  VOUCHER_REDEMPTION_QUEUE,
  VoucherRedemptionJob,
} from '../queues/voucher-redemption.queue'
import { processVoucherRedemption } from '../processors/voucher-redemption.processor'
import { logger } from '@/lib/logger'

/**
 * Worker - "Robozinho" que processa jobs da fila de voucher redemption
 *
 * O que ele faz:
 * 1. Fica em loop infinito esperando jobs na fila
 * 2. Quando chega um job, chama o processor
 * 3. Se o processor retornar sucesso, marca job como completo
 * 4. Se o processor lançar erro, BullMQ faz retry automático
 * 5. Após 5 tentativas, job vai para "failed" (Dead Letter Queue)
 *
 * Configurações:
 * - concurrency: 5 → Processa até 5 jobs ao mesmo tempo
 * - limiter: Limite de taxa (evita sobrecarregar APIs externas)
 */
export function startVoucherRedemptionWorker(): Worker {
  const queueManager = QueueManager.getInstance()

  logger.info('Starting voucher redemption worker...')

  const worker = new Worker<VoucherRedemptionJob>(
    VOUCHER_REDEMPTION_QUEUE,
    async (job: Job<VoucherRedemptionJob>) => {
      logger.info('Worker picked up job', {
        jobId: job.id,
        attemptsMade: job.attemptsMade,
        attemptsTotal: job.opts.attempts ?? 5,
        data: job.data,
      })

      // Chamar o processor
      const result = await processVoucherRedemption(job.data)

      return result
    },
    {
      connection: queueManager['connection'], // Reusar conexão do QueueManager
      concurrency: 5, // Processar até 5 jobs simultaneamente
      limiter: {
        max: 10, // Máximo 10 jobs...
        duration: 1000, // ...por segundo (rate limiting)
      },
    },
  )

  // Event: Job completou com sucesso
  worker.on('completed', (job, result) => {
    logger.info('Job completed successfully', {
      jobId: job.id,
      voucherRedemptionId: job.data.voucherRedemptionId,
      result,
    })
  })

  // Event: Job falhou
  worker.on('failed', (job, err) => {
    logger.error('Job failed', {
      jobId: job?.id,
      voucherRedemptionId: job?.data?.voucherRedemptionId,
      attemptsMade: job?.attemptsMade,
      error: err.message,
      stack: err.stack,
    })

    // Se falhou todas as 5 tentativas, é falha definitiva
    if (job && job.attemptsMade >= (job.opts.attempts ?? 5)) {
      logger.error('Job failed definitively (no more retries)', {
        jobId: job.id,
        voucherRedemptionId: job.data.voucherRedemptionId,
      })

      // TODO (FASE 4): Notificar admin sobre falha definitiva
      // TODO (FASE 4): Atualizar status no banco para "failed"
    }
  })

  // Event: Worker está ativo
  worker.on('active', (job) => {
    logger.info('Job started processing', {
      jobId: job.id,
      voucherRedemptionId: job.data.voucherRedemptionId,
    })
  })

  // Event: Worker pausou (por algum motivo)
  worker.on('paused', () => {
    logger.warn('Worker paused')
  })

  // Event: Worker resumiu
  worker.on('resumed', () => {
    logger.info('Worker resumed')
  })

  // Event: Erro interno do worker
  worker.on('error', (err) => {
    logger.error('Worker error', { error: err })
  })

  // Registrar worker no QueueManager
  queueManager.registerWorker(VOUCHER_REDEMPTION_QUEUE, worker)

  logger.info('Voucher redemption worker started successfully', {
    concurrency: 5,
    queue: VOUCHER_REDEMPTION_QUEUE,
  })

  return worker
}
