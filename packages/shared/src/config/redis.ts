import Redis from 'redis';
import { config } from './index';

// Redis client for agent coordination and caching
let redisClient: Redis.RedisClientType | null = null;

export async function getRedisClient(): Promise<Redis.RedisClientType> {
  if (!redisClient) {
    redisClient = Redis.createClient({
      url: config.redis.url,
      password: config.redis.token,
      socket: {
        tls: true,
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    await redisClient.connect();
  }

  return redisClient;
}

// Session storage utilities
export class SessionManager {
  private static readonly SESSION_PREFIX = 'session:';
  private static readonly SESSION_TTL = 24 * 60 * 60; // 24 hours

  static async setSession(sessionId: string, data: Record<string, any>): Promise<void> {
    const client = await getRedisClient();
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await client.setEx(key, this.SESSION_TTL, JSON.stringify(data));
  }

  static async getSession(sessionId: string): Promise<Record<string, any> | null> {
    const client = await getRedisClient();
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const client = await getRedisClient();
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await client.del(key);
  }

  static async refreshSession(sessionId: string): Promise<void> {
    const client = await getRedisClient();
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await client.expire(key, this.SESSION_TTL);
  }
}

// Agent coordination state management
export class AgentCoordinator {
  private static readonly AGENT_STATE_PREFIX = 'agent_state:';
  private static readonly PROCESSING_TTL = 60 * 60; // 1 hour

  static async setAgentState(requestId: string, agentType: string, state: Record<string, any>): Promise<void> {
    const client = await getRedisClient();
    const key = `${this.AGENT_STATE_PREFIX}${requestId}:${agentType}`;
    await client.setEx(key, this.PROCESSING_TTL, JSON.stringify(state));
  }

  static async getAgentState(requestId: string, agentType: string): Promise<Record<string, any> | null> {
    const client = await getRedisClient();
    const key = `${this.AGENT_STATE_PREFIX}${requestId}:${agentType}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async getAllAgentStates(requestId: string): Promise<Record<string, any>> {
    const client = await getRedisClient();
    const pattern = `${this.AGENT_STATE_PREFIX}${requestId}:*`;
    const keys = await client.keys(pattern);
    
    const states: Record<string, any> = {};
    for (const key of keys) {
      const agentType = key.split(':').pop();
      const data = await client.get(key);
      if (agentType && data) {
        states[agentType] = JSON.parse(data);
      }
    }
    
    return states;
  }

  static async clearAgentStates(requestId: string): Promise<void> {
    const client = await getRedisClient();
    const pattern = `${this.AGENT_STATE_PREFIX}${requestId}:*`;
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(keys);
    }
  }
}

// API response caching
export class CacheManager {
  private static readonly CACHE_PREFIX = 'cache:';
  private static readonly DEFAULT_TTL = 15 * 60; // 15 minutes

  static async set(key: string, data: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const client = await getRedisClient();
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    await client.setEx(cacheKey, ttl, JSON.stringify(data));
  }

  static async get(key: string): Promise<any | null> {
    const client = await getRedisClient();
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    const data = await client.get(cacheKey);
    return data ? JSON.parse(data) : null;
  }

  static async delete(key: string): Promise<void> {
    const client = await getRedisClient();
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    await client.del(cacheKey);
  }

  static async exists(key: string): Promise<boolean> {
    const client = await getRedisClient();
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    return (await client.exists(cacheKey)) === 1;
  }
}

// Cleanup function for graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}