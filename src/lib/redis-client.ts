/**
 * Redis Client Configuration with Connection Pooling
 * Provides high-performance caching for Harry School CRM
 */

// Only import Redis on server-side to prevent client-side bundling issues
let Redis: any = null;
let RedisOptions: any = null;
if (typeof window === 'undefined') {
  const ioredis = require('ioredis');
  Redis = ioredis.default || ioredis;
  RedisOptions = ioredis.RedisOptions;
}

// Redis configuration interface
interface RedisConfig extends RedisOptions {
  enabled: boolean
  defaultTTL: number
  keyPrefix: string
}

// Environment-based Redis configuration
const getRedisConfig = (): RedisConfig => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    // Enable Redis only in production or if explicitly enabled
    enabled: process.env.REDIS_ENABLED === 'true' || isProduction,
    
    // Connection settings
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    
    // Connection pooling settings
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    connectionName: 'harry-school-admin',
    
    // Pool configuration
    family: 4, // IPv4
    keepAlive: true,
    
    // Cluster support (if needed)
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    
    // Performance settings
    lazyConnect: true,
    
    // Key prefix for multi-tenancy
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'harry_school:',
    
    // Default TTL (Time To Live) in seconds
    defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '3600'), // 1 hour
    
    // Connection timeout
    connectTimeout: 10000,
    commandTimeout: 5000,
    
    // Retry configuration
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000)
      console.log(`Redis retry attempt ${times}, delay: ${delay}ms`)
      return delay
    },
    
    // Reconnect on error
    reconnectOnError: (err: Error) => {
      const targetError = 'READONLY'
      return err.message.includes(targetError)
    }
  }
}

// Singleton Redis client
class RedisClient {
  private static instance: RedisClient
  private client: Redis | null = null
  private config: RedisConfig
  private isConnected = false
  private connectionPromise: Promise<void> | null = null

