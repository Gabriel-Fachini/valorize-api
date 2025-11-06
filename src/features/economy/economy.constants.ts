/**
 * Constantes do Sistema Econômico
 *
 * Define as taxas de conversão entre diferentes unidades monetárias do sistema:
 * - Moedas (coins): Unidade interna de acúmulo de créditos
 * - BRL (Reais): Moeda real para pagamentos a empresas
 */

/**
 * Taxa de conversão de moedas para BRL
 * 1 moeda = R$ 0.06
 *
 * Exemplo:
 * - 100 moedas = R$ 6.00
 * - 1 moeda = R$ 0.06
 */
export const COIN_TO_BRL_RATE = 0.06

/**
 * Taxa de conversão de BRL para moedas
 * 1 real = 10 moedas
 *
 * Exemplo:
 * - R$ 1.00 = 10 moedas
 * - R$ 0.06 = 1 moeda
 */
export const BRL_TO_COIN_RATE = 10

/**
 * Constantes de economia agregadas
 * Útil para importações en massa ou aplicações que precisam acessar múltiplas constantes
 */
export const ECONOMY_CONSTANTS = {
  COIN_TO_BRL_RATE,
  BRL_TO_COIN_RATE,
} as const

export type EconomyConstant = keyof typeof ECONOMY_CONSTANTS
