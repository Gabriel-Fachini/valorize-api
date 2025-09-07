import { CompanyContact, type CreateCompanyContactData, type UpdateCompanyContactData } from './company-contact.model'
import { logger } from '@/lib/logger'

export const companyContactService = {
  /**
   * Adicionar contato à empresa
   */
  async addContact(data: CreateCompanyContactData): Promise<CompanyContact> {
    try {
      logger.info('Adding contact to company', { companyId: data.companyId, userId: data.userId })

      // Verificar se contato já existe
      const exists = await CompanyContact.exists(data.companyId, data.userId)
      if (exists) {
        throw new Error('User is already a contact for this company')
      }

      const contact = await CompanyContact.create(data)
      
      logger.info('Contact added successfully', { 
        contactId: contact.id,
        companyId: data.companyId,
        userId: data.userId 
      })
      
      return contact
    } catch (error) {
      logger.error('Failed to add contact', { error, data })
      throw error
    }
  },

  /**
   * Obter contatos de uma empresa
   */
  async getCompanyContacts(companyId: string): Promise<CompanyContact[]> {
    try {
      return await CompanyContact.findByCompanyId(companyId)
    } catch (error) {
      logger.error('Failed to get company contacts', { error, companyId })
      throw error
    }
  },

  /**
   * Obter contato principal de uma empresa
   */
  async getPrimaryContact(companyId: string): Promise<CompanyContact | null> {
    try {
      return await CompanyContact.findPrimaryByCompanyId(companyId)
    } catch (error) {
      logger.error('Failed to get primary contact', { error, companyId })
      throw error
    }
  },

  /**
   * Atualizar contato
   */
  async updateContact(id: string, data: UpdateCompanyContactData): Promise<CompanyContact> {
    try {
      const contact = await CompanyContact.findById(id)
      
      if (!contact) {
        throw new Error('Contact not found')
      }

      // Atualizar dados
      Object.assign(contact['data'], data)
      
      // Se está definindo como primary, usar método específico
      if (data.isPrimary) {
        await contact.setPrimary()
      } else {
        await contact.save()
      }

      logger.info('Contact updated successfully', { contactId: id })
      return contact
    } catch (error) {
      logger.error('Failed to update contact', { error, contactId: id, data })
      throw error
    }
  },

  /**
   * Remover contato
   */
  async removeContact(id: string): Promise<void> {
    try {
      const contact = await CompanyContact.findById(id)
      
      if (!contact) {
        throw new Error('Contact not found')
      }

      await contact.delete()
      logger.info('Contact removed successfully', { contactId: id })
    } catch (error) {
      logger.error('Failed to remove contact', { error, contactId: id })
      throw error
    }
  },

  /**
   * Definir contato como principal
   */
  async setPrimaryContact(id: string): Promise<CompanyContact> {
    try {
      const contact = await CompanyContact.findById(id)
      
      if (!contact) {
        throw new Error('Contact not found')
      }

      await contact.setPrimary()
      logger.info('Contact set as primary successfully', { contactId: id })
      return contact
    } catch (error) {
      logger.error('Failed to set primary contact', { error, contactId: id })
      throw error
    }
  },

  /**
   * Obter contatos de um usuário
   */
  async getUserContacts(userId: string): Promise<CompanyContact[]> {
    try {
      return await CompanyContact.findByUserId(userId)
    } catch (error) {
      logger.error('Failed to get user contacts', { error, userId })
      throw error
    }
  }
}
