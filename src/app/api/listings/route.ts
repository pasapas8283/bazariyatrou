import { NextResponse } from 'next/server';
import { readDb, writeDb } from '../../../server/db';
import { normalizeItem } from '../../../lib/marketplace-normalizers';

export async function GET() {
  const db = await readDb();
  const normalized = db.listings.map(normalizeItem);
  const changed = normalized.some((item, idx) => {
    const prev = db.listings[idx] as Record<string, unknown>;
    const prevStatus = prev.status;
    const prevReserved =
      typeof prev.reservedUntil === 'string' ? prev.reservedUntil : undefined;
    return prevStatus !== item.status || prevReserved !== item.reservedUntil;
  });
  if (changed) {
    await writeDb({ ...db, listings: normalized });
  }
  return NextResponse.json({ items: normalized });
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Corps JSON invalide ou trop volumineux.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Format d’annonce invalide.' },
        { status: 400 }
      );
    }

    const item = normalizeItem(body);
    const db = await readDb();
    const withoutSameId = db.listings.filter((entry) => entry.id !== item.id);
    const next = {
      ...db,
      listings: [item, ...withoutSameId],
    };
    await writeDb(next);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Impossible de créer l’annonce.';
    const status = /supabase|db|write|ENOSPC|EACCES/i.test(message)
      ? 503
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
