import { Pool, PoolClient, QueryResult } from 'pg'
import { logger } from '../logger/Logger'

export class DatabaseConnection {
  private static instance: DatabaseConnection
  private pool: Pool | null = null

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  public async connect(): Promise<void> {
    try {
      const connectionString = process.env.DATABASE_URL
      
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required')
      }

      this.pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      })

      // Test the connection
      const client = await this.pool.connect()
      await client.query('SELECT NOW()')
      client.release()

      logger.info('Database connection pool initialized successfully')
    } catch (error) {
      logger.error('Failed to connect to database', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      logger.info('Database connection pool closed')
    }
  }

  public async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database connection not initialized. Call connect() first.')
    }

    const start = Date.now()
    try {
      const result = await this.pool.query<T>(text, params)
      const duration = Date.now() - start
      
      logger.debug('Executed query', {
        query: text,
        duration: `${duration}ms`,
        rows: result.rowCount
      })

      return result
    } catch (error) {
      const duration = Date.now() - start
      logger.error('Query failed', {
        query: text,
        params,
        duration: `${duration}ms`,
        error
      })
      throw error
    }
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database connection not initialized. Call connect() first.')
    }
    return this.pool.connect()
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  public isConnected(): boolean {
    return this.pool !== null
  }
} 