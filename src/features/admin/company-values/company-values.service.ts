/**
 * @fileoverview Company Values Service
 *
 * Business logic for managing company values, including:
 * - CRUD operations
 * - Ordering/reordering
 * - Soft delete via isActive flag
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

export interface CompanyValueResponse {
  id: number
  company_id: string
  title: string
  description: string | null
  example: string | null
  iconName: string | null
  iconColor: string | null
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateCompanyValueInput {
  title: string
  description?: string | null
  example?: string | null
  iconName?: string | null
  iconColor?: string | null
}

export interface UpdateCompanyValueInput {
  title?: string
  description?: string | null
  example?: string | null
  iconName?: string | null
  iconColor?: string | null
  is_active?: boolean
}

/**
 * Format company value for response
 */
function formatCompanyValue(value: any): CompanyValueResponse {
  return {
    id: value.id,
    company_id: value.companyId,
    title: value.title,
    description: value.description,
    example: value.example,
    iconName: value.iconName,
    iconColor: value.iconColor,
    order: value.order,
    is_active: value.isActive,
    created_at: value.createdAt.toISOString(),
    updated_at: value.updatedAt.toISOString(),
  }
}

export const companyValuesService = {
  /**
   * List all company values ordered by position
   */
  async listValues(companyId: string): Promise<CompanyValueResponse[]> {
    logger.info(`Listing company values for company ${companyId}`)

    const values = await prisma.companyValue.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
    })

    return values.map(formatCompanyValue)
  },

  /**
   * Get a specific company value by ID
   */
  async getValueById(companyId: string, valueId: number): Promise<CompanyValueResponse> {
    logger.info(`Getting company value ${valueId} for company ${companyId}`)

    const value = await prisma.companyValue.findFirst({
      where: {
        id: valueId,
        companyId,
      },
    })

    if (!value) {
      throw new Error('Company value not found')
    }

    return formatCompanyValue(value)
  },

  /**
   * Create a new company value
   * Automatically assigns the next available order number
   */
  async createValue(
    companyId: string,
    data: CreateCompanyValueInput,
  ): Promise<CompanyValueResponse> {
    logger.info(`Creating company value for company ${companyId}`, { title: data.title })

    // Check if title already exists for this company
    const existingValue = await prisma.companyValue.findFirst({
      where: {
        companyId,
        title: data.title,
      },
    })

    if (existingValue) {
      throw new Error('A value with this title already exists for this company')
    }

    // Get the highest order number for this company
    const lastValue = await prisma.companyValue.findFirst({
      where: { companyId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const nextOrder = lastValue ? lastValue.order + 1 : 1

    // Create the new value
    const value = await prisma.companyValue.create({
      data: {
        companyId,
        title: data.title,
        description: data.description || null,
        example: data.example || null,
        iconName: data.iconName || null,
        iconColor: data.iconColor || null,
        order: nextOrder,
        isActive: true,
      },
    })

    logger.info('Company value created successfully', { valueId: value.id })
    return formatCompanyValue(value)
  },

  /**
   * Update an existing company value
   */
  async updateValue(
    companyId: string,
    valueId: number,
    data: UpdateCompanyValueInput,
  ): Promise<CompanyValueResponse> {
    logger.info(`Updating company value ${valueId} for company ${companyId}`)

    // Check if value exists and belongs to company
    const existingValue = await prisma.companyValue.findFirst({
      where: {
        id: valueId,
        companyId,
      },
    })

    if (!existingValue) {
      throw new Error('Company value not found')
    }

    // If updating title, check for duplicates
    if (data.title && data.title !== existingValue.title) {
      const duplicateValue = await prisma.companyValue.findFirst({
        where: {
          companyId,
          title: data.title,
          id: { not: valueId },
        },
      })

      if (duplicateValue) {
        throw new Error('A value with this title already exists for this company')
      }
    }

    // Update the value
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.example !== undefined) updateData.example = data.example
    if (data.iconName !== undefined) updateData.iconName = data.iconName
    if (data.iconColor !== undefined) updateData.iconColor = data.iconColor
    if (data.is_active !== undefined) updateData.isActive = data.is_active

    const value = await prisma.companyValue.update({
      where: { id: valueId },
      data: updateData,
    })

    logger.info('Company value updated successfully', { valueId })
    return formatCompanyValue(value)
  },

  /**
   * Reorder company values
   * Accepts an array of value IDs in the desired order
   */
  async reorderValues(
    companyId: string,
    orderedIds: number[],
  ): Promise<CompanyValueResponse[]> {
    logger.info(`Reordering company values for company ${companyId}`, {
      orderedIds,
    })

    // Verify all IDs belong to the company
    const values = await prisma.companyValue.findMany({
      where: {
        companyId,
        id: { in: orderedIds },
      },
    })

    if (values.length !== orderedIds.length) {
      throw new Error('Some value IDs do not belong to this company or do not exist')
    }

    // Update order for each value
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.companyValue.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    )

    logger.info('Company values reordered successfully')

    // Return updated list
    return this.listValues(companyId)
  },

  /**
   * Delete a company value (soft delete via isActive flag)
   */
  async deleteValue(companyId: string, valueId: number): Promise<void> {
    logger.info(`Deleting company value ${valueId} for company ${companyId}`)

    // Check if value exists and belongs to company
    const existingValue = await prisma.companyValue.findFirst({
      where: {
        id: valueId,
        companyId,
      },
    })

    if (!existingValue) {
      throw new Error('Company value not found')
    }

    // Soft delete by setting isActive to false
    await prisma.companyValue.update({
      where: { id: valueId },
      data: { isActive: false },
    })

    logger.info('Company value deleted successfully', { valueId })
  },
}
