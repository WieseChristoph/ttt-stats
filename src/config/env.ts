import { z } from 'zod';

export const EnvSchema = z.object({
    DB_USER: z.string().min(1, 'DB_USER is required'),
    DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
    DB_HOST: z.string().min(1, 'DB_HOST is required'),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_NAME: z.string().min(1, 'DB_NAME is required'),
    STATS_INGEST_TOKEN: z.string().min(1, 'STATS_INGEST_TOKEN is required'),
    STEAM_API_KEY: z.string().min(1, 'STEAM_API_KEY is required'),
    REDIS_URL: z.url().optional(),
    STEAM_PROFILE_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
});

const buildEnvironment = {
    ...process.env,
    DB_USER: process.env.DB_USER ?? 'build-user',
    DB_PASSWORD: process.env.DB_PASSWORD ?? 'build-password',
    DB_HOST: process.env.DB_HOST ?? 'build-host',
    DB_NAME: process.env.DB_NAME ?? 'build-database',
    STATS_INGEST_TOKEN: process.env.STATS_INGEST_TOKEN ?? 'build-token',
    STEAM_API_KEY: process.env.STEAM_API_KEY ?? 'build-steam-key',
};

export const env = EnvSchema.parse(process.env.SKIP_ENV_VALIDATION === '1' ? buildEnvironment : process.env);
export default env;
