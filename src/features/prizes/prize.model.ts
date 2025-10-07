import { Prize, PrizeVariant, Prisma } from '@prisma/client'

// Usa os tipos "Unchecked" do Prisma que trabalham com IDs diretos (não relações)
export type CreatePrizeData = Prisma.PrizeUncheckedCreateInput
export type UpdatePrizeData = Prisma.PrizeUncheckedUpdateInput

// Tipo que aceita Prize com ou sem relações
export type PrizeWithRelations = Prize & {
  variants?: PrizeVariant[]
}

export class PrizeModel {
  constructor(public data: PrizeWithRelations) {}

  // Simple getters (proxy only, no logic)
  get id() { return this.data.id }
  get companyId() { return this.data.companyId }
  get name() { return this.data.name }
  get description() { return this.data.description }
  get category() { return this.data.category }
  get images() { return this.data.images }
  get coinPrice() { return this.data.coinPrice }
  get brand() { return this.data.brand }
  get specifications() { return this.data.specifications }
  get stock() { return this.data.stock }
  get isActive() { return this.data.isActive }
  get createdAt() { return this.data.createdAt }
  get updatedAt() { return this.data.updatedAt }
  get variants() { return this.data.variants ?? [] }

  toJSON() {
    return {
      id: this.id,
      companyId: this.companyId,
      name: this.name,
      description: this.description,
      category: this.category,
      images: this.images,
      coinPrice: this.coinPrice,
      brand: this.brand,
      specifications: this.specifications,
      stock: this.stock,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      variants: this.variants,
    }
  }
}

