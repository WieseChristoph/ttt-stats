import Redis from 'ioredis';
import env from '@/config/env';

export type RedisClientType = Redis;

const RedisUnavailableCooldownMilliseconds = 60_000;

let redisConnection: Promise<RedisClientType | null> | undefined;
let redisUnavailableUntil = 0;

export async function getRedisClient(): Promise<RedisClientType | null> {
    const redisUrl = env.REDIS_URL;
    if (!redisUrl || Date.now() < redisUnavailableUntil) {
        return null;
    }

    if (!redisConnection) {
        const client = new Redis(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            retryStrategy: (attempt) => Math.min(attempt * 250, 5000),
        });

        client.on('error', (error: Error) => {
            console.error('Redis client error', error);
        });

        redisConnection = client
            .connect()
            .then(() => client)
            .catch((error: unknown) => {
                markRedisUnavailable(error);
                return null;
            });
    }

    return redisConnection;
}

export function markRedisUnavailable(error: unknown): void {
    console.error('Redis unavailable', error);
    redisUnavailableUntil = Date.now() + RedisUnavailableCooldownMilliseconds;
    redisConnection = undefined;
}
