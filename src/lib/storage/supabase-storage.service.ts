import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

interface UploadResult {
  publicUrl: string
  path: string
}

class SupabaseStorageService {
  private client: SupabaseClient | null = null
  private bucket: string
  private isConfigured: boolean = false

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'prize-images'

    this.bucket = bucketName

    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
      logger.warn('Image upload functionality will not be available until Supabase is configured.')
      this.isConfigured = false
      return
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    this.isConfigured = true

    logger.info(`SupabaseStorageService initialized with bucket: ${this.bucket}`)
  }

  /**
   * Check if Supabase is configured
   * @throws Error if not configured
   */
  private ensureConfigured(): void {
    if (!this.isConfigured || !this.client) {
      throw new Error(
        'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env',
      )
    }
  }

  /**
   * Upload a prize image to Supabase Storage
   * @param file - File buffer
   * @param fileName - Original file name
   * @param mimeType - MIME type of the file
   * @returns Public URL and storage path
   */
  async uploadPrizeImage(
    file: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    this.ensureConfigured()

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(mimeType)) {
        throw new Error(
          `Invalid file type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`,
        )
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.length > maxSize) {
        throw new Error(`File size exceeds maximum allowed size of 5MB. File size: ${(file.length / 1024 / 1024).toFixed(2)}MB`)
      }

      // Generate unique file name
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8)
      const extension = fileName.split('.').pop()
      const uniqueFileName = `prize-${timestamp}-${randomString}.${extension}`
      const filePath = `prizes/${uniqueFileName}`

      logger.info(`Uploading image to Supabase: ${filePath}`, {
        originalName: fileName,
        mimeType,
        size: file.length,
      })

      // Upload to Supabase Storage
      const { data, error } = await this.client!.storage
        .from(this.bucket)
        .upload(filePath, file, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        logger.error('Supabase upload error', { error, filePath })
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.client!.storage.from(this.bucket).getPublicUrl(data.path)

      logger.info(`Image uploaded successfully: ${publicUrl}`)

      return {
        publicUrl,
        path: data.path,
      }
    } catch (error) {
      logger.error('Error uploading image to Supabase', { error, fileName })
      throw error
    }
  }

  /**
   * Upload a voucher image to Supabase Storage
   * @param file - File buffer
   * @param fileName - Original file name
   * @param mimeType - MIME type of the file
   * @returns Public URL and storage path
   */
  async uploadVoucherImage(
    file: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    this.ensureConfigured()

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(mimeType)) {
        throw new Error(
          `Invalid file type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`,
        )
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.length > maxSize) {
        throw new Error(`File size exceeds maximum allowed size of 5MB. File size: ${(file.length / 1024 / 1024).toFixed(2)}MB`)
      }

      // Generate unique file name
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8)
      const extension = fileName.split('.').pop()
      const uniqueFileName = `voucher-${timestamp}-${randomString}.${extension}`
      const filePath = `vouchers/${uniqueFileName}`

      logger.info(`Uploading voucher image to Supabase: ${filePath}`, {
        originalName: fileName,
        mimeType,
        size: file.length,
      })

      // Upload to Supabase Storage
      const { data, error } = await this.client!.storage
        .from(this.bucket)
        .upload(filePath, file, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        logger.error('Supabase upload error', { error, filePath })
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.client!.storage.from(this.bucket).getPublicUrl(data.path)

      logger.info(`Voucher image uploaded successfully: ${publicUrl}`)

      return {
        publicUrl,
        path: data.path,
      }
    } catch (error) {
      logger.error('Error uploading voucher image to Supabase', { error, fileName })
      throw error
    }
  }

  /**
   * Upload a company logo to Supabase Storage
   * @param file - File buffer
   * @param fileName - Original file name
   * @param mimeType - MIME type of the file
   * @returns Public URL and storage path
   */
  async uploadCompanyLogo(
    file: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    this.ensureConfigured()

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(mimeType)) {
        throw new Error(
          `Invalid file type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`,
        )
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.length > maxSize) {
        throw new Error(`File size exceeds maximum allowed size of 5MB. File size: ${(file.length / 1024 / 1024).toFixed(2)}MB`)
      }

      // Generate unique file name
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8)
      const extension = fileName.split('.').pop()
      const uniqueFileName = `company-logo-${timestamp}-${randomString}.${extension}`
      const filePath = `company-logos/${uniqueFileName}`

      logger.info(`Uploading company logo to Supabase: ${filePath}`, {
        originalName: fileName,
        mimeType,
        size: file.length,
      })

      // Upload to Supabase Storage
      const { data, error } = await this.client!.storage
        .from(this.bucket)
        .upload(filePath, file, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        logger.error('Supabase upload error', { error, filePath })
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.client!.storage.from(this.bucket).getPublicUrl(data.path)

      logger.info(`Company logo uploaded successfully: ${publicUrl}`)

      return {
        publicUrl,
        path: data.path,
      }
    } catch (error) {
      logger.error('Error uploading company logo to Supabase', { error, fileName })
      throw error
    }
  }

  /**
   * Delete a prize image from Supabase Storage
   * @param imagePath - Storage path of the image (e.g., "prizes/prize-123.jpg")
   */
  async deletePrizeImage(imagePath: string): Promise<void> {
    this.ensureConfigured()

    try {
      logger.info(`Deleting image from Supabase: ${imagePath}`)

      const { error } = await this.client!.storage.from(this.bucket).remove([imagePath])

      if (error) {
        logger.error('Supabase delete error', { error, imagePath })
        throw new Error(`Delete failed: ${error.message}`)
      }

      logger.info(`Image deleted successfully: ${imagePath}`)
    } catch (error) {
      logger.error('Error deleting image from Supabase', { error, imagePath })
      throw error
    }
  }

  /**
   * Delete a company logo from Supabase Storage
   * @param imagePath - Storage path of the logo (e.g., "company-logos/company-logo-123.jpg")
   */
  async deleteCompanyLogo(imagePath: string): Promise<void> {
    this.ensureConfigured()

    try {
      logger.info(`Deleting company logo from Supabase: ${imagePath}`)

      const { error } = await this.client!.storage.from(this.bucket).remove([imagePath])

      if (error) {
        logger.error('Supabase delete error', { error, imagePath })
        throw new Error(`Delete failed: ${error.message}`)
      }

      logger.info(`Company logo deleted successfully: ${imagePath}`)
    } catch (error) {
      logger.error('Error deleting company logo from Supabase', { error, imagePath })
      throw error
    }
  }

  /**
   * Delete multiple prize images from Supabase Storage
   * @param imagePaths - Array of storage paths
   */
  async deletePrizeImages(imagePaths: string[]): Promise<void> {
    this.ensureConfigured()

    try {
      if (imagePaths.length === 0) {
        return
      }

      logger.info(`Deleting ${imagePaths.length} images from Supabase`, { imagePaths })

      const { error } = await this.client!.storage.from(this.bucket).remove(imagePaths)

      if (error) {
        logger.error('Supabase bulk delete error', { error, imagePaths })
        throw new Error(`Bulk delete failed: ${error.message}`)
      }

      logger.info(`${imagePaths.length} images deleted successfully`)
    } catch (error) {
      logger.error('Error deleting images from Supabase', { error, imagePaths })
      throw error
    }
  }

  /**
   * Extract storage path from a Supabase public URL
   * @param publicUrl - Public URL of the image
   * @returns Storage path (e.g., "prizes/prize-123.jpg")
   */
  extractPathFromUrl(publicUrl: string): string {
    try {
      // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const url = new URL(publicUrl)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.indexOf(this.bucket)

      if (bucketIndex === -1) {
        throw new Error(`Invalid Supabase URL: bucket "${this.bucket}" not found in path`)
      }

      // Extract everything after the bucket name
      const storagePath = pathParts.slice(bucketIndex + 1).join('/')
      return storagePath
    } catch (error) {
      logger.error('Error extracting path from URL', { error, publicUrl })
      throw new Error(`Failed to extract storage path from URL: ${publicUrl}`)
    }
  }
}

// Export singleton instance
export const supabaseStorageService = new SupabaseStorageService()
