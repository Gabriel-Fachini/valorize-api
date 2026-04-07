import { describe, it, expect } from 'vitest'
import { isSupabaseIntegrationTestEnabled } from './helpers/supabase.helper'

describe('Test Setup', () => {
  it('should force test mode in the global setup', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  it('should keep live Supabase integration tests disabled by default', () => {
    expect(isSupabaseIntegrationTestEnabled()).toBe(false)
  })
})
