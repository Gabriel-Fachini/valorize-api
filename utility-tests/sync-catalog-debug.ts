/**
 * Debug Script for Catalog Sync
 *
 * This script tests the catalog synchronization flow:
 * 1. Login to the API with provided credentials
 * 2. Call the sync catalog endpoint
 * 3. Display detailed error information if something fails
 *
 * Usage:
 *   npx tsx utility-tests/sync-catalog-debug.ts [email] [password]
 *
 * Or set environment variables:
 *   DEBUG_EMAIL=user@example.com DEBUG_PASSWORD=password npx tsx utility-tests/sync-catalog-debug.ts
 */

import * as readline from 'readline'

const API_URL = 'http://localhost:4000'
const API_VERSION = 'v1'

interface LoginResponse {
  success: boolean
  data: {
    access_token: string
    user?: {
      id: string
      email: string
      name: string
    }
  }
}

interface SyncResponse {
  success: boolean
  message: string
  result?: {
    syncedProducts: number
    deactivatedProducts: number
    deactivatedPrizes: number
    totalActiveProducts: number
  }
}

class CatalogDebug {
  private email: string = ''
  private password: string = ''
  private token: string = ''

  async run() {
    console.log('🚀 Valorize API - Catalog Sync Debug')
    console.log('=====================================\n')

    try {
      // Get credentials
      await this.getCredentials()

      // Login
      await this.login()

      // Sync catalog
      await this.syncCatalog()

      console.log('\n✅ Debug completed successfully!')
    } catch (error) {
      console.error('\n❌ Debug failed:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  }

  private async getCredentials() {
    // Check environment variables first
    const envEmail = process.env.DEBUG_EMAIL
    const envPassword = process.env.DEBUG_PASSWORD

    if (envEmail && envPassword) {
      this.email = envEmail
      this.password = envPassword
      console.log(`✓ Using credentials from environment variables`)
      console.log(`  Email: ${this.email}\n`)
      return
    }

    // Check command line arguments
    const args = process.argv.slice(2)
    if (args.length >= 2) {
      this.email = args[0]
      this.password = args[1]
      console.log(`✓ Using credentials from arguments`)
      console.log(`  Email: ${this.email}\n`)
      return
    }

    // Prompt for credentials
    console.log('Please provide your credentials:')
    this.email = await this.prompt('Email: ')
    this.password = await this.prompt('Password: ', true)
    console.log('')
  }

  private async login() {
    console.log('🔐 Logging in...')
    console.log(`   Email: ${this.email}`)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      })

      const data = (await response.json()) as LoginResponse

      if (!response.ok || !data.success) {
        throw new Error(
          `Login failed with status ${response.status}: ${JSON.stringify(data)}`
        )
      }

      this.token = data.data.access_token

      console.log('✓ Login successful')
      if (data.data.user) {
        console.log(`  User: ${data.data.user.name} (${data.data.user.email})`)
      }
      console.log(`  Token: ${this.token.substring(0, 20)}...\n`)
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  private async syncCatalog() {
    console.log('📦 Syncing catalog...')

    try {
      const response = await fetch(
        `${API_URL}/admin/voucher-products/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
          },
        }
      )

      const data = (await response.json()) as SyncResponse

      console.log(`\nResponse Status: ${response.status}`)
      console.log(`Response Headers:`)
      console.log(`  Content-Type: ${response.headers.get('content-type')}`)

      if (!response.ok) {
        console.log('\n❌ Sync failed!')
        console.log('Response Body:')
        console.log(JSON.stringify(data, null, 2))
        throw new Error(`Sync failed with status ${response.status}`)
      }

      if (!data.success) {
        console.log('\n❌ Sync request failed!')
        console.log('Response Body:')
        console.log(JSON.stringify(data, null, 2))
        throw new Error(data.message || 'Unknown error')
      }

      console.log('\n✓ Catalog synced successfully!')
      if (data.result) {
        console.log(`\nSync Results:`)
        console.log(`  Synced Products: ${data.result.syncedProducts}`)
        console.log(`  Deactivated Products: ${data.result.deactivatedProducts}`)
        console.log(`  Deactivated Prizes: ${data.result.deactivatedPrizes}`)
        console.log(`  Total Active Products: ${data.result.totalActiveProducts}`)
      }
    } catch (error) {
      throw new Error(
        `Sync catalog failed: ${error instanceof Error ? error.message : error}`
      )
    }
  }

  private prompt(question: string, hidden = false): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      if (hidden) {
        // Hide password input
        process.stdout.write(question)
        const stdin = process.stdin
        stdin.resume()
        stdin.setRawMode(true)

        let password = ''
        stdin.on('data', (char) => {
          const c = char.toString()
          if (c === '\n' || c === '\r' || c === '\u0004') {
            stdin.setRawMode(false)
            stdin.pause()
            process.stdout.write('\n')
            resolve(password)
          } else if (c === '\u0003') {
            process.exit()
          } else {
            password += c
            process.stdout.write('*')
          }
        })
      } else {
        rl.question(question, (answer) => {
          rl.close()
          resolve(answer)
        })
      }
    })
  }
}

// Run the debug script
const debug = new CatalogDebug()
debug.run().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
