/**
 * Prize seeder - creates prizes and their variants
 */

import { Prisma } from '@prisma/client'
import { BaseSeeder } from './base.seeder'
import { 
  GLOBAL_PRIZES,
  VALORIZE_COMPANY_PRIZES,
} from '../data/prizes'
import { VALORIZE_COMPANY_ID } from '../data/compliments'

export class PrizeSeeder extends BaseSeeder {
  protected get name(): string {
    return 'prizes'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    // Get Valorize company
    const valorizeCompany = await this.prisma.company.findFirst({
      where: { id: VALORIZE_COMPANY_ID },
    })
    
    if (!valorizeCompany) {
      this.logWarning('Valorize company not found, skipping company-specific prizes')
    }
    
    let globalPrizeCount = 0
    let companyPrizeCount = 0
    let variantCount = 0
    
    // Create global prizes (available to all companies)
    for (const prizeData of GLOBAL_PRIZES) {
      const variants = prizeData.variants || []
      
      const prize = await this.prisma.prize.create({
        data: {
          companyId: null, // null means global prize
          name: prizeData.name,
          description: prizeData.description,
          category: prizeData.category,
          images: prizeData.images,
          coinPrice: prizeData.coinPrice,
          brand: prizeData.brand,
          specifications: prizeData.specifications as Prisma.JsonObject,
          stock: prizeData.stock,
          isActive: true,
        },
      })
      
      // Create variants for this prize
      for (const variantData of variants) {
        await this.prisma.prizeVariant.create({
          data: {
            prizeId: prize.id,
            name: variantData.name,
            value: variantData.value,
            stock: variantData.stock,
            isActive: true,
          },
        })
        variantCount++
      }
      
      globalPrizeCount++
    }
    
    // Create company-specific prizes for Valorize Corp
    if (valorizeCompany) {
      for (const prizeData of VALORIZE_COMPANY_PRIZES) {
        const variants = prizeData.variants || []
        
        const prize = await this.prisma.prize.create({
          data: {
            companyId: valorizeCompany.id,
            name: prizeData.name,
            description: prizeData.description,
            category: prizeData.category,
            images: prizeData.images,
            coinPrice: prizeData.coinPrice,
            brand: prizeData.brand,
            specifications: prizeData.specifications as Prisma.JsonObject,
            stock: prizeData.stock,
            isActive: true,
          },
        })
        
        // Create variants for this prize
        for (const variantData of variants) {
          await this.prisma.prizeVariant.create({
            data: {
              prizeId: prize.id,
              name: variantData.name,
              value: variantData.value,
              stock: variantData.stock,
              isActive: true,
            },
          })
          variantCount++
        }
        
        companyPrizeCount++
      }
    }
    
    this.logComplete(globalPrizeCount + companyPrizeCount, 'prizes')
    this.logInfo(`Created ${globalPrizeCount} global prizes`)
    this.logInfo(`Created ${companyPrizeCount} company-specific prizes`)
    this.logInfo(`Created ${variantCount} prize variants`)
  }
}
