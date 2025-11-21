import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

/**
 * Supabase Auth Client
 * Provides authentication services using Supabase Auth
 *
 * Two clients are available:
 * - supabaseAuth: For general auth operations (uses anon key with RLS)
 * - supabaseAdmin: For admin operations like creating users (uses service role key, bypasses RLS)
 */
class SupabaseAuthService {
  private authClient: SupabaseClient | null = null
  private adminClient: SupabaseClient | null = null
  private isConfigured: boolean = false

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      logger.warn('Supabase Auth not configured. Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env')
      logger.warn('Authentication functionality will not be available until Supabase is configured.')
      this.isConfigured = false
      return
    }

    // Client for general auth operations (respects RLS)
    this.authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Admin client for privileged operations (bypasses RLS)
    this.adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    this.isConfigured = true
    logger.info('SupabaseAuthService initialized successfully')
  }

  /**
   * Check if Supabase Auth is configured
   * @throws Error if not configured
   */
  private ensureConfigured(): void {
    if (!this.isConfigured || !this.authClient || !this.adminClient) {
      throw new Error(
        'Supabase Auth is not configured. Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env',
      )
    }
  }

  /**
   * Get the auth client for general operations
   * This client respects Row Level Security (RLS) policies
   */
  getAuthClient(): SupabaseClient {
    this.ensureConfigured()
    return this.authClient!
  }

  /**
   * Get the admin client for privileged operations
   * This client bypasses Row Level Security (RLS) policies
   * Use with caution - only for admin operations like creating users
   */
  getAdminClient(): SupabaseClient {
    this.ensureConfigured()
    return this.adminClient!
  }

  /**
   * Check if Supabase Auth is properly configured
   */
  isAuthConfigured(): boolean {
    return this.isConfigured
  }
}

// Export singleton instance
export const supabaseAuthService = new SupabaseAuthService()

// Export convenient accessors
export const getSupabaseAuth = () => supabaseAuthService.getAuthClient()
export const getSupabaseAdmin = () => supabaseAuthService.getAdminClient()
