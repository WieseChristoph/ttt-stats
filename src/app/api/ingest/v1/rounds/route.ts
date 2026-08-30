import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { hasValidIngestToken } from '@/features/ingest/ingest-auth';
import { IngestRoundSchema } from '@/features/ingest/ingest-contracts';
import { createRound, IngestConflictError } from '@/features/ingest/ingest-service';

export async function PUT(request: NextRequest): Promise<Response> {
    if (!hasValidIngestToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body: unknown = await request.json();
        const payload = IngestRoundSchema.parse(body);
        const id = await createRound(payload);

        return NextResponse.json({ id }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }

        if (error instanceof IngestConflictError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        return NextResponse.json({ error: 'Unable to create round' }, { status: 500 });
    }
}
