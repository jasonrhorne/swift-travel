import { Redis } from '@upstash/redis';
import { config } from '@swift-travel/shared/config';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: config.redis.url,
      token: config.redis.token,
    });
  }
  return redisClient;
}
