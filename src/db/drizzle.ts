import { drizzle } from 'drizzle-orm/node-postgres';
import env from '@/config/env';
import * as schema from './schema';

const DATABASE_URL = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

export const db = drizzle(DATABASE_URL, { schema });
