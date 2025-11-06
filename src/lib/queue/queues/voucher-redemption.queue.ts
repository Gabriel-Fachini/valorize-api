import { Queue } from 'bullmq'
import { QueueManager } from '../QueueManager'

/**
 * Nome da fila (constante para evitar typos)
 */
export const VOUCHER_REDEMPTION_QUEUE = 'voucher-redemption'

/**
 * Estrutura de dados de um job de resgate de voucher
 *
 * Cada job terá essas informações:
 */
export interface VoucherRedemptionJob {
  voucherRedemptionId: string // ID do VoucherRedemption no banco
  redemptionId: string         // ID do Redemption pai
  userId: string               // Quem está resgatando
  amount: number               // Valor em reais (ex: 50.00)
  provider: string             // "tremendous", "giftty", etc
  productId: string            // ID do produto no provider
  recipientEmail: string       // Email para enviar o voucher
  recipientName: string        // Nome do destinatário
}

/**
 * Retorna a fila de voucher redemption
 *
 * Uso:
 * const queue = getVoucherRedemptionQueue()
 */
export function getVoucherRedemptionQueue(): Queue<VoucherRedemptionJob> {
  return QueueManager.getInstance().getQueue(VOUCHER_REDEMPTION_QUEUE)
}

/**
 * Adiciona um job na fila para resgatar um voucher
 *
 * Uso:
 * await addVoucherRedemptionJob({
 *   voucherRedemptionId: 'abc123',
 *   userId: 'user456',
 *   amount: 50.00,
 *   // ... outros campos
 * })
 *
 * @param data Dados do job
 * @returns Promise<Job>
 */
export async function addVoucherRedemptionJob(data: VoucherRedemptionJob) {
  const queue = getVoucherRedemptionQueue()

  // Adicionar job na fila
  return queue.add(
    'redeem-voucher', // Nome do tipo de job
    data,
    {
      jobId: data.voucherRedemptionId, // Usar ID como jobId para evitar duplicatas (idempotência!)
      // Se você tentar adicionar um job com o mesmo jobId, ele vai ignorar
    }
  )
}

/**
 * Retorna estatísticas da fila (útil para dashboard admin)
 */
export async function getVoucherRedemptionQueueStats() {
  return QueueManager.getInstance().getQueueStats(VOUCHER_REDEMPTION_QUEUE)
}
