import { IVoucherProvider } from '../interfaces/IVoucherProvider'
import { VoucherProviderType } from '../types'
import { TremendousAdapter } from '../adapters/tremendous/TremendousAdapter'

/**
 * Factory que cria instâncias de providers de vouchers
 *
 * Uso:
 * const provider = VoucherProviderFactory.create('tremendous')
 * const result = await provider.createVoucher(...)
 */
export class VoucherProviderFactory {
  private static instances: Map<string, IVoucherProvider> = new Map()

  /**
   * Cria ou retorna uma instância do provider
   *
   * Usa Singleton pattern: uma instância por provider
   *
   * @param type Tipo do provider
   * @returns Instância do provider
   */
  static create(type: string): IVoucherProvider {
    // Se já existe instância, reusar
    if (this.instances.has(type)) {
      return this.instances.get(type)!
    }

    // Criar nova instância
    let provider: IVoucherProvider

    switch (type.toLowerCase()) {
      case VoucherProviderType.TREMENDOUS:
        provider = new TremendousAdapter()
        break

      default:
        throw new Error(`Unsupported voucher provider: ${type}`)
    }

    // Cachear instância
    this.instances.set(type, provider)

    return provider
  }

  /**
   * Limpa o cache de instâncias (útil para testes)
   */
  static clearCache(): void {
    this.instances.clear()
  }
}