  private constructor() {
    this.config = getRedisConfig()
    
    // Only initialize Redis on server-side
    if (typeof window === 'undefined' && this.config.enabled && Redis) {
      this.initializeClient()
    } else {
      console.log('📦 Redis caching disabled (client-side or development mode)')
    }
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient()
    }
    return RedisClient.instance
  }

  private initializeClient(): void {
    if (!this.config.enabled || typeof window !== 'undefined' || !Redis) return

    try {
      this.client = new Redis(this.config)

      // Connection event handlers
      this.client.on('connect', () => {
        console.log('🚀 Redis client connected')
        this.isConnected = true
      })

      this.client.on('ready', () => {
        console.log('✅ Redis client ready for commands')
      })

      this.client.on('error', (err) => {
        console.error('❌ Redis client error:', err.message)
        this.isConnected = false
      })

      this.client.on('close', () => {
        console.log('🔴 Redis connection closed')
        this.isConnected = false
      })

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis client reconnecting...')
      })

      // Connection promise for async initialization
      this.connectionPromise = new Promise((resolve, reject) => {
        if (!this.client) return reject(new Error('Redis client not initialized'))

        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout'))
        }, this.config.connectTimeout || 10000)

        this.client.once('ready', () => {
          clearTimeout(timeout)
          resolve()
        })

        this.client.once('error', (err) => {
          clearTimeout(timeout)
          reject(err)
        })
      })

    } catch (error) {
      console.error('❌ Failed to initialize Redis client:', error)
      this.client = null
    }
  }

  /**
   * Ensure Redis client is connected
   */
  private async ensureConnection(): Promise<void> {
    if (!this.config.enabled || !this.client || typeof window !== 'undefined') return

    if (this.isConnected) return

    if (this.connectionPromise) {
      try {
        await this.connectionPromise
      } catch (error) {
        console.warn('Redis connection failed, operating without cache:', error)
        this.client = null
      }
    }
  }

  /**
   * Set a value in Redis with TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.config.enabled || !this.client) return false

    try {
      await this.ensureConnection()
      if (!this.client) return false

      const serializedValue = JSON.stringify(value)
      const ttl = ttlSeconds || this.config.defaultTTL

      const result = await this.client.setex(key, ttl, serializedValue)
      return result === 'OK'
    } catch (error) {
      console.warn('Redis SET error:', error)
      return false
    }
  }

  /**
   * Get a value from Redis
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.config.enabled || !this.client) return null

    try {
      await this.ensureConnection()
      if (!this.client) return null

      const value = await this.client.get(key)
      if (!value) return null

      return JSON.parse(value) as T
    } catch (error) {
      console.warn('Redis GET error:', error)
      return null
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<boolean> {
    if (!this.config.enabled || !this.client) return false

    try {
      await this.ensureConnection()
      if (!this.client) return false

      const result = await this.client.del(key)
      return result > 0
    } catch (error) {
      console.warn('Redis DEL error:', error)
      return false
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.config.enabled || !this.client) return 0

    try {
      await this.ensureConnection()
      if (!this.client) return 0

      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0

      const result = await this.client.del(...keys)
      return result
    } catch (error) {
      console.warn('Redis DEL pattern error:', error)
      return 0
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.config.enabled || !this.client) return false

    try {
      await this.ensureConnection()
      if (!this.client) return false

      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.warn('Redis EXISTS error:', error)
      return false
    }
  }

  /**
   * Set TTL for existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.config.enabled || !this.client) return false

    try {
      await this.ensureConnection()
      if (!this.client) return false

      const result = await this.client.expire(key, ttlSeconds)
      return result === 1
    } catch (error) {
      console.warn('Redis EXPIRE error:', error)
      return false
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string): Promise<number | null> {
    if (!this.config.enabled || !this.client) return null

    try {
      await this.ensureConnection()
      if (!this.client) return null

      return await this.client.incr(key)
    } catch (error) {
      console.warn('Redis INCR error:', error)
      return null
    }
  }

  /**
   * Get multiple values at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.config.enabled || !this.client || keys.length === 0) {
      return keys.map(() => null)
    }

    try {
      await this.ensureConnection()
      if (!this.client) return keys.map(() => null)

      const values = await this.client.mget(...keys)
      return values.map(value => {
        if (!value) return null
        try {
          return JSON.parse(value) as T
        } catch {
          return null
        }
      })
    } catch (error) {
      console.warn('Redis MGET error:', error)
      return keys.map(() => null)
    }
  }

  /**
   * Set multiple values at once
   */
  async mset(keyValuePairs: Array<[string, any]>, ttlSeconds?: number): Promise<boolean> {
    if (!this.config.enabled || !this.client || keyValuePairs.length === 0) return false

    try {
      await this.ensureConnection()
      if (!this.client) return false

      // Prepare key-value pairs for Redis MSET
      const serializedPairs = keyValuePairs.flatMap(([key, value]) => [
        key,
        JSON.stringify(value)
      ])

      const result = await this.client.mset(...serializedPairs)
      
      // Set TTL for all keys if specified
      if (ttlSeconds && result === 'OK') {
        const ttl = ttlSeconds || this.config.defaultTTL
        const expirePromises = keyValuePairs.map(([key]) => 
          this.client!.expire(key, ttl)
        )
        await Promise.all(expirePromises)
      }

      return result === 'OK'
    } catch (error) {
      console.warn('Redis MSET error:', error)
      return false
    }
  }

  /**
   * Flush all cache data (use with caution)
   */
  async flushAll(): Promise<boolean> {
    if (!this.config.enabled || !this.client) return false

    try {
      await this.ensureConnection()
      if (!this.client) return false

      const result = await this.client.flushdb()
      return result === 'OK'
    } catch (error) {
      console.warn('Redis FLUSHALL error:', error)
      return false
    }
  }

  /**
   * Get Redis connection info
   */
  getConnectionInfo(): {
    enabled: boolean
    connected: boolean
    host?: string
    port?: number
    keyPrefix: string
  } {
    return {
      enabled: this.config.enabled,
      connected: this.isConnected,
      host: this.config.host,
      port: this.config.port,
      keyPrefix: this.config.keyPrefix
    }
  }

  /**
   * Gracefully disconnect Redis client
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit()
        console.log('✅ Redis client disconnected gracefully')
      } catch (error) {
        console.warn('Redis disconnect error:', error)
      } finally {
        this.client = null
        this.isConnected = false
      }
    }
  }
}

// Export singleton instance
export const redisClient = RedisClient.getInstance()

// Export types for use in other modules
export type { RedisConfig }
export { RedisClient }