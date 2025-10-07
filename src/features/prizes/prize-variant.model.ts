import { PrizeVariant, Prisma } from '@prisma/client'

// Usa os tipos "Unchecked" do Prisma que trabalham com IDs diretos (não relações)
export type CreatePrizeVariantData = Prisma.PrizeVariantUncheckedCreateInput
export type CreatePrizeVariantInput = Omit<CreatePrizeVariantData, 'prizeId'>
export type UpdatePrizeVariantData = Prisma.PrizeVariantUncheckedUpdateInput

export class PrizeVariantModel {
  constructor(public data: PrizeVariant) {}

  // Simple getters (proxy only, no logic)
  get id() { return this.data.id }
  get prizeId() { return this.data.prizeId }
  get name() { return this.data.name }
  get value() { return this.data.value }
  get stock() { return this.data.stock }
  get isActive() { return this.data.isActive }

  toJSON() {
    return {
      id: this.id,
      prizeId: this.prizeId,
      name: this.name,
      value: this.value,
      stock: this.stock,
      isActive: this.isActive,
    }
  }
}

