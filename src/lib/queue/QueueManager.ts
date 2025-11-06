import { Queue, Worker, QueueEvents } from 'bullmq'
import { Redis } from 'ioredis'
import { logger } from '@/lib/logger'

/**
 * QueueManager - Singleton que gerencia todas as filas do sistema
 *
 * O que ele faz:
 * 1. Cria UMA conexão com Redis (compartilhada por todas as filas)
 * 2. Permite criar múltiplas filas (vouchers, emails, etc.)
 * 3. Gerencia workers (processadores de jobs)
 * 4. Fecha tudo gracefully quando o app desligar
 */
export class QueueManager {
  private static instance: QueueManager
  private connection: Redis
  private queues: Map<string, Queue> = new Map()
  private workers: Map<string, Worker> = new Map()
  private queueEvents: Map<string, QueueEvents> = new Map()

  private constructor() {
    // Configuração da conexão Redis
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null, // IMPORTANTE: BullMQ precisa disso
      enableReadyCheck: false,
    }

    logger.info('Connecting to Redis', {
      host: redisConfig.host,
      port: redisConfig.port
    })

    // Criar conexão Redis
    this.connection = new Redis(redisConfig)

    // Monitorar eventos da conexão
    this.connection.on('connect', () => {
      logger.info('Redis connected successfully')
    })

    this.connection.on('error', (err) => {
      logger.error('Redis connection error', { error: err })
    })

    this.connection.on('close', () => {
      logger.warn('Redis connection closed')
    })
  }

  /**
   * Singleton pattern - sempre retorna a mesma instância
   */
  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager()
    }
    return QueueManager.instance
  }

  /**
   * Cria ou retorna uma fila existente
   *
   * @param name Nome da fila (ex: 'voucher-redemption')
   * @returns Queue instance
   */
  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      logger.info(`Creating queue: ${name}`)

      const queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 5, // Tentar 5 vezes antes de desistir
          backoff: {
            type: 'exponential',
            delay: 60000, // Começa com 1 minuto, depois 2min, 4min, 8min, 16min
          },
          removeOnComplete: {
            count: 100, // Manter últimos 100 jobs completos (para debug)
            age: 24 * 3600, // Remover jobs com mais de 24h
          },
          removeOnFail: {
            count: 500, // Manter últimos 500 jobs falhos (para análise)
          },
        },
      })

      this.queues.set(name, queue)

      // Criar QueueEvents para monitorar (opcional, mas útil para logs)
      const queueEvents = new QueueEvents(name, {
        connection: this.connection.duplicate(), // Precisa de conexão separada
      })

      queueEvents.on('completed', ({ jobId }) => {
        logger.info(`Job completed`, { queue: name, jobId })
      })

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        logger.error(`Job failed`, { queue: name, jobId, reason: failedReason })
      })

      this.queueEvents.set(name, queueEvents)
    }

    return this.queues.get(name)!
  }

  /**
   * Registra um worker para processar jobs de uma fila
   */
  registerWorker(name: string, worker: Worker): void {
    this.workers.set(name, worker)
    logger.info(`Worker registered for queue: ${name}`)
  }

  /**
   * Fecha todas as conexões (usado quando o app desligar)
   */
  async close(): Promise<void> {
    logger.info('Closing QueueManager...')

    // Fechar todos os workers
    await Promise.all(
      Array.from(this.workers.values()).map((worker) => worker.close())
    )

    // Fechar todas as filas
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close())
    )

    // Fechar queue events
    await Promise.all(
      Array.from(this.queueEvents.values()).map((qe) => qe.close())
    )

    // Fechar conexão Redis
    await this.connection.quit()

    logger.info('QueueManager closed successfully')
  }

  /**
   * Retorna estatísticas de uma fila (útil para debug)
   */
  async getQueueStats(name: string) {
    const queue = this.getQueue(name)

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ])

    return {
      name,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    }
  }
}
