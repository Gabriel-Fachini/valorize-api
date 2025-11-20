/**
 * Company contact seeder
 */

import { BaseSeeder } from './base.seeder'
import { DEMO_COMPANY_CONTACTS } from '../data/contacts'

export class ContactSeeder extends BaseSeeder {
  protected get name(): string {
    return 'company contacts'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    for (const contactData of DEMO_COMPANY_CONTACTS) {
      // Find user by authUserId
      const user = await this.prisma.user.findUnique({
        where: { authUserId: contactData.userAuthUserId },
      })

      if (!user) {
        this.logWarning(`User not found for authUserId: ${contactData.userAuthUserId}`)
        continue
      }
      
      // Create company contact
      await this.prisma.companyContact.upsert({
        where: {
          companyId_userId: {
            companyId: contactData.companyId,
            userId: user.id,
          },
        },
        update: {
          role: contactData.role,
          isPrimary: contactData.isPrimary,
        },
        create: {
          companyId: contactData.companyId,
          userId: user.id,
          role: contactData.role,
          isPrimary: contactData.isPrimary,
        },
      })
      
      this.logInfo(`Created contact '${user.name}' as '${contactData.role}' for company`)
    }
    
    this.logComplete(DEMO_COMPANY_CONTACTS.length, 'company contacts')
  }
}
