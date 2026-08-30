import { timingSafeEqual } from 'node:crypto';
import env from '@/config/env';

export function hasValidIngestToken(request: Request): boolean {
    const expected = env.STATS_INGEST_TOKEN;
    const authorization = request.headers.get('authorization');
    if (!expected || !authorization?.startsWith('Bearer ')) {
        return false;
    }

    const received = authorization.slice('Bearer '.length);
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);

    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}
