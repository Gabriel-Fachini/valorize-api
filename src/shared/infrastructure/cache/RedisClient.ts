import { createClient, RedisClientType } from 'redis'
import { logger } from '../logger/Logger'

export class RedisClient {
  private static instance: RedisClient
  private client: RedisClientType | null = null

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient()
    }
    return RedisClient.instance
  }

  public async connect(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts')
              return new Error('Redis reconnection failed')
            }
            return Math.min(retries * 50, 1000)
          }
        }
      })

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error)
      })

      this.client.on('connect', () => {
        logger.info('Redis client connected')
      })

      this.client.on('disconnect', () => {
        logger.warn('Redis client disconnected')
      })

      await this.client.connect()
      
      // Test the connection
      await this.client.ping()
      
      logger.info('Redis connection established successfully')
    } catch (error) {
      logger.error('Failed to connect to Redis', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
      logger.info('Redis connection closed')
    }
  }

  public async get<T = string>(key: string): Promise<T | null> {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.')
    }

    try {
      const value = await this.client.get(key)
      if (value === null) return null

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value) as T
      } catch {
        return value as T
      }
    } catch (error) {
      logger.error('Redis GET error', { key, error })
      throw error
    }
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.')
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      
      if (ttl) {
        await this.client.setEx(key, ttl, stringValue)
      } else {
        await this.client.set(key, stringValue)
      }
    } catch (error) {
      logger.error('Redis SET error', { key, ttl, error })
      throw error
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.')
    }

    try {
      await this.client.del(key)
    } catch (error) {
      logger.error('Redis DEL error', { key, error })
      throw error
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.')
    }

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error })
      throw error
    }
  }

  public async incr(key: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.')
    }

    try {
      return await this.client.incr(key)
    } catch (error) {
      logger.error('Redis INCR error', { key, error })
      throw error
    }
  }

  public async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.')
    }

    try {
      await this.client.expire(key, seconds)
    } catch (error) {
      logger.error('Redis EXPIRE error', { key, seconds, error })
      throw error
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.')
    }

    try {
      return await this.client.keys(pattern)
    } catch (error) {
      logger.error('Redis KEYS error', { pattern, error })
      throw error
    }
  }

  public isConnected(): boolean {
    return this.client !== null && this.client.isOpen
  }
} 